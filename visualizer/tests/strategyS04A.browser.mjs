import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const cache=path.join(fileURLToPath(new URL('../../',import.meta.url)),'.cache/browser-qa');
const {default:puppeteer}=await import(pathToFileURL(path.join(cache,'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:path.join(cache,'s04a-parent-final-profile'),args:['--no-first-run','--disable-background-networking']});
const page=await browser.newPage(),errors=[],checks=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(async()=>{const {useStrategies}=await import('/src/state/strategyStore.ts'),{useRotations,activeScenario}=await import('/src/state/rotationStore.ts');const s=useStrategies.getState(),r=useRotations.getState();return {working:s.working,library:s.library,scope:s.scope,later:s.laterDefend,past:s.past.length,scenario:activeScenario(r),time:r.time}});
const mark=s=>{console.log('PASS '+s);checks.push(s)};
async function click(label,scope=''){const els=await page.$$(scope?scope+' button':'button');for(const el of els){if(await el.evaluate(e=>e.textContent.trim())===label){await el.evaluate(e=>e.scrollIntoView({block:'center'}));await el.click();await sleep(250);return}}throw Error('Missing button: '+label)}
async function setCoord(axis,text){const sel='[aria-label="'+axis+' metres"]';const f=await page.$(sel);await f.evaluate(e=>e.scrollIntoView({block:'center'}));await f.click();await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await page.keyboard.type(text);assert.equal(await f.evaluate(e=>e.value),text);await page.keyboard.press('Tab');await sleep(300)}
async function stage(t){await click(t,'[aria-label="Court stages"]')}
async function ready(){await page.waitForFunction(async()=>{const {useRotations}=await import('/src/state/rotationStore.ts');return !!useRotations.getState().published},{timeout:25000})}
let outcome='PASS',failure='';
try{
 await page.setViewport({width:1440,height:900,deviceScaleFactor:1});await page.goto(process.env.STUDIO_URL ?? 'http://127.0.0.1:5196/?mode=rotations',{waitUntil:'domcontentloaded'});await ready();
 const sentinel={kind:'rotation-studio-strategy',schemaVersion:2,id:'parent-sentinel',name:'Original saved draft',author:'QA',baseRevision:'8c0fb5d',overrides:{'6/us':{anchors:{Start:{harry:{x:3,z:9.5}}}}}};
 await page.evaluate(s=>{localStorage.setItem('rotation-studio-strategies-v2',JSON.stringify({schemaVersion:2,library:[s],activeId:null}));localStorage.setItem('rotation-studio-strategies-v1','original-v1-backup')},sentinel);
 await page.reload({waitUntil:'domcontentloaded'});await ready();await click('Edit strategy');await stage('Receive');await page.select('[aria-label="Selected athlete"]','caleb');
 await setCoord('X','-0.5');assert.equal((await read()).working.overrides['1/they'].anchors.Receive.caleb.x,-.5);mark('Signed X input preserves -0.5');
 const shared=structuredClone((await read()).working.overrides['1/they'].anchors.Receive.caleb);
 await click('Customise this case');await page.select('[aria-label="Editor attack side"]','right');await page.select('[aria-label="Editor first touch"]','harry');await setCoord('X','-0.25');
 let w=(await read()).working;assert.equal(w.caseOverrides['1/they/right/harry'].anchors.Receive.caleb.x,-.25);assert.deepEqual(w.overrides['1/they'].anchors.Receive.caleb,shared);mark('Exact-case override distinct from shared placement');
 await click('Reset case to shared');await click('Confirm case reset');w=(await read()).working;assert.equal(w.caseOverrides?.['1/they/right/harry'],undefined);assert.deepEqual(w.overrides['1/they'].anchors.Receive.caleb,shared);mark('Case reset returns to shared without deleting it');
 await click('Shared: all 4 cases');await click('Us serve');await stage('Defend');await page.select('[aria-label="Selected athlete"]','harry');
 const before=await read();await click('Later: after our attack');assert.deepEqual((await read()).working,before.working);await setCoord('X','-0.5');await setCoord('Z','4');
 const later=await read();assert.deepEqual(later.working.overrides['1/us'].laterDefend.anchors.harry,{x:-.5,z:4});
 const firstTime=before.time;
 const nowFirst=later.scenario.tracks.harry.find(k=>Math.abs(k.time-firstTime)<.0001),baselineFirst=before.scenario.tracks.harry.find(k=>Math.abs(k.time-firstTime)<.0001);
 assert.deepEqual(nowFirst,baselineFirst);mark('Later defence separate from first defensive event');
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});await sleep(1800);
 const mobile=await page.evaluate(()=>{const c=document.querySelector('.rotation-canvas').getBoundingClientRect(),p=document.querySelector('.strategy-panel').getBoundingClientRect();return {w:innerWidth,scroll:document.documentElement.scrollWidth,court:{w:c.width,b:c.bottom,r:c.right},panel:{l:p.left,t:p.top,r:p.right}}});
 assert.ok(mobile.scroll<=391&&mobile.court.w>=290&&mobile.panel.r<=391&&mobile.court.b<=mobile.panel.t+1,JSON.stringify(mobile));await page.screenshot({path:path.join(cache,'V5-S04A-parent-phone.png')});mark('390px mobile edit court and panel non-overlapping');
 await click('They serve');await stage('Receive');await page.select('[aria-label="Selected athlete"]','caleb');await setCoord('X','-.4');assert.equal((await read()).working.overrides['1/they'].anchors.Receive.caleb.x,-.4);mark('Mobile numeric edit works');
 await click('Save');const saved=await read();assert.ok(saved.library.find(x=>x.id===sentinel.id));assert.ok(saved.library.length>=2);
 await page.reload({waitUntil:'domcontentloaded'});await ready();const after=await read();assert.deepEqual(after.working,saved.working);
 assert.equal(await page.evaluate(()=>localStorage.getItem('rotation-studio-strategies-v1')),'original-v1-backup');mark('Save and reload preserve draft, sentinel and V1 backup');
 await click('Set arcs');await page.waitForFunction(()=>!document.querySelector('main.rotations')&&!!document.querySelector('canvas'),{timeout:20000});mark('Original Set arcs opens');
 assert.deepEqual(errors,[]);mark('Zero browser page errors');
}catch(e){outcome='FAIL';failure=e.stack||String(e);console.error('FAIL '+failure);await page.screenshot({path:path.join(cache,'V5-S04A-parent-failure.png')}).catch(()=>{})}finally{await fs.writeFile(path.join(cache,'V5-S04A-parent-result.json'),JSON.stringify({outcome,checks,failure,pageErrors:errors},null,2));await browser.close();}
if(outcome==='FAIL')process.exitCode=1;
