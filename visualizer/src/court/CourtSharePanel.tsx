import { useState } from 'react'
import { activeBundle, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { createCourtReview, encodeCourtReview, type CourtReview } from '../lib/courtReview'
import { downloadCourtFile } from '../lib/courtMode'
export function CourtSharePanel({review,note}:{review:CourtReview|null;note:string}) {
  const s=useRotations(),working=useStrategies(v=>v.working),[rationale,setRationale]=useState(review?.rationale??note)
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  const snapshot=()=>{
    const strategy=review?review.strategy:working,source=review?.bundle??(working?s.published:activeBundle(s))
    if(!source)throw new Error('Source unavailable.')
    return createCourtReview(source,strategy,{rotation:s.rotation,serve:s.serve,opponentAttack:s.opponentAttack,firstTouch:s.firstTouch,time:s.time},rationale,review?.id??crypto.randomUUID(),review?.version??new Date().toISOString().replaceAll(':','-').replaceAll('.','-'),review?.name??working?.name??'Team V3 review')
  }
  return <>
    <div className="cm-provenance"><strong>{review?'FOR REVIEW':'Create an exact review'}</strong><p>{review?`${review.name} · ${review.version}`:'Share the actual source, strategy edits and selected moment, including browser-local changes.'}</p></div>
    <label className="cm-field">Markdown rationale<textarea aria-label="Review rationale" rows={8} maxLength={100_000} value={rationale} onChange={e=>setRationale(e.target.value)}/></label>
    <div className="cm-actions"><button disabled={busy} onClick={async()=>{
      setBusy(true)
      try{const encoded=await encodeCourtReview(snapshot());const url=new URL(location.href);url.search='?workspace=court';url.hash='court-review='+encoded
        if(url.href.length>100_000)throw new Error('This exact review is too large for a reliable link. Export the review file instead.')
        try{await navigator.clipboard.writeText(url.href);setMessage('Exact review link copied, including source, local edits and rationale.')}catch{setMessage(url.href)}
      }catch(e){setMessage(String(e))}finally{setBusy(false)}
    }}>Copy exact review link</button><button onClick={()=>{try{downloadCourtFile(JSON.stringify(snapshot(),null,2),'exact-court-review.json');setMessage('Exported immutable review snapshot. Open it in Court Mode on another device.')}catch(e){setMessage(String(e))}}}>Export review JSON</button></div>
    <p className="cm-muted">For review is separate from tactical approval. The link binds this exact source and rationale with SHA-256. It opens on this same application; it does not sync later changes.</p>
    {review&&<details><summary>Original immutable rationale</summary><pre className="cm-rationale">{review.rationale||'No rationale supplied.'}</pre></details>}
    {message&&<p className="cm-feedback" role="status">{message}</p>}
  </>
}
