// Scoped S07C host QA. Use existing Puppeteer only; no installs or test hooks.
// Start built preview with: npm run preview -- --host 127.0.0.1 --port PORT --strictPort --base=/RotationStudio/
// Run: node --experimental-strip-types visualizer/tests/strategyS07C.browser.mjs http://127.0.0.1:PORT/RotationStudio/
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.cache/browser-qa')
const url = new URL(process.argv[2] || 'http://127.0.0.1:59436/RotationStudio/')
const { default: puppeteer } = await import(pathToFileURL(path.join(dir, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
const plans = JSON.parse(await fs.readFile(path.join(dir, '../../visualizer/public/plans/rotations.json'), 'utf8'))
const v2 = { kind: 'rotation-studio-strategy', schemaVersion: 2, id: 's07c-host-draft', name: 'S07C isolated saved draft', author: 'QA', baseRevision: '8c0fb5d', overrides: {}, notes: { team: { '1/they': { Receive: 'Keep this user-authored DRAFT note unchanged.' } } } }
const v1 = { ...v2, schemaVersion: 1, id: 's07c-legacy-backup' }; delete v1.notes
const fixtures = { 'rotation-studio-strategies-v1': JSON.stringify({ schemaVersion: 1, library: [v1], activeId: v1.id }), 'rotation-studio-strategies-v2': JSON.stringify({ schemaVersion: 2, library: [v2, { ...v2, id: 's07c-other-user-draft', name: 'Other user draft' }], activeId: v2.id }) }
const result = { status: 'FAIL', base: url.href, checks: [], errors: [], browserAcceptance: 'pending', screenshots: [] }
let browser, page
const mark = (label, data) => { result.checks.push({ label, data }); console.log('PASS', label, data || '') }
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
try {
  // Verify actual JavaScript MIME and body, not merely HTTP 200.
  const html = await (await fetch(url)).text(), asset = html.match(/src="([^"]+\.js)"/)[1]
  const response = await fetch(new URL(asset, url)), js = await response.text()
  assert.ok(response.ok && /javascript/.test(response.headers.get('content-type')) && !js.trimStart().startsWith('<'), 'Pages-base JavaScript must be JavaScript')
  mark('Pages-base compiled JS content-type', response.headers.get('content-type'))
  result.launchAttempted = true
  browser = await puppeteer.launch({ executablePath: process.env.STUDIO_QA_BROWSER || 'D:/Tools/Thorium-QA/156.0.8078.28/BIN/thorium.exe', userDataDir: path.join(dir, `s07c-isolated-${Date.now()}`), headless: true, timeout: 30000, protocolTimeout: 20000, args: ['--no-first-run', '--no-proxy-server', '--disable-background-networking'] })
  result.browser = await browser.version(); page = await browser.newPage(); page.setDefaultTimeout(20000)
  page.on('pageerror', e => result.errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error' && !/fonts.googleapis.com/.test(m.text())) result.errors.push(m.text()) })
  await page.evaluateOnNewDocument(fixtures => {
    for (const [k, v] of Object.entries(fixtures)) if (localStorage.getItem(k) === null) localStorage.setItem(k, v)
    window.qaWrites = []
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function(k, v) { window.qaWrites.push(k); return original.call(this, k, v) }
  }, fixtures)
  const goto = async search => { const next = new URL(url); next.search = search; await page.goto(next.href, { waitUntil: 'domcontentloaded', timeout: 20000 }); await page.waitForSelector('[aria-label="Shuffle source"]'); await delay(500) }
  const snapshot = () => page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]))))
  const caseId = () => page.$eval('[aria-label="Shuffle source"]', e => e.dataset.case)
  const time = () => page.$eval('[aria-label="Timeline time"]', e => ({ time: parseFloat(e.textContent), playing: e.dataset.playing }))
  const click = async label => {
    for (const button of await page.$$('button')) if (await button.evaluate((e, label) => e.textContent.trim() === label, label)) { await button.evaluate(e => e.scrollIntoView({ block: 'nearest' })); await button.click(); return }
    throw Error(`Missing button ${label}`)
  }
  const snap = async label => { const target = path.join(dir, `V5-S07C-${label}.png`); await page.screenshot({ path: target }); result.screenshots.push(target) }
  const seed = async () => {
    await page.$eval('.shuffle-history', e => { e.open = true })
    await page.$eval('[aria-label="Shuffle seed"]', e => e.scrollIntoView({ block: 'nearest' }))
    await page.click('[aria-label="Shuffle seed"]', { clickCount: 3 }); await page.type('[aria-label="Shuffle seed"]', '41'); await page.keyboard.press('Tab')
    await page.$eval('.shuffle-history', e => { e.open = false })
  }
  const sourceCheck = async () => {
    const data = await page.$eval('[aria-label="Shuffle source"]', e => ({ id: e.dataset.case, receiver: e.dataset.receiver, text: e.textContent }))
    const [r, serve, attack, first] = data.id.split('/')
    assert.equal(r, '1'); assert.equal(serve, 'they')
    const root = plans.scenarios.find(s => s.rotation === Number(r) && s.serve === serve)
    const source = [root, ...Object.values(root.alternates)].find(s => s.tactics.opponentAttack === attack && s.tactics.firstTouch === first)
    assert.equal(data.receiver, source.firstContact.player); assert.match(data.text, /DRAFT/)
    assert.equal(await page.$eval('[aria-label="Rotation"] button[aria-pressed="true"]', e => e.textContent), 'R1')
    assert.equal(await page.$eval('[aria-label="Serve ownership"] button[aria-pressed="true"]', e => e.textContent), 'They serve')
    return data.id
  }
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 }); await goto('mode=rotations&r=1&serve=they')
  const stored = await snapshot(); await seed()
  const history = []
  for (let i = 0; i < 4; i++) { await click('Next variation'); history.push(await sourceCheck()); assert.deepEqual(await time(), { time: 0, playing: 'false' }) }
  assert.equal(new Set(history).size, 4); await snap('desktop-next')
  await page.$eval('.shuffle-history', e => { e.open = true }); await click('Previous variation'); assert.equal(await caseId(), history[2]); await page.$eval('.shuffle-history', e => { e.open = false }); await click('Next variation'); assert.equal(await caseId(), history[3])
  await goto('mode=rotations&r=1&serve=they'); await seed()
  const repeat = []; for (let i = 0; i < 4; i++) { await click('Next variation'); repeat.push(await caseId()) }
  assert.deepEqual(repeat, history); mark('Seeded sequence, four distinct actual cases, previous/next and reload repeatability', history)
  // Complete a real authored track; inspect intermediate live court before Off.
  const before = await caseId(), [r, serve, attack, first] = before.split('/')
  const root = plans.scenarios.find(s => s.rotation === Number(r) && s.serve === serve)
  const source = [root, ...Object.values(root.alternates)].find(s => s.tactics.opponentAttack === attack && s.tactics.firstTouch === first)
  await page.$eval('[aria-label="Scrub rotations"]', (e, t) => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(e, t); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })) }, source.duration - .5)
  assert.ok((await time()).time >= source.duration - .51)
  await page.click('[aria-label="Play shuffle"]')
  await page.waitForFunction(old => document.querySelector('[aria-label="Shuffle source"]').dataset.case !== old, {}, before)
  assert.equal((await time()).playing, 'true'); await delay(300); await snap('desktop-playing')
  await page.click('[aria-label="Shuffle Play"]'); await delay(100); const stopped = await time(), finalCase = await caseId(); await delay(400)
  assert.equal(stopped.playing, 'false'); assert.deepEqual(await time(), stopped); assert.equal(await caseId(), finalCase)
  assert.equal(await snapshot(), stored); assert.deepEqual(await page.evaluate(() => window.qaWrites), [])
  mark('Opt-in playback advances after source end; Off freezes selected case and library unchanged')
  // Mode switches must disarm before exposing editing/library controls.
  await page.click('[aria-label="Shuffle Play"]'); await page.click('[aria-label="Play shuffle"]'); await click('Strategies')
  assert.equal((await time()).playing, 'false'); assert.equal(await page.$('[aria-label="Shuffle Play"]'), null)
  await click('View'); assert.equal(await page.$eval('[aria-label="Shuffle Play"]', e => e.getAttribute('aria-pressed')), 'false')
  await page.click('[aria-label="Shuffle Play"]'); await click('Edit strategy'); assert.equal(await page.$('[aria-label="Shuffle Play"]'), null); assert.equal(await page.$('[aria-label="Scrub rotations"]'), null)
  assert.equal((await time()).playing, 'false'); await click('View'); assert.equal(await snapshot(), stored)
  mark('Library and Edit disarm shuffle; S07B edit scrub policy and saved library retained')
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 }); await delay(300)
    await page.$eval('.shuffle-controls', e => e.scrollIntoView({ block: 'nearest' })); await click('Next variation')
    const geometry = await page.evaluate(() => { const box = s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } }; return { width: innerWidth, scroll: document.documentElement.scrollWidth, court: box('canvas'), shuffle: box('.shuffle-row') } })
    assert.ok(geometry.scroll <= width + 1 && geometry.court.w >= 280 && geometry.court.h >= 150, JSON.stringify(geometry))
    assert.ok(geometry.shuffle.x >= 0 && geometry.shuffle.x + geometry.shuffle.w <= width && geometry.shuffle.y >= 0 && geometry.shuffle.y + geometry.shuffle.h <= height, JSON.stringify(geometry))
    await page.select('[aria-label="Court camera view"]', 'top'); await snap(`${width}x${height}`); mark('Responsive real court and Shuffle pointer controls', geometry)
  }
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  // Fixture setup only: no active overlay, so an invalid linked teaching sample
  // survives until the user explicitly requests an authored variation.
  await page.evaluate(() => { const k = 'rotation-studio-strategies-v2', v = JSON.parse(localStorage.getItem(k)); v.activeId = null; localStorage.setItem(k, JSON.stringify(v)) })
  await goto('mode=rotations&r=1&serve=they&sample=-3,3.5&receiver=unknown')
  assert.equal(await page.$eval('.rotation-play', e => e.disabled), true)
  const invalidStorage = await snapshot(); await click('Next variation')
  assert.match(await page.$eval('.shuffle-notice', e => e.textContent), /invalid.*skip/i)
  assert.match(await page.$eval('[aria-label="Shuffle source"]', e => e.textContent), /Authored V3/)
  assert.equal(await page.$eval('.rotation-play', e => e.disabled), false); assert.equal(await snapshot(), invalidStorage)
  await snap('invalid-skip'); mark('Invalid teaching sample skipped with notice; only authored source selected')
  await click('Set arcs'); await page.waitForSelector('canvas'); await delay(300); await snap('set-arcs'); await click('Skip'); await click('Rotations')
  assert.equal(await page.$eval('[aria-label="Shuffle Play"]', e => e.getAttribute('aria-pressed')), 'false')
  assert.deepEqual(result.errors, []); mark('Original Set arcs WebGL opens and returns with shuffle disabled; zero page exceptions')
  result.browserAcceptance = 'scoped host checks passed; independent parent visual review required'; result.status = 'PASS'
} catch (e) {
  result.failure = e.stack || String(e)
  if (!browser && result.launchAttempted) { result.status = 'PENDING_PARENT'; result.browserAcceptance = 'Sandbox browser/CDP launch failed; no retry. Parent host must run this script and visually review.' }
  console.error(result.failure)
  if (page) await page.screenshot({ path: path.join(dir, 'V5-S07C-failure.png') }).catch(() => {})
} finally {
  if (browser) await browser.close().catch(() => {})
  await fs.writeFile(path.join(dir, 'V5-S07C-browser-result.json'), JSON.stringify(result, null, 2))
  console.log(result.status); process.exitCode = result.status === 'PASS' ? 0 : 1
}
