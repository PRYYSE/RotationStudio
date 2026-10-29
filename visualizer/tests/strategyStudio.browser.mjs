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
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    const canvas = document.querySelector('.rotation-canvas canvas'), r = canvas.getBoundingClientRect()
    const { camera } = _roots.get(canvas).store.getState()
    const q = new THREE.Vector3(p.x, p.y ?? 1.13, p.z).project(camera)
    return { x: r.left + (q.x + 1) * r.width / 2, y: r.top + (1 - q.y) * r.height / 2 }
  }, point)
}
async function drag(point, dx, dy) {
  const p = await project(point)
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + dx, p.y + dy, { steps: 12 }); await page.mouse.up(); await delay(300)
}
async function assertEditorLayout(context) {
  await page.$eval('[aria-label="Court stages"]', el => el.scrollIntoView({ block: 'nearest' }))
  await page.$eval('main.rotations', el => el.scrollTo(0, 0))
  // Wait for R3F's measured viewport, not just the outer CSS box, to reflow.
  await page.waitForFunction(async () => {
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    const canvas = document.querySelector('.rotation-canvas canvas'), box = document.querySelector('.rotation-canvas').getBoundingClientRect()
    const size = _roots.get(canvas)?.store.getState().size, r = canvas.getBoundingClientRect()
    return size && Math.abs(size.width - box.width) < 1 && Math.abs(size.height - box.height) < 1 && Math.abs(r.width - box.width) < 1 && Math.abs(r.height - box.height) < 1
  }, { timeout: 5000 })
  const layout = await page.evaluate(async () => {
    const THREE = await import('/node_modules/.vite/deps/three.js')
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    const rect = el => { const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height } }
    const main = document.querySelector('main.rotations'), panel = document.querySelector('.strategy-panel'), canvas = document.querySelector('.rotation-canvas canvas')
    const { camera } = _roots.get(canvas).store.getState()
    const corners = [-4.5, 4.5].flatMap(x => [0, 9].map(z => {
      const p = new THREE.Vector3(x, 0, z).project(camera)
      return { x:p.x, y:p.y, z:p.z }
    }))
    return { width:innerWidth, height:innerHeight, court:rect(document.querySelector('.rotation-canvas')), canvas:rect(canvas), panel:rect(panel),
      stages:[...document.querySelectorAll('[aria-label="Court stages"] button')].map(rect),
      controls:[...panel.querySelectorAll('button,input,select,summary')].map(rect).filter(r => r.width && r.height),
      labels:[...document.querySelectorAll('.athlete-label')].map(rect), corners,
      main:{ scrollHeight:main.scrollHeight, scrollWidth:main.scrollWidth, clientWidth:main.clientWidth, overflowX:getComputedStyle(main).overflowX, overflowY:getComputedStyle(main).overflowY },
      overflow:getComputedStyle(panel).overflowY, scrollWidth:document.documentElement.scrollWidth }
  })
  const shortLandscape = layout.width > layout.height && layout.height <= 600
  if (shortLandscape) {
    assert.ok(layout.court.height >= 300, `${context}: usable short-landscape court height`)
    assert.ok(layout.panel.height >= 220, `${context}: usable short-landscape panel height`)
    assert.ok(layout.main.scrollHeight > layout.height, `${context}: main scrolls vertically beyond viewport`)
    assert.equal(layout.main.overflowY, 'auto')
    assert.equal(layout.main.overflowX, 'hidden')
    assert.ok(layout.main.scrollWidth <= layout.main.clientWidth, `${context}: no horizontal main overflow`)
  }
  const insideWidth = (r, name) => {
    assert.ok(r.width > 0 && r.width <= layout.width && r.left >= 0 && r.right <= layout.width, `${context}: ${name} within actual viewport: ${JSON.stringify(r)}`)
  }
  for (const name of ['court', 'canvas', 'panel']) insideWidth(layout[name], name)
  assert.equal(layout.stages.length, 5)
  for (const r of layout.stages) {
    insideWidth(r, 'stage button')
    assert.ok(r.height >= 44 && r.top >= layout.panel.top - 1 && r.bottom <= layout.panel.bottom + 1, `${context}: five visible touch-sized stages`)
  }
  for (const r of layout.controls) assert.ok(r.left >= layout.panel.left - 1 && r.right <= layout.panel.right + 1, `${context}: controls fit sheet width`)
  if (!shortLandscape) assert.ok(layout.court.top >= 0 && layout.court.bottom <= layout.height + 1, `${context}: court vertically on screen`)
  if (layout.width <= 850) assert.ok(layout.court.bottom <= layout.panel.top + 1, `${context}: court clear of sheet`)
  if (!shortLandscape) assert.ok(layout.panel.bottom <= layout.height + 1, `${context}: sheet fits viewport`)
  assert.equal(layout.overflow, 'auto')
  assert.equal(layout.scrollWidth <= layout.width, true, `${context}: no page overflow`)
  for (const p of layout.corners) assert.ok(Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && Math.abs(p.z) <= 1, `${context}: full 9x9m court framed by actual camera`)
  assert.equal(layout.labels.length, 6)
  for (const r of layout.labels) assert.ok(r.left >= layout.canvas.left - 1 && r.right <= layout.canvas.right + 1 && r.top >= layout.canvas.top - 1 && r.bottom <= layout.canvas.bottom + 1, `${context}: all six athlete labels on court`)
  assert.deepEqual(errors, [], `${context}: no page errors`)
}
async function assertReceiveDrag(context, dx = 18, dy = 10) {
  await stage('Receive')
  await page.$eval('[aria-label="Selected athlete"]', el => el.scrollIntoView({ block: 'center' }))
  await page.select('[aria-label="Selected athlete"]', 'caleb')
  const route = await page.$('.strategy-editor > .rotation-row button[aria-pressed="true"]')
  if (route && await route.evaluate(el => el.textContent === 'Incoming route')) await click('Incoming route')
  await assertEditorLayout(context)
  const before = await read(), p = before.scenario.tracks.caleb.find(k => k.time === before.scenario.firstContact.time)
  await drag(p, dx, dy)
  const after = await read(), moved = after.strategy.overrides['1/they'].anchors.Receive.caleb
  assert.ok(moved.x !== p.x || moved.z !== p.z, `${context}: pointer drag changes X/Z`)
  assert.equal(after.selected, 'caleb', `${context}: resized hit testing selects Caleb`)
  assert.equal(after.past, before.past + 1, `${context}: one undo per drag`)
  await click('Undo')
  assert.deepEqual((await read()).strategy.overrides, before.strategy.overrides, `${context}: one undo restores gesture`)
  await click('Redo')
  assert.deepEqual((await read()).strategy.overrides, after.strategy.overrides)
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
    await click('Settings')
    for (const attack of ['left', 'right']) for (const first of ['normal', 'harry']) {
      await click(attack === 'left' ? 'Our left' : 'Our right', '[aria-label="Their attack"]')
      await click(first === 'normal' ? 'Normal' : 'Harry first', '[aria-label="First contact"]')
      const { scenario } = await read()
      assert.equal(scenario.rotation, rotation); assert.equal(scenario.serve, serve)
      assert.equal(scenario.tactics.opponentAttack, attack); assert.equal(scenario.tactics.firstTouch, first)
      assert.ok(scenario.ball.length && Object.keys(scenario.tracks).length === 6, 'choice preserves ball and six athlete tracks')
      assert.deepEqual(errors, [], `R${rotation}/${serve}/${attack}/${first}: no page errors`)
    }
    await click('Our left', '[aria-label="Their attack"]'); await click('Normal', '[aria-label="First contact"]'); await click('Close')
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
  await assertReceiveDrag('1440 to 390, same page')
  await page.screenshot({ path: path.join(cache, 'v4-mobile-court.png') })
  const mobileLabels = await page.$$eval('.athlete-label', els => els.map(el => ({text:el.textContent,size:parseFloat(getComputedStyle(el).fontSize)})))
  assert.equal(mobileLabels.length, 6); for (const label of mobileLabels) assert.ok(label.size >= 11)
  assert.equal(await page.$('.pass-target'), null)
  await page.$eval('[aria-label="Selected athlete"]', e => e.scrollIntoView({ block: 'center' })); await page.screenshot({ path: path.join(cache, 'v4-mobile-controls.png') })
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 }); await delay(700)
  await assertReceiveDrag('390 to 1440, same page', -18, -10)
  for (const [width, height] of [[375,812], [768,1024], [844,390]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 }); await delay(700)
    await assertEditorLayout(`${width}x${height}`)
    await page.screenshot({ path: path.join(cache, `v4-editor-${width}x${height}.png`) })
  }
  // New document at phone width exercises the independent direct-load path.
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('nav[aria-label="Tactical phase"]')
  await click('Edit strategy'); await delay(500)
  await assertReceiveDrag('390 direct load')
  // Use a clean foundation so other edited stages cannot affect notice counts.
  await click('View'); await click('Strategies'); await click('New from baseline'); await click('Edit strategy')
  await stage('Start')
  await click('Reset stage')
  assert.equal(await page.$eval('.strategy-warning summary', el => el.textContent), 'Needs review · 1 notice')
  await click('Us serve'); await page.select('[aria-label="Selected athlete"]', 'harry')
  await page.locator('[aria-label="Z metres"]').fill('8'); await delay(200)
  assert.match(await page.$eval('.strategy-warning summary', el => el.textContent), /Needs review · (?:[2-9]|[1-9]\d+) notices/)
  assert.ok(await page.$$eval('.strategy-warning p', els => els.length > 1), 'illegal placement retains validator notices')
  await click('Reset stage')
  assert.equal(await page.$eval('.strategy-warning summary', el => el.textContent), 'Needs review · 1 notice')
  await click('View'); await click('Set arcs'); await page.waitForSelector('canvas'); assert.ok(await page.$('canvas'))
  assert.deepEqual(errors, [])
  console.log(`PASS: ${process.env.UAT_SHORT ? 'focused run (viewer matrix skipped)' : 'R1-R6 exact viewer landmarks/shortcuts and 48 tactical choices'}; compact name tags/no PASS HERE; focused editor/first-fold controls; legal Start playback; real desktop player/setter/attacker/waypoint/target drags; per-gesture undo; save/reload; duplicate/delete; import/shared previews and independent copies; View playback; 1440→390→1440 bounds/drag/undo; direct phone, 375px, tablet and short landscape; notice grammar/validator disclosure; Set arcs accessible; no runtime errors.`)
} finally { await page.screenshot({ path: path.join(cache, 'v4-e2e-last.png') }); await browser.close() }

