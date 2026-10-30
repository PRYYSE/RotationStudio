import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const root='D:/Projects/RotationStudio-V4';const cache=root+'/.cache/browser-qa';const dir=cache+'/v5-uat-mobile-remediation';
await fs.mkdir(dir,{recursive:true});
const {default:puppeteer}=await import(pathToFileURL(cache+'/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js').href);
const report={status:'FAIL',checks:[],failures:[],screenshots:[],pageErrors:[],geometry:[]};
let browser,page;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const mark=(s,data)=>{report.checks.push({s,data});console.log('PASS',s,JSON.stringify(data).slice(0,300))};
const snap=async s=>{await page.screenshot({path:dir+'/'+s+'.png'});report.screenshots.push(s+'.png')};
const goto=async(url)=>{await page.goto('http://127.0.0.1:5205/RotationStudio/?mode=rotations&r=1&serve=they'+url,{waitUntil:'domcontentloaded'});await page.waitForSelector('[aria-label="Shuffle source"]');await wait(200)};
const measure=()=>page.evaluate(()=>{const rect=e=>{const r=document.querySelector(e).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom}};return{w:innerWidth,h:innerHeight,scroll:document.documentElement.scrollWidth,viewer:rect('.viewer-panel'),cue:rect('.viewer-mobile-role-call'),editor:document.querySelector('.strategy-panel')?rect('.strategy-panel'):null,court:rect('canvas'),footer:rect('.rotation-bottom'),cueVisible:getComputedStyle(document.querySelector('.viewer-mobile-role-call')).display!=='none',text:document.querySelector('.viewer-mobile-role-call').textContent.trim()}})
try{
 browser=await puppeteer.launch({executablePath:'D:/Tools/Thorium-QA/156.0.8078.28/BIN/thorium.exe',headless:true,userDataDir:cache+'/v5-uat-mobile-fixed-'+Date.now(),args:['--no-first-run','--no-proxy-server','--disable-background-networking'],protocolTimeout:25000});
 page=await browser.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.pageErrors.push(e.message));
 for(const [w,h] of [[390,844],[375,812],[844,390],[1440,900]]){
   await page.setViewport({width:w,height:h});await goto('');
   const m=await measure();report.geometry.push(m);assert.ok(m.scroll<=w+1,'overflow '+w+' '+m.scroll);
   assert.match(m.text,/Harry|Team/i,'no player label');
   if(w<=850){assert.ok(m.cueVisible,'mobile cue missing');assert.ok(m.cue.y>=m.viewer.y&&m.cue.y<m.viewer.bottom,'quick instruction outside visible context');assert.ok(m.cue.w<=w);}
   else assert.equal(m.cueVisible,false);
   await snap('viewer-'+w+'x'+h);mark('Player instruction visible and court responsive '+w+'x'+h,{cueVisible:m.cueVisible,visiblePixels:Math.max(0,Math.min(m.viewer.bottom,m.cue.bottom)-Math.max(m.viewer.y,m.cue.y)),court:m.court.w});
 }
 await page.setViewport({width:844,height:390});
 await goto('&attack=right&first=normal');
 for(const b of await page.$$('button'))if(await b.evaluate(e=>e.textContent.trim()==='Edit strategy')){await b.click();break}
 await page.waitForSelector('.strategy-panel');
 const editor=await page.evaluate(()=>{const e=document.querySelector('.strategy-panel'),m=document.querySelector('.rotation-markers'),footer=document.querySelector('.rotation-footer');const r=e.getBoundingClientRect();return{h:r.height,scroll:e.scrollHeight,stageStrip:getComputedStyle(m).display,footer:getComputedStyle(footer).display,visibleButtons:[...e.querySelectorAll('button')].filter(b=>{const x=b.getBoundingClientRect();return x.top>=r.top&&x.bottom<=r.bottom}).map(b=>b.textContent.trim()).slice(0,15)}});
 assert.ok(editor.h>=100,'landscape editor still too short '+JSON.stringify(editor));
 assert.equal(editor.stageStrip,'none');assert.equal(editor.footer,'none');
 await snap('editor-landscape-844x390');
 mark('Landscape editor has useful independent workspace',{height:editor.h,visibleButtons:editor.visibleButtons});
 assert.deepEqual(report.pageErrors,[]);report.status='PASS';
}catch(e){report.failures.push(e.stack||String(e));console.error('FAIL',e.stack||e);if(page)await snap('failure').catch(()=>{})}
finally{report.status=report.failures.length?'FAIL':report.status;await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));if(browser)await browser.close().catch(()=>{});console.log('FINAL',report.status,'checks',report.checks.length,'screenshots',report.screenshots.length);process.exitCode=report.status==='PASS'?0:1}
