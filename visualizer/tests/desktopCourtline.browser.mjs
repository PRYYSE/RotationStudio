// Desktop Courtline full-rally athlete editing acceptance using isolated Thorium. No user's browser profile.
import fs from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)).replace(/[\\/]+$/,'');
const dir=root+'/.cache/desktop-rework-qa/slice-b';
await fs.mkdir(dir,{recursive:true});
const {default:puppeteer}=await import(pathToFileURL(root+'/.cache/browser-qa/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js').href);
const result={when:new Date().toISOString(),status:'RUNNING',checks:[],errors:[],screens:[],layouts:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms)), pass=s=>{result.checks.push(s);console.log('PASS',s)}, ok=(x,s)=>{if(!x)throw Error(s)};
let browser,page;
async function click(t){const bs=await page.$$('button');for(const b of bs){const s=await b.evaluate(e=>e.textContent.trim());if(s===t){await b.evaluate(e=>e.click());await pause(180);return}}throw Error('Button missing: '+t)}
async function event(id){const sel='.desktop-event-rail button[data-event-id="'+id+'"]';await page.waitForSelector(sel);await page.$eval(sel,e=>e.click());await pause(220);ok(await page.$eval(sel,e=>e.getAttribute('aria-pressed'))==='true','Event unselected '+id)}
async function select(label,value){const sel='select[aria-label="'+label+'"]';await page.waitForSelector(sel);await page.select(sel,value);await pause(200);ok(await page.$eval(sel,e=>e.value)===value,'Selection failed '+label+' '+value)}
async function shot(name){await page.screenshot({path:dir+'/'+name+'.png'});result.screens.push(name+'.png')}
try{
browser=await puppeteer.launch({executablePath:process.env.COURTLINE_QA_BROWSER || 'D:/Tools/Thorium-QA/156.0.8078.28/BIN/thorium.exe',headless:true,userDataDir:dir+'/isolated-'+Date.now(),timeout:90000,protocolTimeout:60000,args:['--no-first-run','--no-proxy-server','--disable-background-networking']});
page=await browser.newPage();page.setDefaultTimeout(27000);page.on('pageerror',e=>result.errors.push('PAGE '+e.message));page.on('console',e=>{if(e.type()==='error')result.errors.push('CONSOLE '+e.text().slice(0,200))});
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
ok(toolBounds.bottom<=toolBounds.h,'Athlete tools below desktop viewport');ok(await page.$eval('.desktop-athlete-editor',e=>/Action/.test(e.textContent)&&/Coverage/.test(e.textContent)),'Missing action/coverage editor');
pass('Desktop player-editor tools and chronological source events present');
await event('p3:our-dig');await select('Selected athlete','harry');await click('Action');await select('Teaching action','cover');
await event('p8:next-dig');await select('Teaching action','receive');
const harryTag=await page.$eval('.athlete-label[data-player="harry"]',e=>e.textContent.trim());
ok(harryTag.includes('Harry')&&/P\d/.test(harryTag)&&!harryTag.includes('Receive')&&!harryTag.includes('Cover'),'Desktop tags should show compact name/P only, not action text');
await event('p3:our-dig');ok(await page.$eval('select[aria-label="Teaching action"]',e=>e.value)==='cover','Earlier action lost');
await event('p8:next-dig');ok(await page.$eval('select[aria-label="Teaching action"]',e=>e.value)==='receive','Later action lost');
pass('Harry Cover and Receive independently authored at first/next dig');
await select('Selected athlete','georgia');await click('Route');await click('Arriving path');await click('Add bend');
ok(await page.$eval('.desktop-athlete-editor',e=>e.textContent.includes('Delete bend')),'Bend not added');pass('Georgia movement bend authored');
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
}catch(e){result.status='FAIL';result.error=String(e.stack||e);console.log('FAIL',result.error);if(page)await shot('failure').catch(()=>{})}
finally{await fs.writeFile(dir+'/result.json',JSON.stringify(result,null,2));console.log('FINAL',result.status,result.checks.length,'checks');if(browser)await browser.close().catch(()=>{});if(result.status==='FAIL')process.exitCode=1}
