import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root='D:/Projects/RotationStudio-V4';
const cache=root+'/.cache/browser-qa';
const dir=cache+'/v5-uat-matrix';
await fs.mkdir(dir,{recursive:true});
const {default:puppeteer}=await import(pathToFileURL(cache+'/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js').href);
const plans=JSON.parse(await fs.readFile(root+'/visualizer/public/plans/rotations.json','utf8'));
const base='http://127.0.0.1:5205/RotationStudio/';
const receipt={status:'FAIL',checks:[],cases:[],screens:[],errors:[],samples:[],geometry:[],failures:[]};
let browser,page;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const log=(label,data)=>{receipt.checks.push({label,data});console.log('PASS',label,JSON.stringify(data).slice(0,150))};
const snap=async label=>{const p=dir+'/'+label+'.png';await page.screenshot({path:p});receipt.screens.push(label+'.png')};
const click=async label=>{for(const b of await page.$$('button'))if(await b.evaluate((e,t)=>e.textContent.trim()===t,label)){await b.evaluate(e=>e.scrollIntoView({block:'nearest'}));await b.click();await pause(80);return}throw Error('Missing button '+label)};
const goto=async query=>{await page.goto(base+'?'+query,{waitUntil:'domcontentloaded'});await page.waitForSelector('[aria-label="Shuffle source"]');await pause(100)};
const selected=()=>page.$eval('[aria-label="Shuffle source"]',e=>({id:e.dataset.case,receiver:e.dataset.receiver,text:e.textContent}));
const button=async(sel,i)=>{await page.$eval(sel,(e,n)=>e.querySelectorAll('button')[n].click(),i);await pause(40)};
try {
browser=await puppeteer.launch({executablePath:'D:/Tools/Thorium-QA/156.0.8078.28/BIN/thorium.exe',headless:true,userDataDir:cache+'/v5-uat-matrix-profile-'+Date.now(),protocolTimeout:30000,args:['--no-first-run','--no-proxy-server','--disable-background-networking']});
page=await browser.newPage();page.setDefaultTimeout(17000);await page.setViewport({width:1440,height:900});
page.on('pageerror',e=>receipt.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('fonts.google'))receipt.errors.push(m.text())});
await goto('mode=rotations&r=1&serve=they');await snap('desktop-open');
assert.equal((await page.$$('.athlete-label')).length,6);assert.match(await page.$eval('.demo-disclaimer',e=>e.textContent),/Draft/i);
log('Desktop 3D court + six player identities + DRAFT',await page.$eval('canvas',e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
await click('Scenario Explorer');
for(let r=1;r<=6;r++)for(const serve of ['they','us']){
  await button('[aria-label="Rotation"]',r-1);await button('[aria-label="Serve ownership"]',serve==='they'?0:1);
  for(const attack of ['left','right'])for(const first of ['normal','harry']){
    await button('[aria-label="Their attack"]',attack==='left'?0:1);await button('[aria-label="First contact"]',first==='normal'?0:1);
    const key=[r,serve,attack,first].join('/');await page.waitForFunction(k=>document.querySelector('[aria-label="Shuffle source"]')?.dataset.case===k,{},key);
    const item=await selected(),source=plans.scenarios.find(s=>s.rotation===r&&s.serve===serve);
    const variant=[source,...Object.values(source.alternates)].find(s=>s.tactics.opponentAttack===attack&&s.tactics.firstTouch===first);
    assert.ok(variant);assert.equal(item.receiver,variant.firstContact.player,key);assert.match(item.text,/DRAFT/);
    receipt.cases.push({key,receiver:item.receiver});
  }
  await snap('r'+r+'-'+serve);
}
assert.equal(receipt.cases.length,48);log('All 48 authored rotation/serve/attack/first-toucher variants',receipt.cases.length);
await goto('mode=rotations&r=3&serve=they');await click('Scenario Explorer');
const grid=await page.$$('[aria-label="First-ball landing location"] button');assert.equal(grid.length,9);
for(let i=0;i<9;i++){await grid[i].click();await pause(110);const msg=await page.$eval('.first-ball-examples .example-notice',e=>e.textContent);assert.match(msg,/Teaching example|No feasible authored example/);receipt.samples.push({i,msg});}
log('All nine First Ball cells',receipt.samples.length);await click('Authored (default)');
await goto('mode=rotations&r=1&serve=they');
await page.click('[aria-label="Seek Receive"]');await pause(350);
const tm=await page.$eval('[aria-label="Timeline time"]',e=>({v:parseFloat(e.textContent),to:Number(e.dataset.destination),playing:e.dataset.playing}));
assert.ok(tm.v>0&&tm.v<tm.to&&tm.playing==='true',JSON.stringify(tm));await page.click('[aria-label="Jump to destination or next phase"]');await pause(70);
const ended=await page.$eval('[aria-label="Timeline time"]',e=>({v:parseFloat(e.textContent),playing:e.dataset.playing}));
console.log('PHASE_DIAGNOSTIC',JSON.stringify({mid:tm,afterJump:ended}));assert.ok(Math.abs(ended.v-tm.to)<.03&&ended.playing==='false','Jump mismatch: '+JSON.stringify({tm,ended}));log('Continuous View phase motion and exact Jump',tm);
for(const [w,h] of [[1440,900],[390,844],[375,812],[768,1024],[844,390]]){
  await page.setViewport({width:w,height:h});await pause(240);
  const metric=await page.evaluate(()=>({w:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,court:document.querySelector('canvas').getBoundingClientRect().width}));
  receipt.geometry.push(metric);assert.ok(metric.overflow<=1&&metric.court>=250,JSON.stringify(metric));await snap('viewport-'+w+'x'+h);
}
log('Five responsive viewports',receipt.geometry);
for(const view of ['top','front','side','orbit']){await page.select('[aria-label="Court camera view"]',view);assert.equal(await page.$eval('[aria-label="Court camera view"]',e=>e.value),view)}
await click('Visibility');assert.equal((await page.$$('#court-visibility input[type="checkbox"]')).length,7);log('Four quick cameras + seven layer toggles',7);
await snap('visibility-desktop');receipt.status='PASS';
}catch(e){receipt.failures.push(e.stack||String(e));console.error('FAILED',e.stack||e);if(page)await snap('failure').catch(()=>{})}
finally{receipt.status=receipt.failures.length?'FAIL':receipt.status;await fs.writeFile(dir+'/report.json',JSON.stringify(receipt,null,2));if(browser)await browser.close().catch(()=>{});console.log('FINAL',receipt.status,'checks',receipt.checks.length,'cases',receipt.cases.length,'screens',receipt.screens.length);process.exitCode=receipt.status==='PASS'?0:1}
