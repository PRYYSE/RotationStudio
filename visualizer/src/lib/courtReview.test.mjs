import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStrategy } from './strategyDraft.ts'
import { readFileSync } from 'node:fs'
import { createCourtReview, parseCourtReview, encodeCourtReview, decodeCourtReview, loadStaticReview } from './courtReview.ts'
const root = new URL('../../public/plans/', import.meta.url)
const bundle={team:JSON.parse(readFileSync(new URL('team.json',root))),plans:JSON.parse(readFileSync(new URL('rotations.json',root)))}
const context={rotation:2,serve:'us',opponentAttack:'right',firstTouch:'harry',time:8.2}
test('exact review roundtrips source, context and rationale independently of recipient drafts',async()=>{
 const review=createCourtReview(bundle,null,context,'Review the authored sequence.','baseline-test','v1')
 const encoded=await encodeCourtReview(review)
 const decoded=await decodeCourtReview(encoded)
 assert.deepEqual(decoded,review)
 assert.equal(decoded.context.time,8.2)
 assert.equal(decoded.status,'FOR REVIEW')
 assert.notEqual(decoded.bundle,bundle)
 await assert.rejects(decodeCourtReview(encoded.slice(0,-1)+(encoded.endsWith('0')?'1':'0')),/integrity/i)
})
test('invalid case or source is rejected, never replaced by published tactics',()=>{
 const review=createCourtReview(bundle,null,context,'Rationale','test','v1')
 assert.throws(()=>parseCourtReview({...review,context:{...context,rotation:9}}),/context/i)
 assert.throws(()=>parseCourtReview({...review,bundle:{}}),/source/i)
})
test('static reviews bind manifest JSON and Markdown bytes and fail closed',async()=>{
 const review=createCourtReview(bundle,null,context,'Rationale','test','v1')
 await assert.rejects(loadStaticReview('reviews/test/v1/manifest.json','0'.repeat(64),'https://example.test/RotationStudio/',async()=>new Response('{}')),/integrity/i)
 await assert.rejects(loadStaticReview('https://elsewhere.test/x','0'.repeat(64),'https://example.test/RotationStudio/'),/path/i)
 assert.equal(review.version,'v1')
})

test('exact review accepts real sparse strategies with informational coaching cautions', async()=>{
 const strategy=createStrategy('Local proposal','Coach')
 strategy.overrides['2/us']={coverage:{Defend:{harry:{role:'deep',radiusX:2,radiusZ:2}}}}
 const review=createCourtReview(bundle,strategy,context,'Review this proposal.','local-test','v1')
 const decoded=await decodeCourtReview(await encodeCourtReview(review))
 assert.deepEqual(decoded.strategy,strategy)
})
