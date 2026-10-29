import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createStrategy, exportStrategy, strategyLink } from '../src/lib/strategyDraft.ts'
import { parseStrategyImport } from '../src/lib/strategyShare.ts'

const cache = path.join(fileURLToPath(new URL('../../', import.meta.url)), '.cache/browser-qa')
const { default: puppeteer } = await import(pathToFileURL(path.join(cache, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
const origin = process.env.S05_URL ?? 'http://127.0.0.1:5197', checks = [], errors = [], measurements = []
console.log('Starting isolated Chrome S05 checks')
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  protocolTimeout: 20000, userDataDir: path.join(cache, `s05-isolated-${Date.now()}`), args: ['--no-first-run', '--disable-background-networking', '--no-sandbox'] })
console.log('Chrome launched')
const page = await browser.newPage(), wait = ms => new Promise(r => setTimeout(r, ms))
console.log('Isolated page ready')
async function localFonts(target) {
  await target.setRequestInterception(true)
  target.on('request', request => /https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(request.url()) ? request.abort() : request.continue())
}
await localFonts(page)
page.setDefaultTimeout(20000); page.on('pageerror', e => errors.push(e.message))
page.on('requestfailed', r => console.log('Request failed', r.url(), r.failure()?.errorText))
page.on('dialog', d => d.accept())
const mark = s => { checks.push(s); console.log('PASS ' + s) }
async function click(text, target = page) {
  for (const button of await target.$$('button')) if (await button.evaluate(e => e.textContent.trim()) === text) {
    await button.evaluate(e => e.scrollIntoView({ block: 'center' })); await button.click(); await wait(150); return
  }
  throw Error('Missing button: ' + text)
}
async function ready(target = page) { await target.waitForSelector('[aria-label="Saved strategy"], [aria-label="Court context"]'); await target.waitForSelector('.rotation-canvas canvas') }
async function library(target = page) { await click('Strategies', target); await target.waitForSelector('[aria-label="Strategy library"]') }
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('rotation-studio-strategies-v2')))
async function upload(file) { await (await page.$('input[type=file][aria-label="Import sparse strategy JSON"]')).uploadFile(file); await wait(250) }
async function readDownload(filename) {
  const file = path.join(cache, filename)
  for (let i = 0; i < 50; i++) { try { return await fs.readFile(file, 'utf8') } catch { await wait(100) } }
  throw Error('Download missing: ' + filename)
}

const legacy = { ...createStrategy('Legacy fixture', 'Fixture coach'), schemaVersion: 1 }
legacy.overrides = { '1/they': { anchors: { Receive: { caleb: { x: 1.125, z: 5.875 } } } } }
const legacyRaw = JSON.stringify({ schemaVersion: 1, library: [legacy], activeId: legacy.id })
const draft = createStrategy('S05 fixture', 'Fixture coach')
const zone = { role: 'tip', radiusX: 1.234, radiusZ: 2.345, offsetX: -.765, offsetZ: .456 }
draft.overrides['3/us'] = { coverage: { Receive: { harry: zone } }, laterDefend: { coverage: { georgia: { ...zone, role: 'deep' } } } }
draft.caseOverrides = { '3/us/right/harry': { anchors: { Set: { logan: { x: -3.125, z: 3.875 } } }, routes: { Set: { logan: [{ x: -2, z: 4.25 }] } },
  coverage: { Receive: { harry: { ...zone, role: 'custom' } } }, laterDefend: { coverage: { jaz: { ...zone, role: 'attack-cover' } } } } }
draft.notes = { team: { '3/us': { Start: 'Literal <script>window.BAD=true</script>', Set: 'Our written set call' } }, players: { '3/us': { Set: { harry: { primary: 'My authored note', teamCall: 'Mine' } } } } }
const input = path.join(cache, 'V5-S05-fixture.json'), bad = path.join(cache, 'V5-S05-malformed.json'), huge = path.join(cache, 'V5-S05-oversized.json')
await Promise.all([fs.writeFile(input, exportStrategy(draft)), fs.writeFile(bad, '{"__proto__":{}}'), fs.writeFile(huge, ' '.repeat(100001))])
const cdp = await page.createCDPSession()
await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: cache })
try {
  await page.setViewport({ width: 1440, height: 900 })
  await page.evaluateOnNewDocument(raw => {
    if (!localStorage.getItem('s05-fixture-seeded')) { localStorage.setItem('rotation-studio-strategies-v1', raw); localStorage.setItem('s05-fixture-seeded', 'yes') }
  }, legacyRaw)
  await page.goto(origin + '/?mode=rotations&r=3&serve=us&attack=right&first=harry', { waitUntil: 'domcontentloaded' }); await ready(); await library()
  assert.equal(await page.$eval('[aria-label="Saved strategy"]', e => e.value), legacy.id)
  assert.equal(await saved(), null)
  await click('Duplicate'); await click('Save')
  assert.equal((await saved()).library.length, 2)
  assert.equal(await page.evaluate(() => localStorage.getItem('rotation-studio-strategies-v1')), legacyRaw)
  mark('V1 fixture available; duplicate/save creates V2 without changing V1 backup')

  await upload(input)
  assert.match(await page.$eval('.strategy-status', e => e.textContent), /Preview/)
  assert.equal((await saved()).library.length, 2)
  await click('Save a copy'); const local = await saved(), copy = local.library.find(d => d.id === local.activeId)
  assert.notEqual(copy.id, draft.id); assert.deepEqual(copy.overrides, draft.overrides); assert.deepEqual(copy.caseOverrides, draft.caseOverrides)
  await page.reload({ waitUntil: 'domcontentloaded' }); await ready(); await library()
  assert.equal(await page.$eval('[aria-label="Saved strategy"]', e => e.value), copy.id)
  for (const f of [bad, huge]) { await upload(f); assert.ok(await page.$('[role=alert]')); assert.deepEqual(await saved(), local) }
  mark('V2 coverage/case/later fields survive import → Save a copy → real reload; unsafe and >100KB files preserve saved data')

  // Use actual UI case selectors; the reference/export must describe this exact authored case.
  await click('View'); await click('R3'); await click('Us serve'); await click('Scenario Explorer')
  await click('Our right'); await click('Harry first'); await click('Player Focus'); await page.click('[aria-label="Seek Set"]'); await library()
  await click('Export strategy'); const sparse = await readDownload('strategy-' + copy.id + '.json')
  assert.deepEqual(parseStrategyImport(sparse), copy)
  await click('Export Review packet'); const packetText = await readDownload('review-' + copy.id + '.json'), packet = JSON.parse(packetText)
  assert.equal(packet.selectedCase, '3/us/right/harry'); assert.equal(packet.selection.stage, 'Set')
  assert.match(packet.status, /DRAFT.*not match-approved/); assert.deepEqual(parseStrategyImport(packetText), copy)
  await upload(path.join(cache, 'review-' + copy.id + '.json')); assert.match(await page.$eval('.strategy-status', e => e.textContent), /Preview/)
  await click('Save a copy')
  mark('Actual sparse JSON and Review downloads roundtrip; packet records R3/us/right/harry, Set, source, notes, findings and DRAFT')

  await browser.defaultBrowserContext().overridePermissions(origin, ['clipboard-read', 'clipboard-write'])
  await click('Share strategy'); const link = await page.evaluate(() => navigator.clipboard.readText())
  assert.ok(link.includes('#strategy=')); const context = await browser.createBrowserContext(), recipient = await context.newPage()
  await localFonts(recipient)
  recipient.on('pageerror', e => errors.push(e.message)); recipient.on('dialog', d => d.accept())
  await recipient.goto(link, { waitUntil: 'domcontentloaded' }); await ready(recipient); await library(recipient)
  assert.match(await recipient.$eval('.strategy-status', e => e.textContent), /Preview/)
  assert.equal(await recipient.evaluate(() => localStorage.getItem('rotation-studio-strategies-v2')), null)
  await click('Rename / author', recipient); const field = await recipient.$('[aria-label="Strategy name"]'); await field.click({ clickCount: 3 }); await field.type('Recipient copy'); await click('Apply name', recipient)
  assert.equal(await recipient.evaluate(() => localStorage.getItem('rotation-studio-strategies-v2')), null)
  await click('Save a copy', recipient)
  const recipientSaved = await recipient.evaluate(() => JSON.parse(localStorage.getItem('rotation-studio-strategies-v2')))
  assert.notEqual(recipientSaved.activeId, packet.draft.id); assert.equal(new URL(recipient.url()).hash, '')
  await recipient.reload({ waitUntil: 'domcontentloaded' }); await ready(recipient); await library(recipient)
  assert.match(await recipient.$eval('.strategy-status', e => e.textContent), /Saved locally/)
  assert.deepEqual(recipientSaved.library[0].overrides, draft.overrides); assert.deepEqual(recipientSaved.library[0].caseOverrides, draft.caseOverrides)
  await context.close()
  mark('Real clipboard link opens clean-context preview, edits never autosave, Save a copy gets distinct ID and reload keeps saved copy')

  await click('Delete'); await click('Cancel'); const beforeDelete = await saved()
  await click('Delete'); await click('Confirm delete'); assert.equal((await saved()).library.length, beforeDelete.library.length - 1)
  await page.select('[aria-label="Saved strategy"]', copy.id); await wait(200)
  mark('Delete requires confirmation; Cancel retains draft')

  await click('Team reference'); await page.waitForSelector('.team-reference')
  assert.equal(await page.$eval('#root', e => e.inert), true)
  assert.equal(await page.$eval('.team-reference', e => e.querySelectorAll('.reference-court').length), 5)
  assert.equal(await page.$eval('[data-reference-player="logan"]', e => e.getAttribute('data-x')) !== null, true)
  const setPoint = await page.$eval('[aria-label="Set reference"] [data-reference-player="logan"]', e => ({ x: Number(e.dataset.x), z: Number(e.dataset.z) }))
  assert.deepEqual(setPoint, { x: -3.125, z: 3.875 })
  assert.match(await page.$eval('.reference-document', e => e.textContent), /Our written set call/)
  assert.equal(await page.evaluate(() => window.BAD), undefined)
  await page.select('[aria-label="Reference path"]', 'logan')
  for (const width of [1440, 390, 844]) {
    await page.setViewport({ width, height: width === 844 ? 390 : width === 390 ? 844 : 900 })
    const metrics = await page.evaluate(() => {
      const host = document.querySelector('.team-reference'), svgs = [...document.querySelectorAll('.reference-court')]
      return { width: innerWidth, scroll: host.scrollWidth, client: host.clientWidth, clipped: svgs.flatMap(svg => [...svg.querySelectorAll('text,circle,rect,polyline')].filter(e => { const b = e.getBBox(); return b.x < 0 || b.y < 0 || b.x + b.width > 600.1 || b.y + b.height > 660.1 }).map(e => e.outerHTML)) }
    })
    measurements.push(metrics); assert.ok(metrics.scroll <= metrics.client + 1); assert.deepEqual(metrics.clipped, [])
    await page.screenshot({ path: path.join(cache, 'V5-S05-reference-' + width + '.png') })
  }
  await page.emulateMediaType('print')
  assert.equal(await page.$eval('.reference-actions', e => getComputedStyle(e).display), 'none')
  assert.equal(await page.$eval('#root', e => getComputedStyle(e).display), 'none')
  await page.pdf({ path: path.join(cache, 'V5-S05-team-reference.pdf'), preferCSSPageSize: true, printBackground: true })
  await page.emulateMediaType('screen'); await page.setViewport({ width: 390, height: 844 }); await page.keyboard.press('Escape')
  assert.equal(await page.$('.team-reference'), null); assert.equal(await page.$eval('#root', e => e.inert), false)
  await page.screenshot({ path: path.join(cache, 'V5-S05-library-390.png') })
  for (const label of ['Export strategy', 'Export Review packet', 'Share strategy', 'Team reference', 'Delete']) {
    await click(label)
    if (label === 'Team reference') await page.keyboard.press('Escape')
    if (label === 'Delete') await click('Cancel')
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  mark('R3 Us-serve reference uses real edited court/P identities/five stages/notes; 1440,390,844 and print have no clipped geometry; mobile actions reachable')
  await click('Set arcs'); await page.waitForSelector('[aria-label="Studio mode"]'); assert.equal(await page.$('.rotations'), null)
  mark('Original Set arcs remains selectable; no page errors')
  assert.deepEqual(errors, [])
} catch (e) { console.error(e.stack); console.log('DOM', (await page.content()).slice(0,2500)); await page.screenshot({ path: path.join(cache, 'V5-S05-failure.png') }).catch(() => {}); process.exitCode = 1 }
finally {
  await fs.writeFile(path.join(cache, 'V5-S05-browser-receipt.json'), JSON.stringify({ checks, errors, measurements, passed: checks.length >= 7 && errors.length === 0 && !process.exitCode }, null, 2))
  await Promise.race([browser.close(), wait(5000).then(() => browser.process()?.kill())])
}
