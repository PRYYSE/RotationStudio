// Copy only explicit, independently observed QA artefacts into version-controlled evidence.
// Never stage or clean the untracked .cache, which may contain unrelated valuable receipts.
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {execFileSync, spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..')
const cache=path.join(root,'.cache','browser-qa')
const target=path.join(root,'visualizer','docs','v5-uat-evidence')
await fs.mkdir(target,{recursive:true})
const files=[
 ['V5-UAT-unit.log','unit-initial.log'],
 ['V5-UAT-build.log','build-initial.log'],
 ['V5-UAT-remediation-tests.log','unit-final.log'],
 ['V5-UAT-remediation-build.log','build-final.log'],
 ['V5-UAT-S05-browser-receipt.json','s05-report.json'],
 ['v5-uat-matrix/report.json','matrix-report.json'],
 ['v5-uat-editor/report.json','editor-report.json'],
 ['v5-uat-mobile-remediation/report.json','mobile-after-report.json'],
 ['V5-S07C-browser-result.json','shuffle-report.json'],
 ['v5-uat-matrix/desktop-open.png','matrix-desktop-open.png'],
 ['v5-uat-matrix/viewport-390x844.png','matrix-before-phone-390.png'],
 ['v5-uat-matrix/viewport-844x390.png','matrix-before-landscape-844.png'],
 ['v5-uat-editor/editor-844x390.png','editor-before-landscape-844.png'],
 ['v5-uat-editor/editor-390x844.png','editor-phone-390.png'],
 ['v5-uat-editor/desktop-editor-all-events.png','editor-all-events.png'],
 ['v5-uat-mobile-remediation/viewer-390x844.png','mobile-after-phone-390.png'],
 ['v5-uat-mobile-remediation/viewer-375x812.png','mobile-after-phone-375.png'],
 ['v5-uat-mobile-remediation/viewer-844x390.png','mobile-after-landscape-844.png'],
 ['v5-uat-mobile-remediation/viewer-1440x900.png','mobile-after-desktop-1440.png'],
 ['v5-uat-mobile-remediation/editor-landscape-844x390.png','editor-after-landscape-844.png'],
 ['V5-S05-reference-390.png','reference-phone-390.png'],
 ['V5-S05-reference-1440.png','reference-desktop-1440.png'],
 ['V5-S05-reference-844.png','reference-landscape-844.png'],
 ['V5-S07C-desktop-next.png','shuffle-desktop.png'],
 ['V5-S07C-390x844.png','shuffle-phone-390.png'],
 ['V5-S07C-844x390.png','shuffle-landscape-844.png'],
 ['V5-S07C-set-arcs.png','set-arcs.png']
]
for(const r of [1,2,3,4,5,6])for(const serve of ['they','us'])files.push(['v5-uat-matrix/r'+r+'-'+serve+'.png','matrix-r'+r+'-'+serve+'.png'])
for(const [from,to] of files){await fs.copyFile(path.join(cache,from),path.join(target,to));console.log('SAVED',to)}
const protectedPaths=['visualizer/public/plans/team.json','visualizer/public/plans/rotations.json','visualizer/scripts/author_tactics_v2.py']
const sha=b=>createHash('sha256').update(b).digest('hex')
const checks=[]
for(const rel of protectedPaths){
 const worktreeBytes=await fs.readFile(path.join(root,rel))
 const main=execFileSync('git',['show','main:'+rel],{cwd:root,maxBuffer:10_000_000})
 const head=execFileSync('git',['show','HEAD:'+rel],{cwd:root,maxBuffer:10_000_000})
 const worktreeClean=spawnSync('git',['diff','--quiet','--',rel],{cwd:root}).status===0
 // Windows checkout line endings may differ from canonical Git blob bytes.
 const same=head.equals(main)&&worktreeClean
 checks.push({path:rel,canonicalSha256:sha(head),publicMainSha256:sha(main),worktreeRawSha256:sha(worktreeBytes),worktreeClean,unchanged:same})
 if(!same)throw Error('PROTECTED SOURCE MISMATCH '+rel)
}
await fs.writeFile(path.join(target,'protected-source-sha256.json'),JSON.stringify({comparedTo:'public main, a8b6698',checks},null,2)+'\n')
console.log('EVIDENCE copied '+files.length+' and protected hashes match public main')
