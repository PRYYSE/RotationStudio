import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {pathToFileURL} from 'node:url'
const root='D:/Projects/RotationStudio-V4'
const cache=root+'/.cache/browser-qa'
const dir=cache+'/v5-uat-editor'
await fs.mkdir(dir,{recursive:true})
const {default:puppeteer}=await import(pathToFileURL(cache+'/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js').href)
const record={status:'FAIL',checks:[],screenshots:[],errors:[],failures:[],storageBefore:null,storageAfter:null}
const pause=ms=>new Promise(r=>setTimeout(r,ms))
let browser,page
const mark=(label,details)=>{record.checks.push({label,details});console.log('PASS',label,JSON.stringify(details||{}).slice(0,350))}
const shot=async label=>{await page.screenshot({path:dir+'/'+label+'.png'});record.screenshots.push(label+'.png')}
const click=async label=>{for(const b of await page.$$('button'))if(await b.evaluate((el,x)=>el.textContent.trim()===x,label)){await b.evaluate(e=>e.scrollIntoView({block:'nearest'}));await b.click();await pause(90);return}throw Error('Missing button: '+label)}
const coordinate=()=>page.$eval('[aria-label="X metres"]',e=>Number(e.value))
const editX=async x=>{
 await page.click('[aria-label="X metres"]',{clickCount:3});await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');
 await page.keyboard.type(String(x));await page.keyboard.press('Tab');await pause(220)
}
const shift=(value,amount)=>Math.round(Math.max(-4.4,Math.min(4.4,value+amount))*100)/100
const storage=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))
try{
 browser=await puppeteer.launch({executablePath:'D:/Tools/Thorium-QA/156.0.8078.28/BIN/thorium.exe',headless:true,userDataDir:cache+'/v5-uat-editor-isolated-'+Date.now(),protocolTimeout:30000,args:['--no-first-run','--no-proxy-server','--disable-background-networking']})
 page=await browser.newPage();page.setDefaultTimeout(18000);await page.setViewport({width:1440,height:900})
 page.on('pageerror',e=>record.errors.push(e.message))
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])
 await page.evaluateOnNewDocument(()=>localStorage.setItem('UAT_SENTINEL','PRESERVED'))
 await page.goto('http://127.0.0.1:5205/RotationStudio/?mode=rotations&r=1&serve=us&attack=right&first=normal',{waitUntil:'domcontentloaded'})
 await page.waitForSelector('[aria-label="Shuffle source"]')
 record.storageBefore=await storage()
 await click('Edit strategy')
 await page.waitForSelector('[aria-label="Court strategy editor"]')
 assert.equal(await page.$('[aria-label="Scrub rotations"]'),null)
 await click('Customise this case')
 assert.match(await page.$eval('[aria-label="Current edit scope"]',e=>e.textContent),/This exact case/)
 await page.select('[aria-label="Selected athlete"]','caleb');await pause(100)
 const start=await coordinate(),target=shift(start,.14)
 assert.notEqual(target,start)
 await editX(target)
 assert.ok(Math.abs((await coordinate())-target)<.005,'X not updated')
 await click('Undo');await pause(600);const afterUndo=await coordinate();console.log('EDITOR_UNDO_DIAGNOSTIC',JSON.stringify({start,target,afterUndo}));assert.ok(Math.abs(afterUndo-start)<.005,'Undo didnt restore '+JSON.stringify({start,target,afterUndo}))
 await click('Redo');assert.ok(Math.abs((await coordinate())-target)<.005,'Redo didnt restore')
 mark('Exact case coordinate edit / undo / redo',{start,target})
 await page.$eval('.coverage-editor',e=>e.open=true)
 await page.select('[aria-label="Coverage role"]','deep');await pause(160)
 const width=await page.$eval('[aria-label="Coverage width metres"]',e=>Number(e.value))
 const newWidth=Math.min(8.8,Math.round((width+.2)*100)/100)
 await page.click('[aria-label="Coverage width metres"]',{clickCount:3});await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');
 await page.keyboard.type(String(newWidth));await page.keyboard.press('Tab');await pause(250)
 const actual=await page.$eval('[aria-label="Coverage width metres"]',e=>Number(e.value))
 assert.ok(Math.abs(actual-newWidth)<.01,'Coverage width failed '+actual+' '+newWidth)
 mark('Case-specific role/depth coverage fields',{width,newWidth})
 await page.$eval('.event-navigator',e=>e.open=true)
 const ids=await page.$$eval('[aria-label="All source events"] button[data-event-id]',es=>es.map(e=>e.dataset.eventId))
 const first=ids.find(v=>v.startsWith('p3:our-dig')),second=ids.find(v=>v.startsWith('p8:next-dig'))
 assert.ok(first&&second,JSON.stringify(ids))
 await page.click('[data-event-id="'+first+'"]');await pause(170)
 assert.match(await page.$eval('[aria-label="Source event facts"]',e=>e.textContent),/our-dig/)
 const a=await coordinate(),aa=shift(a,.06);await editX(aa);assert.ok(Math.abs((await coordinate())-aa)<.005)
 await page.click('[data-event-id="'+second+'"]');await pause(170)
 assert.match(await page.$eval('[aria-label="Source event facts"]',e=>e.textContent),/next-dig/)
 const b=await coordinate(),bb=shift(b,-.06);await editX(bb);assert.ok(Math.abs((await coordinate())-bb)<.005)
 await click('Save')
 record.storageAfter=await storage()
 const v2=JSON.parse(record.storageAfter['rotation-studio-strategies-v2'])
 assert.ok(v2?.library?.length===1)
 const active=v2.library.find(v=>v.id===v2.activeId)
 const exact=active.caseOverrides?.['1/us/right/normal'];assert.ok(exact,JSON.stringify(Object.keys(active.caseOverrides||{})))
 const keys=Object.keys(exact.eventOverrides||{})
 assert.ok(keys.includes(first)&&keys.includes(second),'One of the two dig edits lost '+JSON.stringify(keys))
 assert.ok(!active.caseOverrides?.['1/us/left/normal'],'Unrelated case modified')
 assert.equal(record.storageAfter.UAT_SENTINEL,'PRESERVED')
 mark('Two independent real R1 Us-serve dig event edits saved; other case untouched',{first,second,keys})
 await shot('desktop-editor-all-events')
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('[aria-label="Shuffle source"]')
 assert.equal((await storage())['rotation-studio-strategies-v2'],record.storageAfter['rotation-studio-strategies-v2'])
 mark('Exact saved strategy persists byte-equivalent after reload',v2.activeId)
 await click('Edit strategy')
 await page.select('[aria-label="Selected athlete"]','caleb');await pause(120)
 await page.select('[aria-label="Editor attack side"]','left')
 await pause(120)
 await page.$eval('.event-navigator',e=>e.open=true)
 await page.click('[data-event-id="'+first+'"]');await pause(140)
 const xleft=await coordinate()
 await page.select('[aria-label="Editor attack side"]','right');await pause(140)
 const xright=await coordinate()
 assert.ok(Math.abs(xleft-xright)>.025,'Exact event edit leaked across cases '+JSON.stringify({xleft,xright}))
 mark('GUI inherited versus exact event case isolation',{xleft,xright})
 for(const [w,h] of [[390,844],[375,812],[844,390]]){
   await page.setViewport({width:w,height:h});await pause(220)
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
   assert.ok(overflow<=1,'Editor overflows at '+w+'px by '+overflow+'px')
   await shot('editor-'+w+'x'+h)
 }
 mark('Editor real mobile/short landscape responsive with no horizontal overflow',3)
 record.status=record.failures.length?'FAIL':'PASS'
}catch(e){record.failures.push(e.stack||String(e));console.error('FAILED',e.stack||e);if(page)await shot('failure').catch(()=>{})}
finally{record.status=record.failures.length?'FAIL':record.status;await fs.writeFile(dir+'/report.json',JSON.stringify(record,null,2));if(browser)await browser.close().catch(()=>{});console.log('FINAL',record.status,'checks',record.checks.length,'screens',record.screenshots.length);process.exitCode=record.status==='PASS'?0:1}
