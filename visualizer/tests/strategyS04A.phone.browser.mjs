import assert from 'node:assert/strict';
import path from 'node:path'; import fs from 'node:fs/promises';import{pathToFileURL,fileURLToPath}from'node:url';
const base=path.join(fileURLToPath(new URL('../../',import.meta.url)),'.cache/browser-qa');
const {default:puppeteer}=await import(pathToFileURL(path.join(base,'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:path.join(base,'s04a-phone-drag-profile'),args:['--no-first-run','--disable-background-networking']});
const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(28000);
const sleep=t=>new Promise(r=>setTimeout(r,t));
async function click(name){for(const el of await page.$$('button'))if(await el.evaluate(e=>e.textContent.trim())===name){await el.evaluate(e=>e.scrollIntoView({block:'center'}));await el.click();await sleep(250);return}throw Error('Missing '+name)}
const read=()=>page.evaluate(async()=>{const{useStrategies}=await import('/src/state/strategyStore.ts');const{useRotations,activeScenario}=await import('/src/state/rotationStore.ts');const s=useStrategies.getState(),r=useRotations.getState();return{past:s.past.length,working:s.working,scenario:activeScenario(r),time:r.time}});
try{
await page.setViewport({width:390,height:844});await page.goto(process.env.STUDIO_URL ?? 'http://127.0.0.1:5196/?mode=rotations',{waitUntil:'domcontentloaded'});await page.waitForFunction(async()=>{const{useRotations}=await import('/src/state/rotationStore.ts');return !!useRotations.getState().published});
await click('Edit strategy');await click('Receive');await page.select('[aria-label="Selected athlete"]','caleb');await sleep(1300);
const before=await read(),loc=before.scenario.tracks.caleb.find(k=>Math.abs(k.time-before.scenario.firstContact.time)<.0001);
assert.ok(loc);const hit=await page.evaluate(async p=>{const THREE=await import('/node_modules/.vite/deps/three.js');const{_roots}=await import('/node_modules/.vite/deps/@react-three_fiber.js');const c=document.querySelector('.rotation-canvas canvas'),r=c.getBoundingClientRect(),cam=_roots.get(c).store.getState().camera,q=new THREE.Vector3(p.x,1.13,p.z).project(cam);return{x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2}},loc);
await page.mouse.move(hit.x,hit.y);await page.mouse.down();await page.mouse.move(hit.x+26,hit.y-12,{steps:12});await page.mouse.up();await sleep(400);
const after=await read();assert.ok(after.working?.overrides?.['1/they']?.anchors?.Receive?.caleb,'phone player drag did not create sparse edit');
assert.equal(after.past,before.past+1,'one undo for mobile drag');await page.screenshot({path:path.join(base,'V5-S04A-phone-drag.png')});
await click('Undo');const undo=await read();assert.deepEqual(undo.working,before.working);assert.deepEqual(errors,[]);
console.log('PASS phone pointer drag and one undo',{start:[loc.x,loc.z],changed:after.working.overrides['1/they'].anchors.Receive.caleb});
}catch(e){console.error('FAIL PHONE DRAG',e.stack||e);await page.screenshot({path:path.join(base,'V5-S04A-phone-drag-failure.png')}).catch(()=>{});process.exitCode=1}finally{await browser.close();}
