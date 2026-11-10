import type { Bundle } from './rotationTypes.ts'
import { parseBundle } from './rotationValidation.ts'
import { applyStrategy, parseStrategy, type StrategyDraftV2 } from './strategyDraft.ts'
import { fingerprint } from './courtMode.ts'
export type ReviewContext = { rotation: number; serve: 'us'|'they'; opponentAttack: 'left'|'right'; firstTouch: 'normal'|'harry'; time: number }
export type CourtReview = { kind: 'court-review'; schemaVersion: 1; status: 'FOR REVIEW'; id: string; version: string; name: string; bundle: Bundle; strategy: StrategyDraftV2|null; context: ReviewContext; rationale: string }
const LIMIT = 3_000_000
export function parseCourtReview(value: unknown): CourtReview {
  const r = value as CourtReview
  if (!r || r.kind !== 'court-review' || r.schemaVersion !== 1 || r.status !== 'FOR REVIEW' ||
    ![r.id,r.version,r.name].every(v=>typeof v==='string' && v.length>0 && v.length<=160) || typeof r.rationale !== 'string' || r.rationale.length>100_000) throw new Error('Unsupported exact review file.')
  try { parseBundle(JSON.stringify(r.bundle)) } catch { throw new Error('Invalid review source bundle.') }
  if (r.strategy) { parseStrategy(JSON.stringify(r.strategy)); applyStrategy(r.bundle,r.strategy) }
  const c = r.context
  if (!c || !Number.isInteger(c.rotation) || c.rotation<1 || c.rotation>6 || !['us','they'].includes(c.serve) || !['left','right'].includes(c.opponentAttack) || !['normal','harry'].includes(c.firstTouch) || !Number.isFinite(c.time) || c.time<0) throw new Error('Invalid review context.')
  const root = r.bundle.plans.scenarios.find(s=>s.rotation===c.rotation && s.serve===c.serve)
  const key = c.firstTouch==='harry' ? c.opponentAttack==='right'?'harryRight':'harry' : c.opponentAttack==='right'?'right':null
  const scenario = key ? root?.alternates?.[key] : root
  if (!scenario || c.time>scenario.duration) throw new Error('Exact review context is unavailable in this source.')
  return structuredClone(r)
}
export function createCourtReview(bundle: Bundle, strategy: StrategyDraftV2|null, context: ReviewContext, rationale: string, id: string, version: string, name = 'Court review'): CourtReview {
  return parseCourtReview({kind:'court-review',schemaVersion:1,status:'FOR REVIEW',id,version,name,bundle,strategy,context,rationale})
}
export async function encodeCourtReview(review: CourtReview) {
  const json=JSON.stringify(parseCourtReview(review))
  if(json.length>LIMIT) throw new Error('Review is too large; export a review file instead.')
  const bytes=new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())
  let binary=''; for(const byte of bytes) binary+=String.fromCharCode(byte)
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')+'.'+await fingerprint(json)
}
export async function decodeCourtReview(encoded: string) {
  if(encoded.length>500_000) throw new Error('Exact review link is too large.')
  const [data, digest, extra]=encoded.split('.')
  if(extra || !/^[a-f0-9]{64}$/.test(digest ?? '')) throw new Error('Review integrity stamp is missing.')
  let json: string
  try {
    const bytes=Uint8Array.from(atob(data.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0))
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader()
    const chunks: Uint8Array[]=[]; let length=0
    while(true){ const {done,value}=await stream.read(); if(done)break; length+=value.length; if(length>LIMIT){await stream.cancel();throw new Error('Too large')} chunks.push(value) }
    json=await new Blob(chunks as BlobPart[]).text()
  } catch { throw new Error('Exact review is damaged or too large; source integrity could not be verified.') }
  if(await fingerprint(json)!==digest) throw new Error('Review integrity check failed.')
  return parseCourtReview(JSON.parse(json))
}
export async function loadStaticReview(path: string, digest: string, base: string, fetcher: typeof fetch=fetch) {
  if(!/^reviews\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\/manifest\.json$/.test(path)) throw new Error('Invalid exact review path.')
  if(!/^[a-f0-9]{64}$/.test(digest)) throw new Error('Exact review URL requires a manifest integrity stamp.')
  const read=async(url: URL,hash: string)=>{
    const response=await fetcher(url,{cache:'no-cache'})
    if(!response.ok) throw new Error(`Exact review asset unavailable (${response.status}).`)
    const text=await response.text()
    if(text.length>LIMIT || await fingerprint(text)!==hash) throw new Error('Review asset integrity check failed.')
    return text
  }
  const url=new URL(path,base), manifest=JSON.parse(await read(url,digest))
  if(manifest.schemaVersion!==1 || !manifest.review || !manifest.rationale) throw new Error('Unsupported review manifest.')
  const asset=(v:{file:string;sha256:string})=>{
    if(!/^[a-zA-Z0-9_-]+\.(json|md)$/.test(v.file) || !/^[a-f0-9]{64}$/.test(v.sha256))throw new Error('Invalid review asset path or integrity.')
    return read(new URL(v.file,url),v.sha256)
  }
  const [json,rationale]=await Promise.all([asset(manifest.review),asset(manifest.rationale)])
  const review=parseCourtReview(JSON.parse(json))
  if(review.rationale!==rationale || manifest.id!==review.id || manifest.version!==review.version)throw new Error('Review JSON and Markdown version do not match.')
  return review
}
