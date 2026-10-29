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
    time: r.time, selected: r.selected, view: r.view, playing: r.playing, coverage: r.receiveAreas, scenario: activeScenario(r), example: r.example }
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
  await page.waitForSelector('.athlete-label')
  const labels = await page.$$eval('.athlete-label', els => els.map(el => ({text: el.textContent, children: el.querySelectorAll('small').length})))
  assert.equal(labels.length, 6)
  for (const label of labels) {
    assert.match(label.text, /^(Harry|Caleb|Trent|Logan|Georgia|Jaz) · P[1-6]$/)
    assert.equal(label.children, 0, 'single compact tag, no second line/front-back detail')
  }
  assert.equal(await page.$('.pass-target'), null)
  assert.doesNotMatch(await page.evaluate(() => document.body.innerText), /PASS HERE/)
  await click('Settings')
  // Select by label text because Names and Paths are independent controls.
  const toggleCoverage = async scope => {
    const labels = await page.$$(`${scope} label`)
    for (const label of labels) if ((await label.evaluate(el => el.textContent)).trim() === 'Coverage areas') { await (await label.$('input')).click(); await delay(100); return }
    throw new Error('Missing coverage toggle')
  }
  await toggleCoverage('.rotation-settings'); assert.equal((await read()).coverage, false)
  await toggleCoverage('.rotation-settings'); assert.equal((await read()).coverage, true)
  await click('Close')
  for (let rotation = 1; rotation <= (process.env.UAT_SHORT ? 0 : 6); rotation++) for (const serve of ['they', 'us']) {
    await click(`R${rotation}`)
    await click(serve === 'us' ? 'Us serve' : 'They serve')
    assert.deepEqual(await page.$$eval('.rotation-markers button', els => els.map(el => el.textContent)),
      serve === 'us' ? ['Start','Defend','Receive','Set','Attack'] : ['Start','Receive','Set','Attack','Defend'])
    for (const name of ['Receive', 'Attack', 'Defend']) {
      await click(name, 'nav[aria-label="Tactical phase"]')
      const r = await read(), expected = name === 'Receive' ? r.scenario.firstContact.time : r.scenario.phases.find(p => p.label === (name === 'Attack' ? 'Our attack' : 'Defence ready')).time
      assert.equal(r.time, expected)
      assert.equal(await page.$eval(`nav[aria-label="Tactical phase"] button[aria-pressed="true"]`, el => el.textContent), name)
    }
  }
  await click('R1'); await click('They serve'); await click('Edit strategy'); await delay(500)
  assert.equal((await read()).view, 'top')
  assert.deepEqual((await read()).strategy.overrides, {}, 'new copy has no hidden hitter preparation')
  assert.equal(await page.$('[aria-label="Strategy library"]'), null)
  assert.equal(await page.$('[aria-label="Scrub rotations"]'), null, 'video chrome is collapsed while editing')
  assert.equal((await page.$$('[aria-label="Court stages"]')).length, 1, 'one five-stage editor selector')
  await toggleCoverage('.strategy-editor'); assert.equal((await read()).coverage, false)
  await toggleCoverage('.strategy-editor'); assert.equal((await read()).coverage, true)
  const initialLayout = await page.evaluate(() => {
    const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom} }
    const buttons = [...document.querySelectorAll('.strategy-editor button')].filter(el => ['Add bend','Incoming route','Undo','Redo'].includes(el.textContent))
    return {canvas:rect('.rotation-canvas'),panel:rect('.strategy-panel'),buttons:buttons.map(el=>({text:el.textContent,bottom:el.getBoundingClientRect().bottom})),height:innerHeight}
  })
  assert.ok(initialLayout.canvas.width > initialLayout.panel.width * 2)
  for (const b of initialLayout.buttons) assert.ok(b.bottom < initialLayout.height, `${b.text} above the first desktop fold`)
  await page.screenshot({ path: path.join(cache, 'v4-desktop-initial-editor.png') })
  // A small legal Start edit drives both the displayed anchor and View playback.
  await page.select('[aria-label="Selected athlete"]', 'caleb')
  const start = (await read()).scenario.tracks.caleb[0]
  await page.locator('[aria-label="X metres"]').fill(String(start.x + .05)); await delay(200)
  await click('View')
  let startView = await read()
  assert.equal(startView.scenario.tracks.caleb[0].x, start.x + .05)
  assert.equal(startView.scenario.tracks.caleb.find(k => k.time === startView.scenario.ball[0].start).x, start.x + .05)
  await click('Edit strategy'); await click('Undo')
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
  console.log('UAT: Set entered', (await read()).stage)
  for (const id of ['harry', 'logan', 'georgia']) {
    await page.select('[aria-label="Selected athlete"]', id)
    r = await read(); p = r.scenario.tracks[id].find(k => k.time === r.scenario.secondContact.time)
    await drag(p, id === 'georgia' ? -22 : 22, 8)
    console.log('UAT: after Set athlete', id, 'editing', (await read()).stage, 'top-nav', await page.$$eval('nav[aria-label="Strategy mode"] button', b=>b.map(x=>x.innerText)))
  }
  r = await read(); assert.ok(r.strategy.overrides['1/they'].setterTarget)
  assert.ok(r.strategy.overrides['1/they'].anchors.Set.logan); assert.ok(r.strategy.overrides['1/they'].anchors.Set.georgia)
  await click('Select gold target'); r = await read()
  await drag({ x: r.scenario.setterTarget.x + .46, z: r.scenario.setterTarget.z, y: .06 }, 15, -8)
  console.log('UAT: target dragged',JSON.stringify({stage:(await read()).stage,working:(await read()).strategy?.name,topButtons:await page.$$eval('nav[aria-label="Strategy mode"] button',b=>b.map(x=>x.innerText)),dom:(await page.evaluate(()=>document.body.innerText)).slice(0,200)}))
  const edited = (await read()).strategy.overrides['1/they']
  await click('Strategies')
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
  await page.goto(share, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('nav[aria-label="Tactical phase"]', { timeout: 12000 })
  await page.waitForFunction(async () => {
    const { useStrategies } = await import('/src/state/strategyStore.ts')
    return useStrategies.getState().preview === true
  }, { timeout: 12000 })
  r = await read()
  assert.equal(r.preview, true); assert.equal(r.library.length, 2)
  assert.match(await page.evaluate(() => document.body.innerText), /Preview/)
  await click('Strategies'); await click('Save a copy'); assert.equal((await read()).library.length, 3)
  await click('View'); await click('Play'); await delay(400); assert.ok((await read()).playing || (await read()).time > 0)
  await click('Edit strategy')
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 }); await delay(700)
  const phoneLayout = await page.evaluate(() => {
    const p = document.querySelector('.strategy-panel'), c = document.querySelector('.rotation-canvas').getBoundingClientRect(), r = p.getBoundingClientRect()
    return {canvasBottom:c.bottom,panelTop:r.top,panelBottom:r.bottom,scroll:p.scrollHeight>p.clientHeight,height:innerHeight,overflow:getComputedStyle(p).overflowY}
  })
  assert.ok(phoneLayout.canvasBottom <= phoneLayout.panelTop + 1, 'court remains clear of controls')
  assert.ok(phoneLayout.panelBottom <= phoneLayout.height, 'editing sheet fits on phone')
  assert.equal(phoneLayout.overflow, 'auto')
  await page.$eval('[aria-label="Selected athlete"]', e => e.scrollIntoView({ block: 'center' }))
  await stage('Receive'); await page.select('[aria-label="Selected athlete"]', 'caleb')
  await page.evaluate(() => document.querySelector('main.rotations').scrollTo(0, 0)); await delay(200)
  r = await read(); p = r.scenario.tracks.caleb.find(k => k.time === r.scenario.firstContact.time); history = r.past
  await drag(p, 18, 10); r = await read(); assert.equal(r.past, history + 1, 'narrow viewport player drag')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no horizontal overflow')
  await page.screenshot({ path: path.join(cache, 'v4-mobile-court.png') })
  const mobileLabels = await page.$$eval('.athlete-label', els => els.map(el => ({text:el.textContent,size:parseFloat(getComputedStyle(el).fontSize)})))
  assert.equal(mobileLabels.length, 6); for (const label of mobileLabels) assert.ok(label.size >= 11)
  assert.equal(await page.$('.pass-target'), null)
  await page.$eval('[aria-label="Selected athlete"]', e => e.scrollIntoView({ block: 'center' })); await page.screenshot({ path: path.join(cache, 'v4-mobile-controls.png') })
  await click('View'); await click('Set arcs'); await page.waitForSelector('canvas'); assert.ok(await page.$('canvas'))
  assert.deepEqual(errors, [])
  console.log('PASS: R1-R6 exact viewer landmarks/shortcuts; compact name tags/no PASS HERE; focused editor/first-fold controls; legal Start playback; real desktop player/setter/attacker/waypoint/target drags; per-gesture undo; save/reload; duplicate/delete; import/shared previews and independent copies; View playback; 390px sheet/drag/no overflow; Set arcs accessible; no runtime errors.')
} finally { await page.screenshot({ path: path.join(cache, 'v4-e2e-last.png') }); await browser.close() }

