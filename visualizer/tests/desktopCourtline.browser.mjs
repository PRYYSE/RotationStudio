// Desktop Courtline full-rally athlete editing acceptance using isolated Thorium. No user's browser profile.
import fs from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)).replace(/[\\/]+$/,'');
const viewMode=process.env.COURTLINE_QA_VIEW;
const dir=root+(viewMode?'/.cache/desktop-view-v1-20261101/'+viewMode:'/.cache/desktop-rework-qa/slice-b');
await fs.mkdir(dir,{recursive:true});
const {default:puppeteer}=await import(pathToFileURL(root+'/.cache/browser-qa/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js').href);
const result={when:new Date().toISOString(),status:'RUNNING',checks:[],errors:[],screens:[],layouts:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms)), pass=s=>{result.checks.push(s);console.log('PASS',s)}, ok=(x,s)=>{if(!x)throw Error(s)};
let browser,page;
async function click(t){const bs=await page.$$('button');for(const b of bs){const s=await b.evaluate(e=>e.textContent.trim());if(s===t){await b.evaluate(e=>e.click());await pause(180);return}}throw Error('Button missing: '+t)}
async function event(id){const sel='.desktop-event-rail button[data-event-id="'+id+'"]';await page.waitForSelector(sel);await page.$eval(sel,e=>e.click());await pause(220);ok(await page.$eval(sel,e=>e.getAttribute('aria-pressed'))==='true','Event unselected '+id)}
async function select(label,value){const sel='select[aria-label="'+label+'"]';await page.waitForSelector(sel);await page.select(sel,value);await pause(200);ok(await page.$eval(sel,e=>e.value)===value,'Selection failed '+label+' '+value)}
async function shot(name){await page.screenshot({path:dir+'/'+name+'.png'});result.screens.push(name+'.png')}
async function viewCheck(){
  const baseline=viewMode==='baseline', reference=root+'/.cache/desktop-view-v1-20261101/baseline';
  const visible=sel=>page.$eval(sel,e=>e.checkVisibility());
  const details=async sel=>{await page.$eval(sel,e=>{e.open=true});await pause(80)};
  const fresh=async(w,h)=>{
    await page.setViewport({width:w,height:h,deviceScaleFactor:1});
    await page.goto((process.env.COURTLINE_QA_URL||'http://127.0.0.1:5221/RotationStudio/')+'?r=1&serve=us&attack=right&first=normal',{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.player-focus .focus-primary');await pause(700);
  };
  for(const [w,h] of [[1440,900],[1366,768],[3440,1440]]){
    await fresh(w,h);await shot('view-r1-us-'+w);
    const m=await page.evaluate(()=>{
      const action=document.querySelector('.focus-primary'),r=action.getBoundingClientRect();
      return{width:innerWidth,scroll:document.documentElement.scrollWidth,actionBottom:r.bottom,action:action.textContent,footerBottom:Math.max(...[...document.querySelectorAll('.rotation-footer button')].map(e=>e.getBoundingClientRect().bottom)),playing:document.querySelector('[aria-label="Timeline time"]').dataset.playing};
    });result.layouts.push(m);
    ok(m.scroll<=w&&m.actionBottom<h,'Player action clipped / page overflow at '+w);
    ok(m.action.includes('Harry')&&m.playing==='false','Authored Harry action / paused View missing');
    if(!baseline)ok(m.footerBottom<=h,'Footer controls clipped at '+w);
  }
  await fresh(1440,900);await click('They serve');await shot('view-r1-they-1440');await click('R3');await shot('view-r3-they-1440');
  await click('Edit strategy');await page.waitForSelector('.desktop-athlete-editor');await shot('edit-r3-1440');await click('View');
  await click('Scenario Explorer');await shot('scenario-1440');
  // Compare phone DOM and original Set arcs with the same isolated, empty storage.
  await fresh(390,844);
  const phone=await page.$eval('main',e=>e.outerHTML);await shot('mobile-390');
  if(baseline)await fs.writeFile(dir+'/mobile.html',phone);else ok(phone===await fs.readFile(reference+'/mobile.html','utf8'),'Phone View markup changed');
  await click('Scenario Explorer');
  const phoneSettings=await page.$eval('main',e=>e.outerHTML);await shot('mobile-settings-390');
  if(baseline)await fs.writeFile(dir+'/mobile-settings.html',phoneSettings);else ok(phoneSettings===await fs.readFile(reference+'/mobile-settings.html','utf8'),'Phone settings markup changed');
  await page.setViewport({width:1440,height:900});await click('Set arcs');await pause(700);await shot('set-arcs-1440');
  const arcs=await page.$eval('#root',e=>e.innerText);
  if(baseline)await fs.writeFile(dir+'/arcs.txt',arcs);else ok(arcs===await fs.readFile(reference+'/arcs.txt','utf8'),'Set arcs controls changed');
  await click('Skip');await page.waitForSelector('[aria-label="Play set"]');await pause(400);await shot('set-arcs-court-1440');
  await page.click('[aria-label="Play set"]');await page.waitForSelector('[aria-label="Pause"]');await pause(180);
  ok(await page.$eval('[aria-label="Scrub set"]',e=>Number(e.value)>0),'Set arcs playback did not advance');await page.click('[aria-label="Pause"]');
  for(const camera of ['Side','Orbit','Front'])await click(camera);
  await fresh(1440,900);
  ok(!await page.$('.viewer-panel > .shuffle-controls'),'Default View starts with Shuffle controls');
  ok(await visible('.focus-identity-select select'),'Quick player selection must be visible without opening details');
  ok(await visible('.focus-identity-select select')&&await visible('.focus-next-moment'),'Player selector / next moment not visible');
  ok(!await page.$('.court-workbench-caption > span'),'Synthetic court eyebrow remains');
  ok(await page.$eval('.rotation-selectors .demo-tag',e=>e.textContent.trim())==='DRAFT','Top DRAFT missing');
  ok(!await page.$('.rotation-footer > span'),'Repeated ordinary DRAFT footer');
  await details('.player-focus details');ok(await visible('.focus-source'),'Source provenance inaccessible');
  ok(await page.$$eval('.player-focus select[aria-label="Whole team or player"]',a=>a.length===1),'Duplicate player selector');
  await select('Whole team or player','caleb');ok(await page.$eval('.focus-identity-select select',e=>e.value==='caleb'),'Player selection failed');
  await select('Whole team or player','');ok(await page.$eval('.focus-identity-select select',e=>e.value===''),'Whole-team focus lost');
  await select('Whole team or player','harry');pass('One-click player switching, authored action and next moment lead; source available in Tactical details');
  await click('Scenario Explorer');
  ok(!await page.$('.viewer-panel .player-focus'),'Player inspector still competes with Explorer');
  ok(await visible('[aria-label="First contact"]')&&await visible('[aria-label="Their attack"]'),'Primary scenario toggles missing');
  ok(!await visible('.first-ball-examples')&&!await visible('.shuffle-controls'),'Practice dominates initial Explorer');
  ok(!await page.$('.rotation-settings [aria-label="Camera view"]'),'Duplicate Explorer cameras remain');
  await page.focus('.practice-tools > summary');await page.keyboard.press('Enter');await pause(80);
  ok((await page.$$('[aria-label="First-ball landing location"] button')).length===9,'3x3 examples missing');
  await page.click('[aria-label="Short left, x -3, z 3.5 metres"]');await pause(200);
  ok(await page.$eval('[aria-label="Short left, x -3, z 3.5 metres"]',e=>e.getAttribute('aria-pressed'))==='true','Teaching sample selection failed');
  await click('Authored (default)');
  await page.click('[aria-label="Shuffle Play"]');ok(await page.$eval('[aria-label="Shuffle Play"]',e=>e.getAttribute('aria-pressed'))==='true','Shuffle cannot be armed');
  ok(await page.$eval('[aria-label="Timeline time"]',e=>e.dataset.playing)==='false','Arming Shuffle must not animate');
  await click('Player Focus');ok(await page.$eval('.rotation-play',e=>e.textContent==='Play shuffle'),'Returning to player focus disarmed Shuffle');await click('Scenario Explorer');
  await click('Next variation');await details('.shuffle-history');
  ok((await page.$$('[aria-label="Shuffle case history"] li')).length>=2,'Shuffle history missing');
  const history=await page.$eval('.shuffle-history > div',e=>{const r=e.getBoundingClientRect();return{width:r.width,right:r.right}});
  ok(history.width>=250&&history.right<=1440,'Shuffle history is cramped or outside viewport');
  await shot('practice-history-1440');await page.$eval('.shuffle-history',e=>{e.open=false});
  await page.click('[aria-label="Shuffle Play"]');
  pass('Practice exposes 3x3 samples, Shuffle, Next and History without automatic animation');
  for(const rotation of [1,2,3,4,5,6])for(const serve of ['Us serve','They serve'])for(const attack of ['Our left','Our right'])for(const first of ['Normal','Harry first']){
    await click('R'+rotation);await click(serve);await click(attack);await click(first);
    const state=await page.$eval('.shuffle-source',e=>({key:e.dataset.case,receiver:e.dataset.receiver}));
    ok(state.key===`${rotation}/${serve==='Us serve'?'us':'they'}/${attack==='Our left'?'left':'right'}/${first==='Normal'?'normal':'harry'}`,'Wrong scenario '+state.key);
    ok((state.receiver==='harry')===(first==='Harry first'),'Authored first-contact selection failed '+state.key);
  }pass('All 48 authored cases switch with the expected first contact');
  await shot('scenario-r6-harry-first-1440');await click('Player Focus');
  await page.click('[aria-label="Seek Receive"]');
  ok(await page.$eval('[aria-label="Timeline time"]',e=>e.dataset.playing)==='false','Manual stage change animated');
  const time=await page.$eval('[aria-label="Timeline time"]',e=>e.textContent);await pause(200);
  ok(time===await page.$eval('[aria-label="Timeline time"]',e=>e.textContent),'Manual stage time drift');
  await page.click('.rotation-play');await pause(500);ok(await page.$eval('[aria-label="Timeline time"]',e=>e.dataset.playing)==='true','Play failed');await page.click('.rotation-play');
  for(const camera of ['Top','Orbit','Front','Side']){await click(camera);ok(await page.$eval('.desktop-camera-views button[aria-pressed="true"]',e=>e.textContent)===camera,'Camera failed '+camera)}
  pass('Manual stages are instant; Play animates; all four court cameras remain accessible');
  ok(!result.errors.length,'JS errors '+result.errors.join('; '));pass('Phone View/settings markup and Set arcs controls unchanged; no JS errors or viewport overflow');
}
try{
browser=await puppeteer.launch({executablePath:process.env.COURTLINE_QA_BROWSER || 'D:/Tools/Thorium-QA/156.0.8078.28/BIN/thorium.exe',headless:true,userDataDir:dir+'/isolated-'+Date.now(),timeout:90000,protocolTimeout:60000,args:['--no-first-run','--no-proxy-server','--disable-background-networking']});
page=await browser.newPage();page.setDefaultTimeout(27000);page.on('pageerror',e=>result.errors.push('PAGE '+e.message));page.on('console',e=>{if(e.type()==='error')result.errors.push('CONSOLE '+e.text().slice(0,200))});
if(viewMode){await viewCheck();result.status='PASS'}else{
await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
await page.goto((process.env.COURTLINE_QA_URL || 'http://127.0.0.1:5221/RotationStudio/')+'?r=1&serve=us&attack=right&first=normal',{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('canvas');await pause(400);await click('Edit strategy');await page.waitForSelector('.desktop-athlete-editor');
ok(!!await page.$('.desktop-event-rail'),'Event rail absent');
ok(!!await page.$('.athlete-tool-switcher'),'Quick athlete tool switcher absent');
const quick=await page.$$eval('.stage-quick-list button',xs=>xs.map(x=>x.querySelector('strong')?.textContent.trim()));
ok(quick.includes('Start')&&quick.includes('Receive / dig')&&quick.includes('Next dig'),'V4-style quick stages absent');
ok(!await page.$('.all-source-events-open'),'Technical moments must start collapsed');
const toggle=await page.$eval('.source-moments-toggle',e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,parentRight:p.right,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}});
ok(toggle.width>=140&&toggle.scrollWidth<=toggle.clientWidth+1&&toggle.right<=toggle.parentRight+1,'More moments control is clipped at normal desktop size');
await page.click('button[aria-label="Edit Start stage"]');await pause(140);
ok(await page.$eval('button[aria-label="Edit Start stage"]',e=>e.getAttribute('aria-pressed'))==='true','Start stage selection failed');
await page.click('button[aria-label="Edit Receive / dig stage"]');await pause(180);
ok(await page.$eval('button[aria-label="Edit Receive / dig stage"]',e=>e.getAttribute('aria-pressed'))==='true','Receive stage selection failed');
ok(await page.$eval('[aria-label="Timeline time"]',e=>e.dataset.playing)==='false','Changing stages unexpectedly animates');
ok(await page.$eval('.desktop-athlete-editor',e=>e.textContent.includes('Their path connects automatically')),'Stage editing guidance missing');
pass('Simple Start -> Receive stage navigation is instant; automatic path guidance visible');
await page.click('.source-moments-toggle');await page.waitForSelector('.all-source-events-open');
ok((await page.$$('.all-source-events-open button')).length>=14,'Detailed source moments lost');
await page.click('.source-moments-toggle');await pause(90);
ok(!await page.$('.all-source-events-open'),'Extra moments did not collapse');
const toolBounds=await page.$eval('.athlete-tool-switcher',e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,h:innerHeight}});
ok(toolBounds.bottom<=toolBounds.h,'Athlete tools below desktop viewport');ok(await page.$eval('.athlete-tool-switcher',e=>['Place','Route','Action','Zone'].every(t=>[...e.querySelectorAll('button')].some(b=>b.textContent.trim()===t))),'Missing Place/Route/Action/Zone tools');
pass('Desktop player-editor tools and chronological source events present');
await event('p3:our-dig');await select('Selected athlete','harry');await click('Action');await select('Teaching action','cover');
await event('p8:next-dig');await select('Teaching action','receive');
const harryTag=await page.$eval('.athlete-label[data-player="harry"]',e=>e.textContent.trim());
ok(harryTag.includes('Harry')&&/P\d/.test(harryTag)&&!harryTag.includes('Receive')&&!harryTag.includes('Cover'),'Desktop tags should show compact name/P only, not action text');
await event('p3:our-dig');ok(await page.$eval('select[aria-label="Teaching action"]',e=>e.value)==='cover','Earlier action lost');
await event('p8:next-dig');ok(await page.$eval('select[aria-label="Teaching action"]',e=>e.value)==='receive','Later action lost');
pass('Harry Cover and Receive independently authored at first/next dig');
await select('Selected athlete','georgia');await click('Route');
ok(await page.$eval('#athlete-tool-panel',e=>e.textContent.includes('Only the path from the previous moment') && e.textContent.includes('From previous:') && !e.textContent.includes('Leaving path')),'Selected player route must show incoming path only');
await click('Add bend');
ok(await page.$eval('.desktop-athlete-editor',e=>e.textContent.includes('Delete bend')),'Incoming bend not added');pass('Georgia incoming movement bend authored without outgoing clutter');
await select('Selected athlete','jaz');await click('Zone');await select('Coverage purpose','tip');pass('Jaz tip-zone coverage authored');
await shot('desktop-edits-1440');await click('Save');await pause(420);
const prior=await page.evaluate(()=>localStorage.getItem('rotation-studio-strategies-v2'));const j=JSON.parse(prior||'null');ok(j?.library?.length>0,'Missing library save');
const saved=j.library.find(s=>s.id===j.activeId), patch=saved?.caseOverrides?.['1/us/right/normal']?.eventOverrides;
ok(patch?.['p3:our-dig']?.actions?.harry==='cover','First action missing in save');ok(patch?.['p8:next-dig']?.actions?.harry==='receive','Second action missing in save');
ok(patch?.['p8:next-dig']?.coverage?.jaz?.role==='tip','Coverage missing in save');ok(!!patch?.['p8:next-dig']?.routes?.georgia?.length,'Route bend missing in save');
ok(!saved?.caseOverrides?.['1/us/left/normal'],'Unrelated case modified');pass('Saved actions/routes/coverage case isolated');
await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('canvas');await pause(350);await click('Edit strategy');await page.waitForSelector('.desktop-athlete-editor');
await event('p3:our-dig');await select('Selected athlete','harry');await click('Action');ok(await page.$eval('select[aria-label="Teaching action"]',e=>e.value)==='cover','First action lost after reload');
await event('p8:next-dig');ok(await page.$eval('select[aria-label="Teaching action"]',e=>e.value)==='receive','Later action lost after reload');
ok(await page.evaluate(()=>localStorage.getItem('rotation-studio-strategies-v2'))===prior,'Reload modified library unexpectedly');pass('Saved strategy survives reload byte-identically');
await event('p3:our-dig');const before=Number((await page.$eval('[aria-label="Timeline time"]',e=>e.textContent)).replace('s',''));await page.click('button[aria-label="Play"]');
await page.waitForFunction(()=>document.querySelector('[aria-label="Timeline time"]')?.dataset.playing==='true',{timeout:4000});await pause(900);
const after=Number((await page.$eval('[aria-label="Timeline time"]',e=>e.textContent)).replace('s',''));ok(after>before+0.03,'Play did not advance');
await page.click('button[aria-label="Pause"]');await pause(120);ok(await page.$eval('[aria-label="Timeline time"]',e=>e.dataset.playing)==='false','Pause ineffective');pass('Play advances full-rally preview and Pause halts');
for(const [w,h] of [[1440,900],[3440,1440],[390,844]]){await page.setViewport({width:w,height:h});await pause(320);const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,rail:!!document.querySelector('.desktop-event-rail'),canvas:!!document.querySelector('canvas')}));result.layouts.push(m);ok(m.scroll<=w+1,'Horizontal overflow at '+w);ok(m.rail===(w>=900),'Breakpoint rail mismatch at '+w);ok(m.canvas,'Court missing at '+w);if(w<900)ok(!await page.$('.athlete-tool-switcher'),'Desktop tools leaked onto mobile');await shot('viewport-'+w)}
await page.setViewport({width:1440,height:900});await pause(190);await click('They serve');await pause(230);
const opponentStages=await page.$$eval('.stage-quick-list strong',es=>es.map(x=>x.textContent.trim()));
ok(opponentStages.includes('Receive / dig')&&opponentStages.includes('Block / defend')&&opponentStages.includes('Next set'),'Their-serve quick stages must expose first pass, block and next set');
await page.click('button[aria-label="Edit Receive / dig stage"]');await pause(130);
ok(await page.$eval('[aria-label="Timeline time"]',e=>e.dataset.playing)==='false','Their-serve receive auto-animates unexpectedly');
pass('They-serve quick stages map first pass/block/next set correctly and jump instantly');
ok(!result.errors.length,'Page errors: '+result.errors.join('; '));pass('Desktop/ultrawide/mobile no horizontal overflow or JS exceptions');result.status='PASS';
}
}catch(e){result.status='FAIL';result.error=String(e.stack||e);console.log('FAIL',result.error);if(page)await shot('failure').catch(()=>{})}
finally{await fs.writeFile(dir+'/result.json',JSON.stringify(result,null,2));console.log('FINAL',result.status,result.checks.length,'checks');if(browser)await browser.close().catch(()=>{});if(result.status==='FAIL')process.exitCode=1}
