// Bounded S03 implementation checks, not independent product UAT.
// Uses the existing local Puppeteer + real Windows Chrome installation.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
const evidence = path.join(root, '.cache/v5-s03-browser')
await mkdir(evidence, { recursive: true })
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE ?? path.join(root, '.cache/browser-qa/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  userDataDir:path.join(evidence,`profile-${Date.now()}`),
  args: ['--no-first-run', '--disable-extensions', '--disable-background-networking', `--disk-cache-dir=${path.join(evidence,'disk')}`] })
const base = process.env.STUDIO_URL ?? 'http://127.0.0.1:5188/'
const page = await browser.newPage(), errors = [], report = []
const pause = ms => new Promise(r => setTimeout(r, ms))
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
// Test-host-only counters in the served modules. Production contains no test
// flags; implementations/validators run normally and retain all their checks.
await page.setRequestInterception(true)
page.on('request', async req => {
  if (/\/src\/lib\/(caseReview|rotationValidation)\.ts(?:\?|$)/.test(req.url())) {
    const res = await fetch(req.url()), original = await res.text()
    const body = original.replace(/(function createReviewModel\(published, draft\) \{)/, '$1 globalThis.__reviewModels = (globalThis.__reviewModels || 0) + 1;')
      .replace(/(function validateBundle\(value\) \{)/, '$1 globalThis.__validations = (globalThis.__validations || 0) + 1;')
    await req.respond({ status: res.status, contentType: 'application/javascript', body })
  } else await req.continue()
})
async function click(selector) {
  await page.$eval(selector, el => el.scrollIntoView({ block: 'nearest' }))
  const hit = await page.$eval(selector, el => {
    const r = el.getBoundingClientRect(), top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    return el === top || el.contains(top)
  })
  assert.ok(hit, `Pointer blocked: ${selector}`)
  await page.click(selector)
  await pause(120)
}
async function textClick(text, scope = '') {
  for (const b of await page.$$(`${scope} button`)) if ((await b.evaluate(el => el.textContent.trim())) === text) {
    const id = await b.evaluate(el => { el.dataset.qaClick = 'current'; return '[data-qa-click="current"]' })
    await click(id); await b.evaluate(el => delete el.dataset.qaClick); return
  }
  throw Error(`Missing ${text}`)
}
async function ready() {
  await page.waitForSelector('.court-labels .athlete-label:not([hidden])')
  await pause(900)
}
async function layout(label, screenshot = true) {
  await pause(700)
  const data = await page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height } }
    const reachable = el => { const r=el.getBoundingClientRect(), top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return top===el||el.contains(top) }
    const canvas = document.querySelector('.rotation-canvas'), panel = document.querySelector('.viewer-panel, .strategy-panel')
    const tags = [...document.querySelectorAll('.court-labels .athlete-label:not([hidden])')].map(el => ({ ...rect(el), name:el.textContent }))
    const stage = [...document.querySelectorAll('.rotation-markers button')].map(el => ({ ...rect(el), name:el.textContent, reachable:reachable(el) }))
    const playback = [...document.querySelectorAll('.rotation-play-row > *')].map(el => ({ ...rect(el), name:el.getAttribute('aria-label'), reachable:reachable(el) }))
    const c = rect(canvas), p = rect(panel)
    const courtHit = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2)
    return { width:innerWidth, height:innerHeight, overflow:document.documentElement.scrollWidth > innerWidth,
      canvas:c, panel:p, tags, stage, playback, courtReachable:canvas.contains(courtHit), bodyScroll:document.documentElement.scrollHeight > innerHeight,
      name:document.querySelector('.focus-selector')?.textContent }
  })
  assert.equal(data.overflow, false, `${label}: horizontal overflow`)
  assert.equal(data.bodyScroll, false, `${label}: body must not own sheet scroll`)
  assert.equal(data.tags.length, 6, `${label}: six identities`)
  assert.ok(data.courtReachable, `${label}: court pointer blocked`)
  const intersects = (a,b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  for (const a of data.tags) {
    assert.equal(intersects(a, data.panel), false, `${label}: tag above sheet`)
    for (const b of data.tags.filter(b => b.name !== a.name)) assert.equal(intersects(a,b), false, `${label}: tags overlap`)
  }
  assert.equal(data.stage.length, 5)
  for (const b of data.stage) { assert.ok(b.reachable,`${label}: stage ${b.name} obscured`); assert.ok(b.height >= 44); assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= data.width + 1 && b.y + b.height <= data.height + 1, `${label}: stage clipped`) }
  for (const b of data.playback) { assert.ok(b.reachable,`${label}: playback ${b.name} obscured`); assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= data.width + 1 && b.y + b.height <= data.height + 1, `${label}: playback clipped`) }
  report.push({ label, ...data })
  console.log(`VIEWPORT ${label}: court ${Math.round(data.canvas.width)}x${Math.round(data.canvas.height)}, six tags, stage/court reachable`)
  if (screenshot) await page.screenshot({ path:path.join(evidence, `${label}.png`), captureBeyondViewport:false })
}
const counters = () => page.evaluate(() => ({ models:globalThis.__reviewModels, validations:globalThis.__validations }))
const sampleState = () => page.evaluate(async () => {
  const { useRotations, activeScenario } = await import('/src/state/rotationStore.ts')
  const { useStrategies } = await import('/src/state/strategyStore.ts')
  const s=useRotations.getState(), d=useStrategies.getState()
  return { scenario:JSON.stringify(activeScenario(s)), unavailable:s.exampleResult?.ok===false, playing:s.playing,
    working:JSON.stringify(d.working), library:JSON.stringify(d.library), past:d.past.length }
})
try {
  await page.setViewport({width:1440,height:900,hasTouch:true})
  await page.goto(base, {waitUntil:'domcontentloaded'}); await ready()
  assert.ok((await counters()).models > 0); assert.ok((await counters()).validations > 0)
  await layout('desktop')
  await page.focus('[aria-label="Whole team or player"]')
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter')
  assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')), 'Whole team or player')
  await page.focus('[aria-label="Seek Set"]'); await page.keyboard.press('Enter')
  assert.equal(await page.$eval('[aria-label="Seek Set"]',el=>el.getAttribute('aria-pressed')),'true')
  const before = await counters(), timings = []
  for (const player of ['', 'harry','caleb','trent','logan','georgia','jaz']) {
    await page.select('[aria-label="Whole team or player"]', player)
    for (const stage of ['Start','Receive','Set','Attack','Defend']) {
      const start = performance.now()
      await click(`[aria-label="Seek ${stage}"]`)
      timings.push(performance.now() - start)
      assert.equal(await page.$eval(`[aria-label="Seek ${stage}"]`, el=>el.getAttribute('aria-pressed')), 'true')
      assert.ok(await page.$eval('.focus-primary', el=>el.textContent.length > 0))
      if (player) assert.ok(await page.$eval('.focus-selector', (el, id)=>el.textContent.toLowerCase().includes(id), player))
    }
  }
  for (const rotation of ['R1','R2','R3','R4','R5','R6']) await textClick(rotation, '[aria-label="Rotation"]')
  await textClick('Us serve'); await textClick('They serve')
  assert.deepEqual(await counters(), before, 'focus/stage/rotation rerenders must not rebuild model or call validateBundle')
  report.push({ performance: { before, after:await counters(), maxClickMs:Math.max(...timings), includesTestWaitMs:120 } })
  await textClick('R3', '[aria-label="Rotation"]')
  await click('[aria-label="Seek Set"]')
  await page.select('[aria-label="Whole team or player"]', 'jaz')
  await layout('desktop-focus')
  for (const [width,height] of [[390,844],[375,812],[768,1024],[844,390],[1440,900],[390,844],[1440,900]]) {
    await page.setViewport({width,height,hasTouch:true}); await layout(`resize-${width}x${height}-${report.length}`)
    assert.equal(await page.$eval('[aria-label="Whole team or player"]',el=>el.value),'jaz','focus survives resizing')
    await click('[aria-label="Seek Receive"]')
    if (width===375) {
      const rect=await page.$eval('[aria-label="Seek Attack"]',el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})
      await page.touchscreen.tap(rect.x,rect.y); await pause(180)
      assert.equal(await page.$eval('[aria-label="Seek Attack"]',el=>el.getAttribute('aria-pressed')),'true')
    }
    await textClick('Settings')
    await layout(`explorer-${width}x${height}-${report.length}`)
    for (const row of ['Short','Mid','Deep']) for (const col of ['left','centre','right']) {
      const selector = `.first-ball-grid button[aria-label^="${row} ${col},"]`
      const prior=await sampleState()
      await click(selector)
      assert.equal(await page.$eval(selector, el=>el.getAttribute('aria-pressed')), 'true')
      assert.ok(await page.$eval('.example-notice', el=>/Teaching example|No feasible authored example/.test(el.textContent)))
      const after=await sampleState()
      assert.equal(after.working,prior.working); assert.equal(after.library,prior.library); assert.equal(after.past,prior.past)
      if(after.unavailable) {assert.equal(after.scenario,prior.scenario,'unavailable sample retains the last valid animation');assert.equal(after.playing,false)}
      await click('[aria-label="Seek Set"]')
    }
    await textClick('Authored (default)')
    await click('[aria-label="Close settings"]')
    await layout(`dismissed-${width}x${height}-${report.length}`, false)
  }
  // Real on-court click uses projection of the unchanged source avatar.
  const point = await page.evaluate(async () => {
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    const { Vector3 } = await import('/node_modules/.vite/deps/three.js')
    const { useRotations, activeScenario } = await import('/src/state/rotationStore.ts')
    const { sampleTrack } = await import('/src/lib/rotationModel.ts')
    const s=useRotations.getState(), canvas=document.querySelector('canvas'), r=canvas.getBoundingClientRect()
    const p=sampleTrack(activeScenario(s).tracks.caleb,s.time), camera=_roots.get(canvas).store.getState().camera
    const q=new Vector3(p.x,1.13,p.z).project(camera)
    return {x:r.x+(q.x+1)*r.width/2,y:r.y+(1-q.y)*r.height/2}
  })
  await page.mouse.click(point.x,point.y); await pause(200)
  assert.equal(await page.$eval('[aria-label="Whole team or player"]',el=>el.value),'caleb')
  // Check a real working-strategy identity: creating it computes once; all
  // later View clicks must use project(), including after toggling modes.
  const retainedStage=await page.$eval('.rotation-markers button[aria-pressed="true"]',el=>el.getAttribute('aria-label'))
  await textClick('Edit strategy')
  assert.equal(await page.$eval('.rotation-markers button[aria-pressed="true"]',el=>el.getAttribute('aria-label')),retainedStage,'View stage survives entering Edit')
  await textClick('View')
  assert.equal(await page.$eval('.rotation-markers button[aria-pressed="true"]',el=>el.getAttribute('aria-label')),retainedStage,'Edit stage survives returning to View')
  const workingBefore=await counters()
  for (const stage of ['Start','Set','Attack','Defend']) await click(`[aria-label="Seek ${stage}"]`)
  assert.deepEqual(await counters(),workingBefore)
  // Fixture notes use the actual import-preview path. They remain user copy,
  // never become approval, and must outrank the default coaching prompt.
  await page.evaluate(async()=>{
    const {useStrategies}=await import('/src/state/strategyStore.ts')
    const s=useStrategies.getState(), d=structuredClone(s.working)
    d.notes={players:{'3/they':{Set:{caleb:{primary:'Fixture primary note',ifDifferent:'Fixture conditional note',fallback:'Fixture fallback note'}}}}}
    s.previewImport(JSON.stringify(d))
  })
  await page.select('[aria-label="Whole team or player"]','caleb'); await click('[aria-label="Seek Set"]')
  assert.equal(await page.$eval('.focus-primary',el=>el.textContent),'Fixture primary note')
  assert.equal(await page.$eval('.focus-primary',el=>el.dataset.source),'user-authored')
  assert.ok(await page.$eval('.player-focus',el=>el.textContent.includes('Fixture conditional note')&&el.textContent.includes('Fixture fallback note')))
  await textClick('Strategies'); await layout('desktop-library'); await textClick('View')
  await textClick('Set arcs', '[aria-label="Studio mode"]')
  await page.waitForSelector('canvas'); await pause(800)
  // A reused QA profile may already have completed the original onboarding.
  if (await page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Skip'))) await textClick('Skip')
  await click('[title="Side view (Shift+2)"]')
  await click('[aria-label="More controls"]')
  assert.ok(await page.$('[aria-label="Hide controls"]'))
  await page.screenshot({ path:path.join(evidence,'set-arcs.png'), captureBeyondViewport:false })
  await textClick('Rotations', '[aria-label="Studio mode"]'); await ready()
  for(const [width,height] of [[1440,900],[390,844],[375,812],[768,1024],[844,390]]) {
    // Readiness is the rendered identities + usable controls, not network idle
    // on a Vite development page with a persistent update connection.
    await page.setViewport({width,height,hasTouch:true}); await page.reload({waitUntil:'domcontentloaded'}); await ready()
    await layout(`fresh-${width}x${height}`)
  }
  assert.deepEqual(errors, [], 'no browser console/page errors')
  await writeFile(path.join(evidence,'report.json'), JSON.stringify({report,errors},null,2))
  console.log(`PASS S03: ${report.length} viewport/performance records, all nine samples, focus/stages, court click, Set arcs; no console errors. Evidence: ${evidence}`)
} catch(e) {
  await page.screenshot({path:path.join(evidence,'failure.png'),captureBeyondViewport:false}).catch(()=>{})
  await writeFile(path.join(evidence,'failure.json'),JSON.stringify({error:e.stack,errors,report},null,2))
  throw e
} finally { await browser.close() }
