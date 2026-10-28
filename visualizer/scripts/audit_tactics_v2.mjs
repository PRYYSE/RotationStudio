import fs from 'node:fs';
import {sampleTrack} from '../src/lib/rotationModel.ts';
import {validateBundle} from '../src/lib/rotationValidation.ts';
const team=JSON.parse(fs.readFileSync('../public/plans/team.json'));
const plan=JSON.parse(fs.readFileSync('../public/plans/rotations.json'));
const ids=team.players.map(p=>p.id);
let flags=0;
const errs=validateBundle({team,plans:plan});
console.log('FULL V2 SCHEMA (48 timelines)',errs.length,errs.slice(0,3));
flags+=errs.length;
for(const key of ['base','right','harry','harryRight']){
 const scenarios=plan.scenarios.map(s=>key==='base'?s:s.alternates[key]);
 for(const s of scenarios){
  let min=[100,'','',0], max=[0,'',0];
  for(let n=0;n<Math.floor(s.duration*17);n++){
   const t=n/17,pt=Object.fromEntries(ids.map(id=>[id,sampleTrack(s.tracks[id],t)]));
   for(let i=0;i<ids.length;i++){
    const a=ids[i],p=pt[a],q=sampleTrack(s.tracks[a],t+1/17),v=17*Math.hypot(p.x-q.x,p.z-q.z);
    if(v>max[0])max=[v,a,t];
    for(let j=i+1;j<ids.length;j++){const b=ids[j],o=pt[b],dist=Math.hypot(p.x-o.x,p.z-o.z);if(dist<min[0])min=[dist,a,b,t];}
   }
  }
  if(min[0]<.56||max[0]>4.0){flags++;console.log('FLAG',s.rotation,s.serve,key,'near',min.map(x=>typeof x==='number'?x.toFixed(2):x),'speed',max.map(x=>typeof x==='number'?x.toFixed(2):x));}
 }
}
console.log('TOTAL FLAGS',flags);if(flags)process.exitCode=1;
