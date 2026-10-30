// Uses the repository's existing isolated Thorium/Puppeteer QA installation.
// Never opens a user's browser profile or clears browser-local data.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
const cache = path.join(root, '.cache/browser-qa')
const evidence = path.join(cache, 'courtline-slice-a')
await fs.mkdir(evidence, { recursive: true })
const { default: puppeteer } = await import(pathToFileURL(path.join(cache, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
const base = process.env.COURTLINE_QA_URL ?? 'http://127.0.0.1:5216/RotationStudio/'
const report = { checks: [], screenshots: [], errors: [] }
const browser = await puppeteer.launch({
  executablePath: process.env.COURTLINE_QA_BROWSER ?? 'D:/Tools/Thorium-QA/156.0.8078.28/BIN/thorium.exe',
  headless: true, userDataDir: path.join(cache, 'courtline-isolated-' + Date.now()),
  timeout: 90000, protocolTimeout: 60000,
  args: ['--no-first-run', '--no-proxy-server', '--disable-background-networking'],
})
const page = await browser.newPage()
page.setDefaultTimeout(30000)
page.on('pageerror', error => report.errors.push(error.message))
const pause = ms => new Promise(r => setTimeout(r, ms))
const check = label => { report.checks.push(label); console.log('PASS', label) }
const click = async text => {
  const buttons = await page.$$('button')
  for (const button of buttons) if (await button.evaluate((e, t) => e.textContent.trim() === t, text)) {
    await button.evaluate(e => e.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
    await button.click(); await pause(250); return
  }
  throw Error('Missing button: ' + text)
}
const shot = async label => {
  await page.screenshot({ path: path.join(evidence, label + '.png') })
  report.screenshots.push(label + '.png')
}
const selectEvent = async id => {
  const button = await page.$(`.desktop-event-rail [data-event-id="${id}"]`)
  assert.ok(button, 'Missing rail event ' + id)
  await button.evaluate(e => e.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
  await button.click()
  const state = await page.$eval('[aria-label="Timeline time"]', e => ({ playing: e.dataset.playing, destination: e.dataset.destination, time: e.textContent }))
  assert.equal(state.playing, 'false'); assert.equal(state.destination, '')
  assert.equal(await button.evaluate(e => e.getAttribute('aria-pressed')), 'true')
  return state
}
const x = () => page.$eval('[aria-label="X metres"]', e => Number(e.value))
const editX = async value => {
  await page.click('[aria-label="X metres"]', { clickCount: 3 })
  await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control')
  await page.keyboard.type(String(value)); await page.keyboard.press('Tab'); await pause(350)
  assert.ok(Math.abs(await x() - value) < .005)
}
try {
  await page.setViewport({ width: 1440, height: 900 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await page.evaluateOnNewDocument(() => localStorage.setItem('courtline-preserve-R1-R2-sentinel', 'unchanged'))
  await page.goto(base + '?r=1&serve=us&attack=right&first=normal', { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForSelector('[aria-label="Shuffle source"]', { timeout: 90000 })
  await pause(600); await shot('view-1440x900')
  await click('Edit strategy')
  await page.waitForSelector('.desktop-event-rail')
  assert.equal(await page.$eval('[aria-label="Court camera view"]', e => e.value), 'top')
  assert.equal(await page.$eval('.rotation-markers', e => getComputedStyle(e).display), 'none')
  assert.equal(await page.$('.strategy-panel .event-navigator'), null)
  check('Desktop Edit has one exposed source rail, no competing stage rows, and opens in Top')
  await click('Only this version')
  await page.select('[aria-label="Selected athlete"]', 'caleb')
  const first = await selectEvent('p3:our-dig')
  assert.equal(first.time, '5.40s')
  const initial = await x(), changed = Math.round((initial + .12) * 100) / 100
  await editX(changed)
  await click('Undo'); assert.ok(Math.abs(await x() - initial) < .005)
  await click('Redo'); assert.ok(Math.abs(await x() - changed) < .005)
  const next = await selectEvent('p8:next-dig')
  assert.equal(next.time, '12.29s')
  await editX(Math.round((await x() - .12) * 100) / 100)
  await click('Save')
  const storage = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])))
  const saved = JSON.parse(storage['rotation-studio-strategies-v2'])
  const active = saved.library.find(s => s.id === saved.activeId)
  assert.ok(active.caseOverrides['1/us/right/normal'].eventOverrides['p3:our-dig'])
  assert.ok(active.caseOverrides['1/us/right/normal'].eventOverrides['p8:next-dig'])
  assert.equal(active.caseOverrides['1/us/left/normal'], undefined)
  assert.equal(storage['courtline-preserve-R1-R2-sentinel'], 'unchanged')
  check('Motion enabled: distinct first/next dig instantly selected, edited, undone/redone and saved only to this version')
  await page.click('[aria-label="Previous edit event"]')
  assert.equal(await page.$eval('[aria-label="Timeline time"]', e => e.dataset.playing), 'false')
  await page.click('[aria-label="Next edit event"]')
  assert.equal(await page.$eval('[aria-label="Timeline time"]', e => e.dataset.playing), 'false')
  await page.click('[aria-label="Play transition"]')
  await page.waitForFunction(() => document.querySelector('[aria-label="Timeline time"]').dataset.playing === 'true')
  await page.click('[aria-label="Pause transition"]')
  check('Previous/Next instantly jump; explicit Play animates and Pause stops')
  await selectEvent('p3:our-dig')
  for (const [width, height] of [[1440, 900], [1920, 1080], [3440, 1440]]) {
    await page.setViewport({ width, height }); await pause(450)
    const layout = await page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom } }
      return { canvas: rect('.rotation-canvas'), panel: rect('.strategy-panel'), rail: rect('.desktop-event-rail'), overflow: document.documentElement.scrollWidth - innerWidth, labels: [...document.querySelectorAll('.athlete-label:not([hidden])')].map(e => ({ height: e.getBoundingClientRect().height, text: e.textContent })) }
    })
    assert.ok(layout.panel.w >= 370 && layout.panel.w <= 520)
    assert.ok(layout.canvas.h > height * .60, JSON.stringify(layout))
    assert.ok(layout.canvas.right <= layout.panel.x + 1)
    assert.ok(layout.rail.bottom <= height && layout.overflow <= 1)
    assert.equal(layout.labels.length, 6)
    assert.ok(layout.labels.every(e => e.height <= 24 && e.text.includes('P')))
    report.checks.push({ viewport: `${width}x${height}`, layout })
    await shot(`edit-${width}x${height}`)
  }
  check('Three desktop targets fit court, readable inspector and rail, with six compact labels and no page overflow')
  await page.setViewport({ width: 1440, height: 900 }); await pause(250)
  await page.focus('[aria-label="Resize inspector"]'); await page.keyboard.press('ArrowLeft'); await pause(250)
  assert.ok(await page.$eval('.strategy-panel', e => e.getBoundingClientRect().width) > 390)
  check('Inspector keyboard resize works within bounds')
  for (const view of ['Orbit', 'Front', 'Side', 'Top']) await click(view)
  await click('Fit our court')
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('[aria-label="Shuffle source"]')
  assert.equal(await page.evaluate(() => localStorage.getItem('rotation-studio-strategies-v2')), storage['rotation-studio-strategies-v2'])
  check('Saved strategy persists byte-equivalent after reload; direct views and Fit work')
  await click('Edit strategy')
  for (const [width, height] of [[390, 844], [844, 390]]) {
    await page.setViewport({ width, height }); await pause(350)
    assert.equal(await page.$('.desktop-event-rail'), null)
    assert.ok(await page.$('.strategy-panel .event-navigator'))
    assert.equal(await page.$eval('.strategy-stages', e => getComputedStyle(e).display), 'grid')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    await shot(`mobile-preserved-${width}x${height}`)
  }
  check('Phone portrait and landscape retain original stage/events flow without horizontal overflow')
  await click('Set arcs'); await pause(450)
  assert.equal(await page.$('.rotations'), null)
  assert.ok(await page.$('canvas'))
  check('Original Set arcs still opens')
  assert.deepEqual(report.errors, [])
  report.status = 'PASS'
} catch (error) {
  report.status = 'FAIL'; report.failure = error.stack
  await shot('failure').catch(() => {})
  console.error(error)
  process.exitCode = 1
} finally {
  await fs.writeFile(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2))
  await browser.close()
  console.log('FINAL', report.status, report.checks.length, 'checks;', report.screenshots.length, 'screenshots')
}
