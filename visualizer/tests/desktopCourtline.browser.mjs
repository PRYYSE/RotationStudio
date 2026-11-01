// Desktop Courtline full-rally athlete editing acceptance using isolated Thorium. No user's browser profile.
import fs from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)).replace(/[\\/]+$/,'');
const viewMode=process.env.COURTLINE_QA_VIEW;
const editorMode=process.env.COURTLINE_QA_EDITOR;
const dir=root+(editorMode?'/.cache/g1-9-editor-20261101/'+editorMode:viewMode?'/.cache/desktop-view-v1-20261101/'+viewMode:'/.cache/desktop-rework-qa/slice-b');
await fs.mkdir(dir,{recursive:true});
const {default:puppeteer}=await import(pathToFileURL(root+'/.cache/browser-qa/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js').href);
const result={when:new Date().toISOString(),status:'RUNNING',checks:[],errors:[],screens:[],layouts:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms)), pass=s=>{result.checks.push(s);console.log('PASS',s)}, ok=(x,s)=>{if(!x)throw Error(s)};
let browser,page;
async function click(t){const bs=await page.$$('button');for(const b of bs){const s=await b.evaluate(e=>e.textContent.trim());if(s===t){await b.evaluate(e=>e.click());await pause(180);return}}throw Error('Button missing: '+t)}
async function event(id){
  const sel='.desktop-event-rail button[data-event-id="'+id+'"]';
  if(!await page.$(sel))await page.click('.source-moments-toggle');
  await page.waitForSelector(sel);const time=await page.$eval(sel,e=>parseFloat(e.querySelector('.event-caption').textContent));
  await page.$eval(sel,e=>e.click());await pause(220);
  ok(Math.abs(parseFloat(await page.$eval('[aria-label="Timeline time"]',e=>e.textContent))-time)<.02,'Event unselected '+id);
  ok(await page.$eval('[aria-label="Timeline time"]',e=>e.dataset.playing)==='false','Event selection played '+id);
}
async function select(label,value){const sel='select[aria-label="'+label+'"]';await page.waitForSelector(sel);await page.select(sel,value);await pause(200);ok(await page.$eval(sel,e=>e.value)===value,'Selection failed '+label+' '+value)}
async function shot(name){await page.screenshot({path:dir+'/'+name+'.png'});result.screens.push(name+'.png')}
async function editorCheck(){
  await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
  await page.goto((process.env.COURTLINE_QA_URL||'http://127.0.0.1:5221/RotationStudio/')+'?r=1&serve=us&attack=right&first=normal',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('canvas');await click('Edit strategy');await page.waitForSelector('.desktop-athlete-editor');await pause(700);
  await shot('edit-first-1440');
  const first=await page.evaluate(()=>{
    const bounds=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom}};
    const panel=document.querySelector('.strategy-panel');
    return{athlete:bounds('[aria-label="Selected athlete"]'),stage:bounds('.editor-selected-moment'),tools:bounds('.athlete-tool-switcher'),history:bounds('.athlete-quick-history'),save:bounds('.strategy-selection > button'),scroll:panel.scrollTop};
  });result.layouts.push(first);
  ok(first.scroll===0&&['athlete','stage','tools','history','save'].every(k=>first[k].top>=58&&first[k].bottom<900),'First-screen editing controls require scrolling');
  ok(!await page.$('.editor-athlete-heading h2')&&!await page.$('.editor-eyebrow'),'Duplicate athlete heading remains');
  ok(await page.$eval('[aria-label="Edit scope"] button',e=>e.getAttribute('aria-pressed'))==='true','This case is not default');
  await click('Shared foundation');ok(await page.$('.strategy-confirm'),'Shared scope needs confirmation');
  ok(await page.$eval('[aria-label="Edit scope"] button',e=>e.getAttribute('aria-pressed'))==='true','Shared scope applied before confirmation');
  await click('Cancel');pass('One athlete/stage header, visible tools/history/Save and confirmed shared scope');
  for(const [w,h] of [[1440,900],[1366,768],[3440,1440]]){
    await page.setViewport({width:w,height:h});await pause(400);
    const court=await page.$eval('.rotation-canvas',e=>e.getBoundingClientRect().height);
    await page.click('.source-moments-toggle');await page.waitForSelector('.all-source-events-open');
    const m=await page.evaluate(()=>{
      const nav=document.querySelector('.all-source-events-open'),r=nav.getBoundingClientRect(),current=nav.querySelector('[aria-pressed="true"]'),b=current.getBoundingClientRect();
      return{width:innerWidth,scroll:document.documentElement.scrollWidth,court:document.querySelector('.rotation-canvas').getBoundingClientRect().height,top:r.top,bottom:r.bottom,left:r.left,right:r.right,navScroll:nav.scrollWidth,navWidth:nav.clientWidth,focused:document.activeElement===current,onTop:nav.contains(document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)),labels:[...nav.querySelectorAll('strong')].map(e=>e.textContent),captions:[...nav.querySelectorAll('.event-caption')].map(e=>e.textContent)};
    });result.layouts.push(m);
    ok(m.court===court&&m.scroll<=w&&m.top>=58&&m.bottom<h&&m.left>=0&&m.right<=w&&m.navScroll<=m.navWidth,'Chooser changes court height or overflows at '+w);
    ok(m.focused&&m.onTop&&m.labels.length===16,'Chooser lost selection, source moments or stacking at '+w);
    ok(m.captions.some(t=>t.includes('First dig'))&&m.captions.some(t=>t.includes('Second dig')),'Dig contact sequence missing');
    await shot('moments-open-'+w);await page.keyboard.press('Escape');
    ok(!await page.$('.all-source-events-open'),'Escape did not dismiss');
    ok(await page.$eval('.source-moments-toggle',e=>e===document.activeElement),'Escape lost focus');
  }pass('All 16 moments readable above court; fixed court height and no overflow at 1366/1440/3440');
  await page.setViewport({width:1440,height:900});await pause(250);
  await page.click('.source-moments-toggle');await page.click('.source-moments-toggle');ok(!await page.$('.all-source-events-open'),'Toggle did not dismiss');
  await page.click('.source-moments-toggle');await page.click('.sequence-heading > strong');ok(!await page.$('.all-source-events-open'),'Click beside toggle did not dismiss');
  await page.click('.source-moments-toggle');await page.click('.desktop-camera-views button');ok(!await page.$('.all-source-events-open'),'Outside click did not dismiss');
  await page.focus('.source-moments-toggle');await page.keyboard.press('Enter');await pause(100);await page.keyboard.press('Tab');
  ok(await page.$eval('.all-source-events-open',e=>e.contains(document.activeElement)),'Tab cannot reach moments');
  await page.keyboard.press('Escape');pass('Toggle, Escape, outside click and keyboard Tab work');
  await page.click('.source-moments-toggle');
  const moments=await page.$$eval('.all-source-events-open button',es=>es.map(e=>({id:e.dataset.eventId,label:e.querySelector('strong').textContent,time:parseFloat(e.querySelector('.event-caption').textContent)})));
  for(const moment of moments){
    if(!await page.$('.all-source-events-open'))await page.click('.source-moments-toggle');
    await page.click('.all-source-events-open [data-event-id="'+moment.id+'"]');await pause(70);
    ok(!await page.$('.all-source-events-open'),'Selection did not close '+moment.id);
    ok(await page.$eval('.editor-selected-moment',e=>e.textContent).then(t=>t.includes(moment.label)),'Selected stage header missing '+moment.id);
    const time=await page.$eval('[aria-label="Timeline time"]',e=>({value:parseFloat(e.textContent),playing:e.dataset.playing}));
    ok(Math.abs(time.value-moment.time)<.02&&time.playing==='false','Moment seek not instant '+moment.id);
  }pass('Every authored moment jumps instantly and closes the chooser');
  await page.click('.source-moments-toggle');
  const detail=await page.$$eval('.all-source-events-open button',es=>es.find(e=>!document.querySelector('.stage-quick-list [data-event-id="'+e.dataset.eventId+'"]')).dataset.eventId);
  await page.click('.all-source-events-open [data-event-id="'+detail+'"]');
  ok(await page.$('.selected-detail-moment')&&!await page.$('.all-source-events-open'),'Detailed selection not communicated while closed');
  await page.click('.source-moments-toggle');
  ok(await page.$eval('.all-source-events-open [aria-pressed="true"]',(e,id)=>e.dataset.eventId===id&&e===document.activeElement,detail),'Reopening lost selected detailed moment');
  await shot('detail-selected-1440');await page.keyboard.press('Escape');pass('Off-strip moment stays clear; reopening focuses and reveals it');
  // A genuine pointer drag must commit a non-zero edit and remain one undoable action.
  await click('Top');await event('p0:legal-start');await select('Selected athlete','jaz');await click('Place');await pause(300);
  const loc=await page.$eval('[data-player="jaz"].athlete-label',e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y-12}});
  await page.mouse.move(loc.x,loc.y);await page.mouse.down();await page.mouse.move(loc.x+44,loc.y-24,{steps:12});await page.mouse.up();await pause(300);
  const changed=await page.$eval('.edit-change-summary',e=>parseFloat(e.textContent));ok(changed>.15,'Real drag did not move athlete');
  await click('Undo');ok(await page.$eval('.edit-change-summary',e=>parseFloat(e.textContent))<.015,'Undo did not restore position');
  await click('Redo');ok(Math.abs(await page.$eval('.edit-change-summary',e=>parseFloat(e.textContent))-changed)<.03,'Redo did not restore drag');
  await shot('drag-redone-1440');pass('Real non-zero drag, Undo and Redo');
  await page.setViewport({width:390,height:844});await pause(300);await shot('phone-editor-390');
  ok(!await page.$('.desktop-event-rail')&&!await page.$('.athlete-tool-switcher'),'Desktop controls leaked to phone');
  ok(await page.$('.event-navigator')&&await page.$('canvas'),'Phone event controls or court missing');
  ok(!result.errors.length,'Browser errors: '+result.errors.join('; '));pass('Phone editor retains existing event controls; no JS errors');
}
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
result.phase='isolated-browser-launch';
browser=await puppeteer.launch({executablePath:process.env.COURTLINE_QA_BROWSER || 'D:/Tools/Thorium-QA/156.0.8078.28/BIN/thorium.exe',headless:true,userDataDir:dir+'/isolated-'+Date.now(),timeout:Number(process.env.COURTLINE_QA_LAUNCH_TIMEOUT||30000),protocolTimeout:60000,args:['--no-first-run','--no-proxy-server','--disable-background-networking']});
page=await browser.newPage();page.setDefaultTimeout(27000);page.on('pageerror',e=>result.errors.push('PAGE '+e.message));page.on('console',e=>{if(e.type()==='error')result.errors.push('CONSOLE '+e.text().slice(0,200))});
result.phase='browser-checks';
if(editorMode){await editorCheck();result.status='PASS'}else if(viewMode){await viewCheck();result.status='PASS'}else{
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
ok(await page.$eval('.desktop-athlete-editor',e=>e.textContent.includes('drag the athlete to their spot')||e.textContent.includes('Drag the athlete to their spot')),'Concise Place guidance missing');
pass('Simple Start -> Receive stage navigation is instant; concise Place guidance visible');
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
