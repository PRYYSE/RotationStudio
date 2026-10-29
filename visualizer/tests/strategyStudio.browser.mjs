// Run with the existing external Puppeteer QA dependency (no app framework added):
// PUPPETEER_MODULE=/path/to/puppeteer-core/lib/puppeteer/puppeteer-core.js
// CHROME_PATH=/path/to/chrome node tests/strategyStudio.browser.mjs
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
const cache = path.join(root, '.cache/browser-qa')
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE ?? path.join(cache, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  userDataDir: path.join(cache, 'strategy-e2e-profile'), args: ['--no-first-run', '--disable-background-networking', `--disk-cache-dir=${path.join(cache, 'strategy-e2e-disk')}`] })
const base = process.env.STUDIO_URL ?? 'http://127.0.0.1:5173/'
const page = await browser.newPage(), errors = []
page.on('pageerror', e => errors.push(e.message))
const delay = ms => new Promise(r => setTimeout(r, ms))
const read = () => page.evaluate(async () => {
  const { useRotations, activeScenario } = await import('/src/state/rotationStore.ts')
  const { useStrategies } = await import('/src/state/strategyStore.ts')
  const r = useRotations.getState(), s = useStrategies.getState()
  return { strategy: s.working, preview: s.preview, saved: s.saved, library: s.library, stage: s.stage, past: s.past.length, future: s.future.length,
    time: r.time, selected: r.selected, view: r.view, playing: r.playing, scenario: activeScenario(r), example: r.example }
})
async function click(text, scope = '') {
  const buttons = await page.$$(`${scope ? scope + ' ' : ''}button`)
  for (const b of buttons) if (await b.evaluate(el => el.textContent.trim()) === text) { await b.click(); await delay(200); return }
  throw new Error(`Missing button: ${text}`)
}
const stage = text => click(text, 'nav[aria-label="Court stages"]')
async function project(point) {
  return page.evaluate(async p => {
    const THREE = await import('/node_modules/.vite/deps/three.js')
    const r = document.querySelector('canvas').getBoundingClientRect(), aspect = r.width / r.height
    const camera = new THREE.PerspectiveCamera(42, aspect, .1, 150)
    const d = Math.max(6.8 / Math.tan(42 * Math.PI / 360), 5.8 / (Math.tan(42 * Math.PI / 360) * aspect)) * 1.05
    camera.position.copy(new THREE.Vector3(0, 0, 5).addScaledVector(new THREE.Vector3(0, 1, .001).normalize(), d))
    camera.lookAt(0, 0, 5); camera.updateMatrixWorld()
    const q = new THREE.Vector3(p.x, p.y ?? 1.13, p.z).project(camera)
    return { x: r.left + (q.x + 1) * r.width / 2, y: r.top + (1 - q.y) * r.height / 2 }
  }, point)
}
async function drag(point, dx, dy) {
  const p = await project(point)
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + dx, p.y + dy, { steps: 12 }); await page.mouse.up(); await delay(300)
}
try {
  await mkdir(cache, { recursive: true })
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  // This isolated QA browser contains test data only.
  await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: 'domcontentloaded' })
  await page.goto(new URL('?mode=rotations&sample=0,5.8&receiver=caleb',base).href, { waitUntil: 'domcontentloaded' })
  assert.equal((await read()).example?.receiver, 'caleb', 'legacy sample links survive an initial no-strategy mount')
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('nav[aria-label="Tactical phase"]')
  for (const serve of ['they', 'us']) {
    await click(serve === 'us' ? 'Us serve' : 'They serve')
    for (const name of ['Receive', 'Attack', 'Defend']) {
      await click(name, 'nav[aria-label="Tactical phase"]')
      const r = await read(), expected = name === 'Receive' ? r.scenario.firstContact.time : r.scenario.phases.find(p => p.label === (name === 'Attack' ? 'Our attack' : 'Defence ready')).time
      assert.equal(r.time, expected)
    }
  }
  await click('They serve'); await click('Edit strategy'); await delay(500)
  assert.equal((await read()).view, 'top')
  await stage('Receive'); await page.select('[aria-label="Selected athlete"]', 'caleb')
  let r = await read(), t = r.scenario.firstContact.time, p = r.scenario.tracks.caleb.find(k => k.time === t), history = r.past
  await drag(p, 36, -10)
  r = await read()
  assert.ok(r.strategy.overrides['1/they'].anchors.Receive.caleb, 'real player drag writes a stage anchor')
  assert.equal(r.past, history + 1, 'one history action per real drag')
  const playerPoint = r.strategy.overrides['1/they'].anchors.Receive.caleb
  await click('Undo'); assert.equal((await read()).strategy.overrides['1/they'].anchors?.Receive?.caleb, undefined)
  await click('Redo'); assert.deepEqual((await read()).strategy.overrides['1/they'].anchors.Receive.caleb, playerPoint)
  await click('Add bend'); r = await read()
  const bend = r.strategy.overrides['1/they'].routes.Receive.caleb[0], beforeBend = { ...bend }; history = r.past
  await drag({ ...bend, y: .18 }, 26, 20); r = await read()
  assert.notDeepEqual(r.strategy.overrides['1/they'].routes.Receive.caleb[0], beforeBend, 'real waypoint drag changes route')
  assert.equal(r.past, history + 1)
  await page.screenshot({ path: path.join(cache, 'v4-desktop-route.png') })
  await stage('Set')
  for (const id of ['harry', 'logan', 'georgia']) {
    await page.select('[aria-label="Selected athlete"]', id)
    r = await read(); p = r.scenario.tracks[id].find(k => k.time === r.scenario.secondContact.time)
    await drag(p, id === 'georgia' ? -22 : 22, 8)
  }
  r = await read(); assert.ok(r.strategy.overrides['1/they'].setterTarget)
  assert.ok(r.strategy.overrides['1/they'].anchors.Set.logan); assert.ok(r.strategy.overrides['1/they'].anchors.Set.georgia)
  await click('Select gold target'); r = await read()
  await drag({ x: r.scenario.setterTarget.x + .46, z: r.scenario.setterTarget.z, y: .06 }, 15, -8)
  const edited = (await read()).strategy.overrides['1/they']
  await click('Rename / author'); await page.locator('[aria-label="Strategy name"]').fill('R1 browser foundation')
  await page.locator('[aria-label="Strategy author"]').fill('QA coach'); await click('Apply name'); await click('Save')
  r = await read(); assert.equal(r.saved, true); const savedId = r.strategy.id
  await click('R2'); await click('R1'); await page.reload({ waitUntil: 'domcontentloaded' })
  r = await read(); assert.equal(r.strategy.id, savedId); assert.deepEqual(r.strategy.overrides['1/they'], edited)
  await click('Strategies'); await click('Duplicate'); await click('Save')
  r = await read(); assert.notEqual(r.strategy.id, savedId); assert.equal(r.library.length, 2)
  await click('Delete'); await click('Cancel'); assert.equal((await read()).library.length, 2)
  await click('Delete'); await click('Confirm delete'); assert.equal((await read()).library.length, 1)
  await page.select('[aria-label="Saved strategy"]', savedId)
  const json = JSON.stringify((await read()).strategy)
  const input = await page.$('input[aria-label="Import sparse strategy JSON"]')
  const { writeFile } = await import('node:fs/promises')
  await writeFile(path.join(cache, 'strategy-import.json'), json)
  await input.uploadFile(path.join(cache, 'strategy-import.json')); r = await read()
  assert.equal(r.preview, true); assert.equal(r.library.length, 1)
  await click('Save a copy'); assert.equal((await read()).library.length, 2)
  const share = await page.evaluate(async () => { const { strategyLink } = await import('/src/lib/strategyDraft.ts'); const { useStrategies } = await import('/src/state/strategyStore.ts'); return strategyLink(location.href, useStrategies.getState().working) })
  assert.ok(share)
  await page.goto(share, { waitUntil: 'domcontentloaded' }); r = await read()
  assert.equal(r.preview, true); assert.equal(r.library.length, 2)
  assert.match(await page.evaluate(() => document.body.innerText), /Preview/)
  await click('Strategies'); await click('Save a copy'); assert.equal((await read()).library.length, 3)
  await click('View'); await click('Play'); await delay(400); assert.ok((await read()).playing || (await read()).time > 0)
  await click('Edit strategy')
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); await delay(700)
  await stage('Receive'); await page.select('[aria-label="Selected athlete"]', 'caleb')
  await page.evaluate(() => document.querySelector('main.rotations').scrollTo(0, 0)); await delay(200)
  r = await read(); p = r.scenario.tracks.caleb.find(k => k.time === r.scenario.firstContact.time); history = r.past
  await drag(p, 18, 10); r = await read(); assert.equal(r.past, history + 1, 'narrow viewport player drag')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no horizontal overflow')
  await page.screenshot({ path: path.join(cache, 'v4-mobile-court.png') })
  await page.locator('[aria-label="Selected athlete"]').scrollIntoView(); await page.screenshot({ path: path.join(cache, 'v4-mobile-controls.png') })
  await click('View'); await click('Set arcs'); await page.waitForSelector('canvas'); assert.ok(await page.$('canvas'))
  assert.deepEqual(errors, [])
  console.log('PASS: exact viewer landmarks; real desktop player/setter/attacker/waypoint/target drags; per-gesture undo; save/reload; duplicate/delete; import/shared previews and independent copies; View playback; 390px drag/no overflow; Set arcs accessible; no runtime errors.')
} finally { await page.screenshot({ path: path.join(cache, 'v4-e2e-last.png') }); await browser.close() }

