// Validate data-only review publications and prohibit changing old review IDs.
import { readFileSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { isDeepStrictEqual } from 'node:util'
import { reviewEntry, reviewPacket } from '../src/lib/courtMode.ts'
const read = path => readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const manifest=JSON.parse(read('public/reviews/manifest.json'))
if(manifest.schemaVersion!==1 || !manifest.reviews || Array.isArray(manifest.reviews))throw new Error('Invalid review manifest')
const base={team:JSON.parse(read('public/plans/team.json')),plans:JSON.parse(read('public/plans/rotations.json'))}
for(const id of Object.keys(manifest.reviews)) {
  const entry=reviewEntry(manifest,id)
  const raw=read(`public/reviews/${entry.data}`),packet=JSON.parse(raw)
  if(Buffer.byteLength(raw)>1_000_000 || createHash('sha256').update(raw).digest('hex')!==entry.sha256 || packet.version!==entry.version)throw new Error(`${id}: invalid size, hash or version`)
  if(statSync(new URL(`../public/reviews/${entry.plan}`,import.meta.url)).size>1_000_000)throw new Error('Oversized tactical plan')
  for(const scenario of packet.scenarios)reviewPacket(packet,base,id,entry.rotation,scenario.serve,'left','normal')
}
const previous=process.env.REVIEW_BASE_REF
if(previous && /^[0-9a-f]{40}$/.test(previous) && !/^0+$/.test(previous)) {
  const oldFile=path=>execFileSync('git',['show',`${previous}:visualizer/public/reviews/${path}`],{encoding:'utf8',maxBuffer:2_000_000})
  let old
  // The first Court Mode deployment has no previous review directory.
  try{old=JSON.parse(oldFile('manifest.json'))}catch(error){
    const exists=execFileSync('git',['ls-tree',previous,'visualizer/public/reviews/manifest.json'],{encoding:'utf8'})
    if(exists.trim())throw error
  }
  for(const [id,entry] of Object.entries(old?.reviews??{})) {
    if(!isDeepStrictEqual(manifest.reviews[id],entry))throw new Error(`${id}: published review IDs are immutable; add a new version ID`)
    if(oldFile(entry.plan)!==read(`public/reviews/${entry.plan}`))throw new Error(`${id}: published tactical plan is immutable`)
  }
}
console.log(`Validated ${Object.keys(manifest.reviews).length} immutable review entries`)
