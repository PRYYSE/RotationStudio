// Materialize a Court Mode review export as immutable GitHub Pages assets.
// Usage: node --experimental-strip-types scripts/create-court-review.mjs review.json id version
import { readFile, mkdir, writeFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCourtReview } from '../src/lib/courtReview.ts'
const [input,id,version]=process.argv.slice(2)
if(!input||![id,version].every(v=>v&&/^[a-zA-Z0-9_-]+$/.test(v))){console.error('Usage: node --experimental-strip-types scripts/create-court-review.mjs review.json id version\nID and version must use letters, numbers, underscores or hyphens.');process.exit(1)}
const review=parseCourtReview(JSON.parse(await readFile(input,'utf8')))
if(review.id!==id||review.version!==version)throw new Error('ID/version must match the immutable review export. Use the exact exported identifiers.')
const root=fileURLToPath(new URL('../public/',import.meta.url)),folder=resolve(root,'reviews',id,version)
try{await access(folder);throw new Error('This version already exists. Never overwrite an immutable review; export a new version.')}catch(e){if(e.code!=='ENOENT')throw e}
const json=JSON.stringify(review,null,2)+'\n',rationale=review.rationale
const hash=text=>createHash('sha256').update(text).digest('hex')
const manifest=JSON.stringify({schemaVersion:1,id,version,review:{file:'review.json',sha256:hash(json)},rationale:{file:'rationale.md',sha256:hash(rationale)}},null,2)+'\n'
await mkdir(folder,{recursive:true})
await writeFile(resolve(folder,'review.json'),json,{flag:'wx'})
await writeFile(resolve(folder,'rationale.md'),rationale,{flag:'wx'})
await writeFile(resolve(folder,'manifest.json'),manifest,{flag:'wx'})
console.log('Commit these assets and publish through the existing Pages workflow. Exact URL:')
console.log('https://pryyse.github.io/RotationStudio/?workspace=court&review=reviews/'+id+'/'+version+'/manifest.json&sha256='+hash(manifest))
