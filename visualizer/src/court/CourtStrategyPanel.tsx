import { useRef, useState } from 'react'

const TEAM_PRESET_ID = 'pryyse-team-tactics-2026-v1'
const TEAM_PRESET_FILE = 'strategies/pryyse-team-tactics-2026-v1.json'

import { useStrategies } from '../state/strategyStore'
import { activeBundle, useRotations } from '../state/rotationStore'
import { downloadCourtFile } from '../lib/courtMode'
import { exportBundle } from '../lib/rotationValidation'
import { exportStrategy, MAX_STRATEGY_BYTES } from '../lib/strategyDraft'
import type { CourtReview } from '../lib/courtReview'
export function CourtStrategyPanel({onStudio,review,onExitReview,onImportReview}:{onStudio:()=>void;review:CourtReview|null;onExitReview:()=>void;onImportReview:(json:string)=>void}) {
  const s=useRotations(),studio=useStrategies(),file=useRef<HTMLInputElement>(null),[message,setMessage]=useState('')
  const working=studio.working,bundle=activeBundle(s)!,[exported,setExported]=useState(false)
  const protect=()=>{
    if(working&&!studio.saved){studio.save();if(!useStrategies.getState().saved){setMessage('Export this strategy before switching; local saving is unavailable.');return false}}
    if(!working&&s.draft&&!exported){setMessage('Export the advanced local draft below before selecting another strategy.');return false}
    return true
  }
  const choose=async(id:string)=>{
    if(!protect())return
    if(id===TEAM_PRESET_ID){
      try{
        const url=new URL(import.meta.env.BASE_URL+TEAM_PRESET_FILE,location.origin)
        const response=await fetch(url,{cache:'no-cache'})
        if(!response.ok)throw new Error('Published team strategy unavailable ('+response.status+').')
        const json=await response.text()
        if(json.length>MAX_STRATEGY_BYTES)throw new Error('Published team strategy exceeds the import limit.')
        studio.previewImport(json,s.published??undefined)
        const applied=useStrategies.getState()
        if(applied.error||applied.working?.id!==TEAM_PRESET_ID)throw new Error(applied.error||'Published team strategy is invalid.')
        setMessage('Published R1 proposal loaded. Your saved strategies are unchanged. Save a local copy if you want to edit it.')
      }catch(e){setMessage(e instanceof Error?e.message:'Could not load the published team strategy.')}
    } else {
      studio.select(id||null)
      if(!id)useRotations.setState({draft:null})
      setMessage('')
    }
    const url=new URL(location.href);if(url.hash.startsWith('#strategy=')){url.hash='';history.replaceState(null,'',url)}
    setExported(false)
  }
  const root=bundle.plans.scenarios.find(p=>p.rotation===s.rotation&&p.serve===s.serve)
  return <>
    {review?<div className="cm-provenance"><strong>For review · {review.version}</strong><p>{review.name}</p><p>This exact source is read-only. Your local strategy and drafts are retained.</p><button onClick={onExitReview}>Return to my strategy</button></div>:<>
      <label className="cm-field">Active strategy<select aria-label="Choose actual strategy" value={working?.id??''} onChange={e=>{void choose(e.target.value)}}>
        <option value="">Team V3 · published example</option>
        <option value={TEAM_PRESET_ID}>PRYYSE team · R1 both serves (published proposal)</option>
        {working&&!studio.library.some(d=>d.id===working.id)&&working.id!==TEAM_PRESET_ID&&<option value={working.id}>{working.name} · {studio.preview?'import preview':'unsaved'}</option>}
        {studio.library.map(d=><option key={d.id} value={d.id}>{d.name} · {d.author}</option>)}
      </select></label>
      <p className="cm-muted">{working?.id===TEAM_PRESET_ID&&studio.preview?'Published R1 tactics · for your review · R2–R6 are not yet authored':working?`${working.author} · ${studio.preview?'Imported preview':studio.saved?'Saved locally':'Unsaved draft'} · Needs review`:'Published DRAFT examples · not match-approved'}</p>
      {working?.id===TEAM_PRESET_ID&&studio.preview&&<p className="cm-muted"><a href={import.meta.env.BASE_URL+'strategies/r1-tactical-rationale-v1.md'} target="_blank" rel="noreferrer">Read the R1 player decisions and full-rally notes</a></p>}
      <div className="cm-actions"><button onClick={()=>file.current?.click()}>Open strategy / review</button>{working&&<button onClick={()=>{studio.save();setMessage(useStrategies.getState().saved?'Saved a local copy.':useStrategies.getState().error)}}>{studio.preview?'Save a local copy':'Save strategy'}</button>}</div>
      <div className="cm-actions"><button onClick={()=>{
        downloadCourtFile(working?exportStrategy(working):exportBundle(bundle),working?'strategy.json':'rotation-plan.json');setExported(true)
      }}>Export current plan</button><button onClick={onStudio}>Edit in Full Studio</button></div>
      <p className="cm-muted">Local strategies stay in this browser. Import a JSON file on another device; there is no cross-device sync.</p>
    </>}
    <h3>Rotation &amp; serve</h3>
    <div className="cm-segments" role="group" aria-label="Choose rotation">{[1,2,3,4,5,6].map(r=><button key={r} disabled={working?.id===TEAM_PRESET_ID&&studio.preview&&!Object.keys(working.caseOverrides??{}).some(k=>k.startsWith(r+'/'))} title={working?.id===TEAM_PRESET_ID&&studio.preview&&!Object.keys(working.caseOverrides??{}).some(k=>k.startsWith(r+'/'))?'Not yet authored in this proposal':undefined} aria-pressed={r===s.rotation} onClick={()=>s.choose(r,s.serve)}>R{r}</button>)}</div>
    <div className="cm-segments" role="group" aria-label="Serving team"><button aria-pressed={s.serve==='they'} onClick={()=>s.choose(s.rotation,'they')}>They serve</button><button aria-pressed={s.serve==='us'} onClick={()=>s.choose(s.rotation,'us')}>We serve</button></div>
    {root?.alternates&&<><h3>Authored case</h3>
      <div className="cm-segments" role="group" aria-label="Attack side"><button aria-pressed={s.opponentAttack==='left'} onClick={()=>s.chooseTactics('left',s.firstTouch)}>Attack at our left</button><button aria-pressed={s.opponentAttack==='right'} onClick={()=>s.chooseTactics('right',s.firstTouch)}>Attack at our right</button></div>
      <div className="cm-segments" role="group" aria-label="First contact"><button aria-pressed={s.firstTouch==='normal'} onClick={()=>s.chooseTactics(s.opponentAttack,'normal')}>Normal first contact</button><button aria-pressed={s.firstTouch==='harry'} onClick={()=>s.chooseTactics(s.opponentAttack,'harry')}>Harry first</button></div></>}
    <p className="cm-muted">Only authored branches are offered. No middle-attack or alternate-receiver case is generated.</p>
    <button className="cm-wide" onClick={onStudio}>Open Full Studio</button>
    <input ref={file} type="file" hidden accept=".json,application/json" aria-label="Open Court strategy or exact review" onChange={async e=>{
      const f=e.target.files?.[0];e.target.value='';if(!f)return
      if(f.size>3_000_000){setMessage('This file is too large.');return}
      try{
        const json=await f.text(),data=JSON.parse(json)
        if(data.kind==='court-review'){onImportReview(json);return}
        if(!protect())return
        if(f.size>MAX_STRATEGY_BYTES)throw new Error('Strategy files must be at most 1 MB.')
        if(data.team&&data.plans){s.importDraft(data);if(useRotations.getState().error)throw new Error(useRotations.getState().error);studio.select(null)}
        else {studio.previewImport(json,s.published??undefined);if(useStrategies.getState().error)throw new Error(useStrategies.getState().error)}
        setMessage('Opened safely as a local preview. Source files have not been changed.')
      }catch(e){setMessage(e instanceof Error?e.message:'Could not read this file.')}
    }} />
    {(message||studio.error)&&<p className="cm-feedback" role="status">{message||studio.error}</p>}
  </>
}
