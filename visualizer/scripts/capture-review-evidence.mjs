import fs from "node:fs/promises";
import path from "node:path";
import {chromium} from "playwright";

const root=path.resolve("review-evidence");
await fs.mkdir(root,{recursive:true});
const base=process.env.REVIEW_URL||"http://127.0.0.1:4173/RotationStudio/";
const testedSha=process.env.GITHUB_SHA||"LOCAL_UNVERIFIED";
const viewports=[
  {name:"desktop-1440",width:1440,height:900},
  {name:"ultrawide-3440",width:3440,height:1440}
];
const report={
  schema:1,tool:"Playwright on GitHub runner",tested_sha:testedSha,url:base,
  evidence_type:"SCRIPTED_SOFTWARE_BROWSER_JOURNEY_NOT_HUMAN_UAT",
  gpu_3d_feel_verified:false,real_human_review:false,
  viewports:[],errors:[],tasks:[],missing_human_checks:[
    "Natural drag/route editing feel on a headed Windows GPU browser",
    "Unscripted first-time teammate and coach UX judgment",
    "Actual independent visual assessment of images",
    "Volleyball tactical realism and match/referee approval"
  ]
};
const browser=await chromium.launch({headless:true,args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader"]});
let failure=null;
try{
  for(const size of viewports){
    const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
    const page=await context.newPage();
    const screenshots=[];
    const actions=[];
    page.on("pageerror",err=>report.errors.push(size.name+": "+String(err.message)));
    const dir=path.join(root,size.name);
    await fs.mkdir(dir,{recursive:true});
    await context.tracing.start({screenshots:true,snapshots:true,sources:false});
    try{
      await page.goto(base,{waitUntil:"domcontentloaded",timeout:35000});
      await page.getByRole("main",{name:"Rotation studio"}).waitFor({timeout:30000});
      const court=page.locator('[aria-label="Interactive volleyball court"]');
      await court.waitFor({timeout:15000});
      const save=async name=>{
        await page.screenshot({path:path.join(dir,name+".png"),animations:"disabled"});
        screenshots.push(size.name+"/"+name+".png");
      };
      actions.push({step:"Load real RotationStudio and display court",result:"PASS"});
      await save("01-watch-initial");
      await page.getByRole("navigation",{name:"Rotation",exact:true}).getByRole("button",{name:"R3"}).click();
      await page.getByRole("button",{name:"They serve"}).click();
      actions.push({step:"Choose R3 with their serve",result:"PASS"});
      await save("02-r3-their-serve");
      const receive=page.getByRole("button",{name:/^Seek Receive$/});
      if(await receive.count()===1){
        await receive.click();
        actions.push({step:"Navigate directly to Receive phase",result:"PASS"});
        await save("03-receive-phase");
      }else actions.push({step:"Receive-phase button",result:"NOT_PRESENT_IN_CURRENT_SCENARIO"});
      await page.getByRole("navigation",{name:"Strategy mode"}).getByRole("button",{name:"Strategies"}).click();
      await page.getByRole("complementary",{name:"Strategy studio controls"}).waitFor();
      actions.push({step:"Open Strategies and inspect browser-local strategy interface",result:"PASS"});
      await save("04-strategies");
      await page.getByRole("navigation",{name:"Strategy mode"}).getByRole("button",{name:"Edit strategy"}).click();
      await page.locator("main.strategy-editing").waitFor({timeout:15000});
      actions.push({step:"Enter actual stage-first edit mode",result:"PASS"});
      await save("05-editor");
      await page.getByRole("navigation",{name:"Strategy mode"}).getByRole("button",{name:"View"}).click();
      await page.getByRole("button",{name:"Set arcs",exact:true}).click();
      await page.locator("canvas").first().waitFor({timeout:15000});
      actions.push({step:"Switch to original Set arcs view",result:"PASS"});
      await save("06-set-arcs-onboarding");
      const tutorialSkip=page.getByRole("button",{name:"Skip",exact:true});
      if(await tutorialSkip.count()===1 && await tutorialSkip.isVisible()){
        await tutorialSkip.click();
        actions.push({step:"Dismiss first-time original Set arcs tutorial via Skip",result:"PASS"});
        await save("07-set-arcs-after-tutorial");
      }
      await page.getByRole("button",{name:"Rotations",exact:true}).click();
      await page.getByRole("main",{name:"Rotation studio"}).waitFor();
      actions.push({step:"Return from Set arcs to RotationStudio",result:"PASS"});
      report.viewports.push({name:size.name,size,actions,screenshots,result:"PASS"});
      report.tasks.push("R3 their-serve watching","Receive phase when available","Strategy library opening","Enter editor","Set arcs switching");
    }catch(e){
      failure=String(e.message||e);
      report.errors.push(size.name+" failed: "+failure);
      await page.screenshot({path:path.join(dir,"failure.png")}).catch(()=>{});
      report.viewports.push({name:size.name,size,actions,screenshots,result:"FAIL",error:failure});
    }finally{
      await context.tracing.stop({path:path.join(dir,"trace.zip")}).catch(()=>{});
      await context.close();
    }
    if(failure)break;
  }
}finally{
  await browser.close();
  await fs.writeFile(path.join(root,"manifest.json"),JSON.stringify(report,null,2)+"\n");
}
if(report.errors.length||failure){
  console.error("RotationStudio browser smoke failed. See review-evidence/manifest.json");
  process.exitCode=1;
}else{
  console.log("RotationStudio scripted browser evidence captured. This is not independent visual UX acceptance.");
}
