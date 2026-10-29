import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL,fileURLToPath} from 'node:url'
const cache=path.join(fileURLToPath(new URL('../../',import.meta.url)),'.cache/browser-qa')
const {default:puppeteer}=await import(pathToFileURL(path.join(cache,'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href)
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,
  userDataDir:path.join(cache,`s04b-profile-${Date.now()}`),args:['--no-first-run','--disable-background-networking']})
const page=await browser.newPage(),errors=[],checks=[],measurements=[],sleep=ms=>new Promise(r=>setTimeout(r,ms))
page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(e.message))
const mark=s=>{console.log('PASS '+s);checks.push(s)}
async function click(text,scope='') {
  for(const e of await page.$$(scope?`${scope} button`:'button')) if(await e.evaluate(e=>e.textContent.trim())===text) {
    await e.evaluate(e=>e.scrollIntoView({block:'center'}));await e.click();await sleep(220);return
  }
  throw Error('Missing button '+text)
}
async function select(label,value){await page.select(`[aria-label="${label}"]`,value);await sleep(250)}
async function field(label,value){
  const e=await page.$(`[aria-label="${label}"]`);assert.ok(e,label)
  await e.evaluate(e=>e.scrollIntoView({block:'center'}));await e.click();await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await page.keyboard.type(String(value));await page.keyboard.press('Enter');await sleep(220)
  assert.equal(await e.evaluate(e=>e.getAttribute('aria-invalid')),'false',label)
}
async function expand(){const e=await page.$('.coverage-editor');if(!await e.evaluate(e=>e.open)){const q=await e.$('summary');await q.evaluate(e=>e.scrollIntoView({block:'center'}));await q.click();await sleep(150)}}
// Vite HMR may version the store URL with ?t=. Read the exact module used by React,
// rather than instantiating a second, unversioned Zustand store from this QA script.
let storeModulePath = ''
const read=()=>page.evaluate(async url=>{
  const {useStrategies}=await import(url),{useRotations,activeScenario}=await import('/src/state/rotationStore.ts')
  const s=useStrategies.getState(),r=useRotations.getState();return {working:s.working,past:s.past.length,gesture:!!s.gesture,scenario:activeScenario(r),time:r.time}
},storeModulePath)
async function sceneInfo(point=null,name=null){return page.evaluate(async({point,name})=>{
  const THREE=await import('/node_modules/.vite/deps/three.js'),{_roots}=await import('/node_modules/.vite/deps/@react-three_fiber.js')
  const c=document.querySelector('.rotation-canvas canvas'),box=c.getBoundingClientRect(),root=_roots.get(c).store.getState(),camera=root.camera,controls=root.controls
  const o=name&&root.scene.getObjectByName(name),p=point?new THREE.Vector3(point.x,point.y??.16,point.z):o?.getWorldPosition(new THREE.Vector3())
  const q=p?.clone().project(camera)
  return {distance:camera.position.distanceTo(controls.target),target:controls.target.toArray(),zoom:controls.enableZoom,rotate:controls.enableRotate,
    hit:q?{x:box.left+(q.x+1)*box.width/2,y:box.top+(1-q.y)*box.height/2}:null,
    areas:root.scene.children.length,box:{left:box.left,top:box.top,width:box.width,height:box.height},found:!!o}
},{point,name})}
async function drag(hit,dx,dy){await page.mouse.move(hit.x,hit.y);await page.mouse.down();await page.mouse.move(hit.x+dx,hit.y+dy,{steps:10});await page.mouse.up();await sleep(300)}
async function stage(label){await click(label,'[aria-label="Court stages"]')}
async function zoom(label){await page.click(`[aria-label="${label}"]`);await sleep(350)}
async function checkZoom(width){
  await click('Fit our court');const fit=await sceneInfo();assert.deepEqual(fit.target,[0,0,4.5]);assert.ok(fit.zoom&&!fit.rotate)
  await zoom('Zoom in');const closer=await sceneInfo();assert.ok(closer.distance<fit.distance)
  await stage('Set');assert.ok(Math.abs((await sceneInfo()).distance-closer.distance)<.01,'stage reset zoom')
  await stage('Receive');assert.ok(Math.abs((await sceneInfo()).distance-closer.distance)<.01,'stage reset zoom back')
  await zoom('Zoom out');assert.ok((await sceneInfo()).distance>closer.distance)
  await click('Fit our court');const beforeWheel=await sceneInfo(),b=beforeWheel.box
  await page.mouse.move(b.left+b.width*.75,b.top+b.height*.55);await page.mouse.wheel({deltaY:-180});await sleep(650)
  const wheel=await sceneInfo();assert.ok(wheel.distance<beforeWheel.distance,`wheel ${width}`)
  // Chromium's touch input protocol sends a real two-finger span change to OrbitControls.
  const cdp=await page.createCDPSession(),cx=b.left+b.width*.55,cy=b.top+b.height*.6
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2})
  const touches=span=>[{x:cx-span,y:cy,id:1},{x:cx+span,y:cy,id:2}]
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches(24)})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touches(48)})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(500)
  const pinched=await sceneInfo();assert.ok(pinched.distance<wheel.distance,`pinch ${width}`)
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach()
  await click('Fit our court');assert.ok(Math.abs((await sceneInfo()).distance-fit.distance)<.01)
  measurements.push({width,fit:fit.distance,button:closer.distance,wheel:wheel.distance,pinch:pinched.distance,target:fit.target})
  mark(`${width}px +/−, wheel and two-finger pinch work; stage preserves zoom; Fit targets our half`)
}
let outcome='PASS',failure=''
try {
  await page.setViewport({width:1440,height:900,deviceScaleFactor:1})
  await page.goto(process.env.STUDIO_URL??'http://127.0.0.1:5196/?mode=rotations',{waitUntil:'domcontentloaded'})
  await page.waitForFunction(async()=>{const {useRotations}=await import('/src/state/rotationStore.ts');return !!useRotations.getState().published})
  storeModulePath = await page.evaluate(async()=>{
    const code = await (await fetch('/src/ui/StrategyEditor.tsx')).text()
    const found = code.match(/from "(\/src\/state\/strategyStore\.ts[^"]*)"/)
    if (!found) throw Error('Could not resolve live strategyStore module URL')
    return found[1]
  })
  await click('Edit strategy');await stage('Receive');await select('Selected athlete','harry');await click('Customise this case');await expand()
  const blank=await read();await select('Coverage role','tip');await field('Coverage width metres','3');await field('Coverage depth metres','1')
  await field('Coverage x offset metres','.25');await field('Coverage z offset metres','-1')
  let r=await read(),zone=r.working.caseOverrides['1/they/left/normal'].coverage.Receive.harry
  assert.deepEqual(zone,{role:'tip',radiusX:1.5,radiusZ:.5,offsetX:.25,offsetZ:-1})
  assert.deepEqual(r.working.overrides,{});assert.equal(r.working.caseOverrides['1/they/left/normal'].anchors,undefined)
  assert.deepEqual(r.scenario.tracks,blank.scenario.tracks);mark('R1 Harry tip role, independent full width/depth and signed offsets authored only by UI, without moving him')
  await select('Coverage role','block');assert.match(await page.$eval('.coverage-editor',e=>e.textContent),/Harry is back-row/)
  await click('Undo coverage edit');assert.equal((await read()).working.caseOverrides['1/they/left/normal'].coverage.Receive.harry.role,'tip')
  mark('Back-row block review warning and one-step field undo')
  // Baseline Georgia Receive X is already 2.8. Move her further right to 3.4.
  await select('Selected athlete','georgia');await field('X metres','3.4');r=await read()
  assert.equal(r.working.caseOverrides['1/they/left/normal'].anchors.Receive.georgia.x,3.4)
  assert.deepEqual(r.working.caseOverrides['1/they/left/normal'].coverage.Receive.harry,zone)
  await select('Selected athlete','harry');await expand();await click('Selected area')
  const areas=await page.evaluate(async()=>{const {_roots}=await import('/node_modules/.vite/deps/@react-three_fiber.js');const root=_roots.get(document.querySelector('canvas')).store.getState();const out=[];root.scene.traverse(o=>{if(/^coverage-(harry|georgia|caleb|trent|logan|jaz)$/.test(o.name))out.push(o.name)});return out})
  assert.deepEqual(areas,['coverage-harry']);await click('Areas off');assert.equal((await sceneInfo(null,'coverage-harry')).found,false);await click('All areas')
  await select('Editor attack side','right');r=await read();assert.equal(r.working.caseOverrides['1/they/right/normal'],undefined)
  await expand();assert.equal(await page.$eval('[aria-label="Coverage role"]',e=>e.value),'')
  await select('Editor attack side','left');await expand();assert.equal(await page.$eval('[aria-label="Coverage role"]',e=>e.value),'tip')
  mark('Harry coverage independent of Georgia right position; case switching isolated; All/Selected/Off controls work')
  await checkZoom(1440)
  const before=await read(),handle=await sceneInfo(null,'coverage-radius-X');assert.ok(handle.found)
  await drag(handle.hit,20,0);r=await read();assert.equal(r.past,before.past+1);assert.notDeepEqual(r.working,before.working)
  await click('Undo');assert.deepEqual((await read()).working,before.working);mark('Desktop rendered ellipse radius drag makes one undo step')
  await expand();await click('Reset coverage');assert.equal((await read()).working.caseOverrides['1/they/left/normal'].coverage,undefined)
  await click('Undo coverage edit');assert.deepEqual((await read()).working,before.working)
  await page.screenshot({path:path.join(cache,'V5-S04B-desktop.png')})
  await click('Us serve');await stage('Defend');await expand();await select('Selected athlete','harry');await select('Coverage role','tip')
  const first=(await read()).working.caseOverrides['1/us/left/normal'].coverage.Defend.harry
  await click('Later: after our attack');await select('Coverage role','deep');await field('Coverage depth metres','4')
  r=await read();assert.deepEqual(r.working.caseOverrides['1/us/left/normal'].coverage.Defend.harry,first)
  assert.equal(r.working.caseOverrides['1/us/left/normal'].laterDefend.coverage.harry.radiusZ,2)
  mark('Later own-serve coverage distinct from first defensive coverage')
  await page.setViewport({width:390,height:844,deviceScaleFactor:1});await sleep(1000)
  await click('They serve');await stage('Receive');await select('Selected athlete','harry');await expand()
  await field('Coverage width metres','2.8');r=await read();assert.equal(r.working.caseOverrides['1/they/left/normal'].coverage.Receive.harry.radiusX,1.4)
  await checkZoom(390)
  const beforePhone=await read(),phoneHandle=await sceneInfo(null,'coverage-radius-Z');await drag(phoneHandle.hit,0,12)
  r=await read();assert.equal(r.past,beforePhone.past+1);assert.notDeepEqual(r.working,beforePhone.working)
  await click('Undo');assert.deepEqual((await read()).working,beforePhone.working)
  // Keep direct player and gold-target drags working after zoom, without radius interception.
  await select('Selected athlete','caleb');let pre=await read(),p=pre.scenario.tracks.caleb.find(k=>Math.abs(k.time-pre.time)<.001)
  let hit=(await sceneInfo({...p,y:1.13})).hit;await drag(hit,20,-10);r=await read();assert.equal(r.past,pre.past+1)
  assert.ok(r.working.caseOverrides['1/they/left/normal'].anchors.Receive.caleb);await click('Undo');assert.deepEqual((await read()).working,pre.working)
  await stage('Set');await click('Select gold target');pre=await read();hit=(await sceneInfo({...pre.scenario.setterTarget,y:.06})).hit
  await drag({x:hit.x+8,y:hit.y},15,4);r=await read();assert.equal(r.past,pre.past+1);assert.ok(r.working.caseOverrides['1/they/left/normal'].setterTarget)
  await click('Undo');assert.deepEqual((await read()).working,pre.working)
  mark('390px numeric coverage and radius drag with one Undo; player and target direct dragging retained')
  await stage('Receive');await select('Selected athlete','harry');await expand()
  const layout=await page.evaluate(()=>{
    const c=document.querySelector('.rotation-canvas').getBoundingClientRect(),p=document.querySelector('.strategy-panel').getBoundingClientRect(),tags=[...document.querySelectorAll('.court-labels [data-player]:not([hidden])')]
    return {scroll:document.documentElement.scrollWidth,courtHeight:c.height,courtBottom:c.bottom,panelTop:p.top,
      labelBleed:tags.some(t=>{const r=t.getBoundingClientRect();return r.bottom>c.bottom+1||r.right>c.right+1||r.top<c.top-1})}
  })
  assert.ok(layout.scroll<=391&&layout.courtHeight>=290&&layout.courtBottom<=layout.panelTop+1&&!layout.labelBleed,JSON.stringify(layout))
  await page.screenshot({path:path.join(cache,'V5-S04B-phone.png')});mark('390px court/panel separation, no horizontal scroll or 3D label bleed')
  await click('Save');const saved=await read();await page.reload({waitUntil:'domcontentloaded'})
  await page.waitForFunction(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts');return !!useStrategies.getState().working})
  assert.deepEqual((await read()).working,saved.working);mark('Coverage and case/occurrence strategy survives save/reload')
  await click('Set arcs');await page.waitForFunction(()=>!document.querySelector('main.rotations')&&!!document.querySelector('canvas'))
  assert.deepEqual(errors,[]);mark('Set arcs opens and zero browser page exceptions')
} catch(e) {outcome='FAIL';failure=e.stack||String(e);console.error(failure);await page.screenshot({path:path.join(cache,'V5-S04B-failure.png')}).catch(()=>{})}
finally {await fs.writeFile(path.join(cache,'V5-S04B-browser-result.json'),JSON.stringify({outcome,checks,measurements,failure,pageErrors:errors},null,2));await browser.close()}
if(outcome==='FAIL')process.exitCode=1
