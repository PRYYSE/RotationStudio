// Uses the same external Puppeteer/Windows Chrome installation as the V4 suite.
// Scope/occurrence edits deliberately use controlled state in S01; wiring the
// existing numeric/route UI for those contexts is S04, not browser UI acceptance.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
const cache = path.join(root, '.cache/v5-s01-browser')
await mkdir(cache, { recursive: true })
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE ?? path.join(root, '.cache/browser-qa/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  userDataDir: path.join(cache, 'profile'), args: ['--no-first-run', '--disable-background-networking', `--disk-cache-dir=${path.join(cache, 'disk')}`] })
const base = process.env.STUDIO_URL ?? 'http://127.0.0.1:5185/?mode=rotations'
const page = await browser.newPage(), errors = []
page.on('pageerror', e => errors.push(e.message))
const v1Key = 'rotation-studio-strategies-v1', v2Key = 'rotation-studio-strategies-v2'
const legacy = { kind:'rotation-studio-strategy', schemaVersion:1, id:'s01-legacy', name:'S01 Legacy', author:'Coach', baseRevision:'8c0fb5d', overrides:{'3/they':{anchors:{Receive:{caleb:{x:.4,z:6}}}}} }
const raw = JSON.stringify({schemaVersion:1, library:[legacy], activeId:legacy.id})
let step = 'initial load'
const ready = () => page.waitForFunction(async () => {
  const {useRotations} = await import('/src/state/rotationStore.ts')
  return !!useRotations.getState().published && !!document.querySelector('nav[aria-label="Strategy mode"]')
})
const read = () => page.evaluate(async () => {
  const {useStrategies} = await import('/src/state/strategyStore.ts')
  const {useRotations, activeScenario} = await import('/src/state/rotationStore.ts')
  const s=useStrategies.getState(), r=useRotations.getState()
  return {working:s.working,library:s.library,preview:s.preview,saved:s.saved,past:s.past.length,error:s.error,time:r.time,scenario:activeScenario(r)}
})
async function click(text) {
  for (const b of await page.$$('button')) if (await b.evaluate(el=>el.textContent.trim())===text) { await b.click(); return }
  throw Error(`Missing button ${text}`)
}
try {
  await page.setViewport({width:1440,height:900})
  await page.goto(base); await ready()
  await page.evaluate(({raw,v1Key,v2Key})=>{localStorage.setItem(v1Key,raw);localStorage.removeItem(v2Key)}, {raw,v1Key,v2Key})
  await page.reload(); await ready()
  step = 'migrated library'
  assert.equal((await read()).working.schemaVersion,2)
  assert.deepEqual(await page.evaluate(({v1Key,v2Key})=>[localStorage.getItem(v1Key),localStorage.getItem(v2Key)],{v1Key,v2Key}),[raw,null])
  await click('Edit strategy')
  step = 'case edit'
  await page.evaluate(async()=>{
    const {useRotations}=await import('/src/state/rotationStore.ts')
    const {useStrategies}=await import('/src/state/strategyStore.ts')
    useRotations.getState().choose(3,'they');useRotations.getState().chooseTactics('right','harry');useStrategies.getState().setStage('Receive')
  })
  await page.waitForFunction(async()=>{
    const {useRotations,activeScenario}=await import('/src/state/rotationStore.ts')
    const r=useRotations.getState();return r.time===activeScenario(r).firstContact.time
  })
  await page.select('[aria-label="Selected athlete"]','caleb')
  await page.locator('[aria-label="X metres"]').fill('1')
  await page.waitForFunction(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts');return useStrategies.getState().working.overrides['3/they'].anchors.Receive.caleb.x===1})
  await click('View')
  await page.evaluate(async()=>{
    const {useStrategies}=await import('/src/state/strategyStore.ts');const s=useStrategies.getState()
    s.setScope('3/they/right/harry');s.beginGesture();s.move('3/they','caleb',{x:-.5,z:6});s.endGesture()
  })
  await page.waitForFunction(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts');return useStrategies.getState().working.caseOverrides?.['3/they/right/harry']?.anchors?.Receive?.caleb.x===-.5})
  assert.equal((await read()).past,2)
  await page.evaluate(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts');useStrategies.getState().undo()})
  assert.equal((await read()).working.caseOverrides,undefined)
  await page.evaluate(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts');useStrategies.getState().redo()})
  assert.equal((await read()).working.caseOverrides['3/they/right/harry'].anchors.Receive.caleb.x,-.5)
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),v1Key),raw)
  assert.equal(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),v2Key)).schemaVersion,2)
  await page.evaluate(async()=>{
    const {useRotations}=await import('/src/state/rotationStore.ts');useRotations.getState().choose(3,'us')
    const {useStrategies}=await import('/src/state/strategyStore.ts');useStrategies.getState().setScope(null);useStrategies.getState().setStage('Defend')
  })
  const first=(await read()).scenario.phases.find(p=>p.label==='Defence ready').time
  assert.ok(first<(await read()).scenario.firstContact.time)
  await page.evaluate(async()=>{
    const {useStrategies}=await import('/src/state/strategyStore.ts');const {useRotations,activeScenario}=await import('/src/state/rotationStore.ts')
    useStrategies.getState().setLaterDefend(activeScenario(useRotations.getState()))
  })
  const later=(await read()).scenario.phases.find(p=>p.label==='Defend again').time
  await page.evaluate(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts');useStrategies.getState().move('3/us','harry',{x:1,z:4})})
  await page.waitForFunction(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts');return useStrategies.getState().working.overrides['3/us']?.laterDefend?.anchors?.harry?.x===1})
  await page.evaluate(async time=>{const {useRotations}=await import('/src/state/rotationStore.ts');useRotations.getState().seek(time)},later)
  const atLater=await read()
  assert.equal(atLater.scenario.tracks.harry.find(k=>k.time===later).z,4)
  await page.reload(); await ready()
  step = 'V1 file import'
  assert.equal((await read()).working.overrides['3/us'].laterDefend.anchors.harry.x,1)
  await click('Strategies')
  const file=path.join(cache,'v1-import.json');await writeFile(file,JSON.stringify(legacy))
  await (await page.$('[aria-label="Import sparse strategy JSON"]')).uploadFile(file)
  await page.waitForFunction(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts');return useStrategies.getState().preview})
  assert.equal((await read()).working.schemaVersion,2)
  await click('Save a copy');assert.equal((await read()).library.length,2);assert.notEqual((await read()).working.id,legacy.id)
  const url=new URL(base);url.hash='strategy='+encodeURIComponent(JSON.stringify(legacy))
  step = 'V1 fragment'
  await page.goto(url.href); await page.reload();await ready()
  await page.waitForFunction(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts');return useStrategies.getState().preview})
  assert.equal((await read()).library.length,2)
  await click('Strategies');await click('Save a copy');assert.equal((await read()).library.length,3)
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),v1Key),raw)
  await page.screenshot({path:path.join(cache,'s01-library.png')})
  assert.deepEqual(errors,[])
  console.log('PASS: Chrome V1 migration with untouched backup; controlled case and later-event selectors; numeric edits/undo/redo; accepted V2 autosave/reload; V1 file and fragment previews/save-copy; no runtime errors.')
} catch (error) {
  const state=await read()
  console.error('Failed step:',step,JSON.stringify({working:state.working,preview:state.preview,error:state.error,time:state.time}), 'pageErrors:',errors)
  await page.screenshot({path:path.join(cache,'s01-failure.png')})
  throw error
} finally { await browser.close() }
