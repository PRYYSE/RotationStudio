import { useEffect, useMemo, useRef, useState } from 'react'
import { RotationScene } from '../three/RotationScene'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { useStrategyState } from '../state/useStrategySimulation'
import { loadBundle } from '../lib/rotationValidation'
import { annotationScope, fingerprint } from '../lib/courtMode'
import { phaseAt } from '../lib/rotationModel'
import { parseCourtReview } from '../lib/courtReview'
import type { RotationView } from '../lib/rotationTypes'
import { useCourtLabelGestures } from './useCourtLabelGestures'
import { CourtIcon, type IconName } from './CourtIcon'
import { CourtCamera } from './CourtCamera'
import { CourtProjection, type Projection } from './CourtProjection'
import { CourtPlayback } from './CourtPlayback'
import { CourtSheet } from './CourtSheet'
import { CourtPlayerPanel } from './CourtPlayerPanel'
import { CourtStrategyPanel } from './CourtStrategyPanel'
import { CourtNotesPanel } from './CourtNotesPanel'
import { CourtSharePanel } from './CourtSharePanel'
import { CourtInk } from './CourtInk'
import { useCourtNotes, type InkTool } from './courtNotes'
import { useCourtReview } from './useCourtReview'
import './court.css'
type Sheet = 'strategy'|'players'|'notes'|'view'|'review'|null
export function CourtMode({onStudio}:{onStudio:()=>void}) {
  const s=useRotations(),studio=useStrategies(),bundle=activeBundle(s),scenario=activeScenario(s)
  const {warnings}=useStrategyState(),reviews=useCourtReview()
  const [sheet,setSheet]=useState<Sheet>(null),[focus,setFocus]=useState(false),[reset,setReset]=useState(0)
  const [tool,setTool]=useState<InkTool>('navigate'),[text,setText]=useState(''),[source,setSource]=useState(''),[message,setMessage]=useState('')
  const root=useRef<HTMLElement>(null),host=useRef<HTMLDivElement>(null),projection=useRef<Projection>({camera:null,width:1,height:1})
  useCourtLabelGestures(host,tool,!!bundle&&!!scenario&&!reviews.loading&&!reviews.error,id=>{useRotations.setState({selected:id});setSheet('players')})
  const sceneControls=useMemo(()=><><CourtCamera reset={reset} drawing={false}/><CourtProjection host={host} projection={projection}/></>,[reset])
  const phase=scenario?phaseAt(scenario,s.time):null
  const scope=annotationScope({source,strategy:reviews.review?.id??studio.working?.id??'published',rotation:s.rotation,serve:s.serve,attack:s.opponentAttack,touch:s.firstTouch,event:phase?`${phase.time}/${phase.label}`:'loading'})
  const notes=useCourtNotes(scope)
  const name=reviews.review?.name??studio.working?.name??(s.draft?'Advanced local draft':'Team V3')
  const status=reviews.review?'For review':studio.working?studio.preview?'Import preview':studio.saved?'Local draft':'Unsaved draft':s.draft?'Local draft':bundle?.plans.status==='APPROVED'?'Approved strategy':'Published example · draft'
  const load=()=>{useRotations.setState({loading:true,error:''});loadBundle(import.meta.env.BASE_URL).then(b=>useRotations.getState().setBundle(b)).catch(e=>useRotations.setState({loading:false,error:String(e.message)}))}
  useEffect(()=>{if(!useRotations.getState().published)load();return()=>{useRotations.getState().pause()}},[])
  useEffect(()=>{let alive=true;if(bundle)fingerprint(bundle).then(hash=>{if(alive)setSource(hash)});return()=>{alive=false}},[bundle])
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>useRotations.setState({reducedMotion:media.matches})
    change();media.addEventListener('change',change);return()=>media.removeEventListener('change',change)
  },[])
  useEffect(()=>{setTool('navigate')},[scope])
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&focus){setFocus(false);if(document.fullscreenElement)void document.exitFullscreen()}}
    const change=()=>{if(!document.fullscreenElement)setFocus(false)}
    window.addEventListener('keydown',key);document.addEventListener('fullscreenchange',change)
    return()=>{window.removeEventListener('keydown',key);document.removeEventListener('fullscreenchange',change)}
  },[focus])
  const toggleFocus=async()=>{
    if(focus){setFocus(false);if(document.fullscreenElement)await document.exitFullscreen();return}
    setSheet(null);setFocus(true)
    try{await root.current?.requestFullscreen()}catch{/* In-app immersive view still fills the visual viewport. */}
  }
  const switchStudio=()=>{
    if(reviews.review){setMessage('Return to your local strategy before editing in Full Studio. The exact review remains read-only.');return}
    s.pause();setTool('navigate');if(document.fullscreenElement)void document.exitFullscreen();onStudio()
  }
  if(reviews.error)return <main className="cm-app cm-error"><CourtIcon name="court"/><h1>Review unavailable</h1><p role="alert">{reviews.error}</p><p>The intended proposal could not be verified. No fallback strategy is shown.</p><button onClick={reviews.exit}>Return to my local strategy</button></main>
  if(!bundle||!scenario||reviews.loading)return <main className="cm-app cm-error"><CourtIcon name="court"/><h1>Court Mode</h1>{s.error?<><p role="alert">{s.error}</p><button onClick={load}>Retry source plans</button></>:<p role="status">{reviews.loading?'Verifying exact review…':'Preparing the court…'}</p>}</main>
  const action=(icon:IconName,label:string,onClick:()=>void,pressed?:boolean)=><button className="cm-icon-button" aria-label={label} title={label} aria-pressed={pressed} onClick={onClick}><CourtIcon name={icon}/></button>
  const titles={strategy:'Strategy & scenario',players:'Player instructions',notes:'Notes & drawings',view:'Court & camera',review:'Exact proposal review'}
  return <main ref={root} className={`cm-app ${focus?'cm-focus':''} ${sheet?'cm-panel-open':''}`} aria-label="Court Mode">
    <header className="cm-header"><div className="cm-brand"><CourtIcon name="court"/><span>Court Mode</span></div>
      <button className="cm-strategy-trigger" aria-label={`Open strategy chooser: ${name}`} onClick={()=>setSheet(sheet==='strategy'?null:'strategy')}><span><strong>{name}</strong><small>{status}</small></span><CourtIcon name="chevron"/></button>
      {action('studio','Open Full Studio',switchStudio)}
    </header>
    <div className="cm-court" ref={host} data-tool={tool}>
      <RotationScene courtMode>{sceneControls}</RotationScene>
      <div className="cm-identities" aria-label="Athletes on court">{bundle.team.players.map(p=><button key={p.id} data-cm-player={p.id} hidden aria-label={`Focus ${p.name}`} style={{borderColor:p.color}} onClick={()=>{useRotations.setState({selected:p.id});setSheet('players')}} />)}</div>
      <CourtInk host={host} projection={projection} tool={tool} notes={notes} text={text}/>
      <button className="cm-scenario" aria-label="Choose rotation, serving team and case" onClick={()=>setSheet('strategy')}><strong>R{s.rotation}</strong><span>{s.serve==='they'?'They serve':'We serve'}</span><CourtIcon name="chevron"/></button>
      <div className="cm-court-actions">{action('view','Choose court view',()=>setSheet(sheet==='view'?null:'view'))}{action('reset','Reset current view',()=>setReset(n=>n+1))}{action(focus?'close':'focus',focus?'Exit focus mode':'Enter focus mode',()=>{void toggleFocus()},focus)}</div>
      <div className="cm-court-caption"><span>{s.view==='orbit'?'3D orbit':`${s.view[0].toUpperCase()+s.view.slice(1)} view`} <i/> {s.opponentAttack==='left'?'Left attack':'Right attack'}{s.firstTouch==='harry'?' · Harry first':''}</span><small>{tool==='navigate'?'Drag to orbit · pinch & pan with two fingers':`${tool==='pen'?'Draw':tool} · two fingers navigate`}</small></div>
      {tool!=='navigate'&&<div className="cm-ink-bar"><span>{tool==='pen'?'Drawing':tool==='text'?'Tap to place text':tool==='arrow'?'Draw an arrow':tool==='erase'?'Tap a mark to erase':'Highlighting'}</span>{action('undo','Undo mark',notes.undo)}{action('redo','Redo mark',notes.redo)}<button onClick={()=>setTool('navigate')}>Done</button></div>}
      {reviews.review&&<button className="cm-review-badge" onClick={()=>setSheet('review')}>For review · {reviews.review.version}</button>}
    </div>
    <CourtPlayback/>
    <nav className="cm-navigation" aria-label="Coaching tools">{([['strategy','court','Strategy'],['players','team','Players'],['notes','pen','Annotate'],['review','share','Review']] as [Sheet,IconName,string][]).map(([id,icon,label])=><button key={id} aria-pressed={sheet===id} onClick={()=>{s.pause();setSheet(sheet===id?null:id)}}><CourtIcon name={icon}/><span>{label}</span>{id==='notes'&&notes.doc.marks.length>0&&<i/>}</button>)}</nav>
    {sheet&&<CourtSheet title={titles[sheet]} onClose={()=>setSheet(null)}>
      {sheet==='strategy'&&<CourtStrategyPanel onStudio={switchStudio} review={reviews.review} onExitReview={reviews.exit} onImportReview={json=>reviews.open(parseCourtReview(JSON.parse(json)))}/>}
      {sheet==='players'&&<CourtPlayerPanel/>}
      {sheet==='notes'&&<CourtNotesPanel notes={notes} tool={tool} onTool={setTool} text={text} onText={setText} onDraw={()=>{if(tool==='navigate')setTool('pen');s.pause();setSheet(null)}} onShare={()=>setSheet('review')}/>}
      {sheet==='review'&&<CourtSharePanel key={reviews.review?.id??'local'} review={reviews.review} note={notes.doc.note}/>}
      {sheet==='view'&&<><h3>View the court</h3><div className="cm-view-grid">{(['orbit','top','front','side'] as RotationView[]).map(view=><button key={view} aria-pressed={s.view===view} onClick={()=>{useRotations.setState({view});setReset(n=>n+1)}}><CourtIcon name="court"/>{view==='orbit'?'3D orbit':view[0].toUpperCase()+view.slice(1)}</button>)}</div><button className="cm-wide" onClick={()=>setReset(n=>n+1)}>Reset current view</button><h3>Show on court</h3>{([['labels','Player names'],['trails','Movement routes'],['receiveAreas','Coverage areas'],['ballFlight','Ball flight'],['setterTargetVisible','Pass target']] as const).map(([key,label])=><label className="cm-toggle" key={key}><span>{label}</span><input type="checkbox" checked={s[key]} onChange={e=>useRotations.setState({[key]:e.target.checked})}/></label>)}<p className="cm-muted">Drag to orbit in any view. Pinch to zoom; two fingers pan horizontally along the court. Reset restores ideal framing for the current screen.</p></>}
      {(sheet==='strategy'||sheet==='review')&&<details className="cm-source"><summary>Source &amp; local status</summary><p>{name} · {status}</p><p>Strategy base: {reviews.review?.strategy?.baseRevision??studio.working?.baseRevision??'Published source'}</p><p>Displayed source SHA-256: {source}</p><p>Local notes and saved plans are not synced.</p></details>}
    </CourtSheet>}
    {(message||warnings.some(w=>w.startsWith('Event edits were not applied:')))&&<div className="cm-toast" role="status"><span>{message||warnings.filter(w=>w.startsWith('Event edits were not applied:')).join(' ')}</span><button aria-label="Dismiss message" onClick={()=>setMessage('')}><CourtIcon name="close"/></button></div>}
  </main>
}
