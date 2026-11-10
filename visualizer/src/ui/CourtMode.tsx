import type { ReviewProjection } from '../lib/reviewTypes'
import { useEffect, useRef, useState } from 'react'
import { RotationScene } from '../three/RotationScene'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { useCourt } from '../state/courtStore'
import { phaseAt, selectScenario } from '../lib/rotationModel'
import { playerFocusStory } from '../lib/playerFocusStory'
import type { RotationView } from '../lib/rotationTypes'
import { CourtDock } from './CourtDock'
import { CourtNotes, DrawingTools, exportCourtNotes } from './CourtNotes'
import { courtLink } from './useCourtRoute'
import { courtScope } from '../lib/courtContext'
import { WorkspaceSwitch } from './WorkspaceSwitch'
export function CourtMode({onSets,review}:{onSets:()=>void;review:ReviewProjection|null}) {
  const s=useRotations(),c=useCourt(),bundle=activeBundle(s)!,scenario=activeScenario(s)!
  const host=useRef<HTMLDivElement>(null),root=useRef<HTMLElement>(null)
  const [sheet,setSheet]=useState(''),[message,setMessage]=useState('')
  const phase=phaseAt(scenario,s.time),name=bundle.team.players.find(p=>p.id===s.selected)?.name
  const previousPlayer=useRef(s.selected)
  useEffect(()=>{if(s.selected!==previousPlayer.current && s.selected){setSheet('Player');useCourt.setState({immersive:false})}previousPlayer.current=s.selected},[s.selected])
  useEffect(()=>{
    const fullscreen=()=>{if(!document.fullscreenElement)useCourt.setState({immersive:false})}
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setSheet('');useCourt.setState({immersive:false,annotate:false});if(document.fullscreenElement)void document.exitFullscreen()}}
    document.addEventListener('fullscreenchange',fullscreen);window.addEventListener('keydown',key)
    return()=>{document.removeEventListener('fullscreenchange',fullscreen);window.removeEventListener('keydown',key)}
  },[])
  async function fullscreen(){
    if(c.immersive){useCourt.setState({immersive:false});if(document.fullscreenElement)await document.exitFullscreen();return}
    setSheet('');useCourt.setState({immersive:true,annotate:false})
    try{await root.current?.requestFullscreen?.()}catch{/* Viewport focus remains available if native fullscreen is denied. */}
  }
  const source=bundle.plans.scenarios.find(p=>p.rotation===s.rotation&&p.serve===s.serve)!
  const other=source.alternates?selectScenario(source,s.opponentAttack,s.firstTouch==='harry'?'normal':'harry'):null
  const story=playerFocusStory(bundle.team,scenario,s.time,name?s.selected:null,review && Math.abs(review.eventTime-s.time)<.005?review.notes.player:null,review && Math.abs(review.eventTime-s.time)<.005?review.notes.team:null,other)
  const marks=c.marks.filter(n=>n.scope===courtScope()),visible=marks.filter(n=>n.whole||Math.abs(n.time-s.time)<.045)
  const provenance=c.reviewId?`${c.reviewEntry?.version} · FOR REVIEW · Not match-approved`:s.draft&&!s.publishedOnly?'Local strategy · not included in view links':s.example?'Teaching example · unapproved':`Published example · ${bundle.plans.status}`
  const camera=(view:RotationView)=>{useCourt.setState({freeOrbit:false});if(s.view===view)useCourt.setState({reset:c.reset+1});else useRotations.setState({view})}
  return <main ref={root} className={`court-workspace ${c.immersive?'is-immersive':''} ${c.annotate?'is-drawing':''}`} aria-label="Court Mode">
    {!c.immersive&&<header className="court-header"><div className="court-identity"><strong>Court Mode</strong><small>{c.reviewId?c.reviewEntry?.version:'RotationStudio'}</small></div><WorkspaceSwitch/></header>}
    {!c.immersive&&<div className="court-selection">
      <select aria-label="Rotation" value={s.rotation} onChange={e=>s.choose(Number(e.target.value),s.serve)}>{[1,2,3,4,5,6].map(r=><option key={r} value={r} disabled={!!c.reviewId && r!==c.reviewEntry?.rotation}>R{r}</option>)}</select>
      <select aria-label="Serve owner" value={s.serve} onChange={e=>s.choose(s.rotation,e.target.value as 'us'|'they')}><option value="they" disabled={!!c.reviewId&&!c.reviewServes.includes('they')}>They serve</option><option value="us" disabled={!!c.reviewId&&!c.reviewServes.includes('us')}>Us serve</option></select>
      <button aria-expanded={sheet==='Case'} onClick={()=>setSheet(sheet==='Case'?'':'Case')}>Case ▾</button>
      <button className="court-fullscreen" onClick={fullscreen}>Fullscreen</button>
    </div>}
    <div className="court-stage" aria-label="Interactive coaching court">
      <RotationScene labelHost={host} court/>
      <div ref={host} className="court-labels" aria-label="Court identities"><svg aria-hidden="true">{bundle.team.players.map(p=><line key={p.id} data-leader={p.id} stroke={p.color}/>)}</svg>{bundle.team.players.map(p=><span key={p.id} hidden data-player={p.id} className="athlete-label" style={{borderColor:p.color}}/>)}</div>
      {!c.immersive&&<div className="court-moment"><strong>{phase.label==='Legal start'?'Start':phase.label}</strong><span>{name??'Whole team'}</span></div>}
      {visible.length>0&&c.visible&&<span className="court-marks-indicator">{visible.length} local marks</span>}
    </div>
    {c.immersive?<div className="court-focus-tools"><button onClick={fullscreen}>Exit fullscreen</button><button onClick={()=>useCourt.setState({reset:c.reset+1})}>Reset View</button><button onClick={()=>{s.pause();useCourt.setState({annotate:!c.annotate})}}>Annotate</button></div>:<>
      <nav className="court-camera" aria-label="Camera viewpoints">{(['orbit','top','front','side'] as const).map(view=><button key={view} aria-pressed={s.view===view&&!c.freeOrbit} onClick={()=>camera(view)}>{view==='orbit'?'3D':view[0].toUpperCase()+view.slice(1)}</button>)}{s.view!=='orbit'&&<button aria-pressed={c.freeOrbit} onClick={()=>useCourt.setState({freeOrbit:!c.freeOrbit})}>Free orbit</button>}<button className="court-reset" onClick={()=>useCourt.setState({reset:c.reset+1})}>Reset View</button></nav>
      <nav className="court-actions" aria-label="Coaching tools"><button aria-pressed={c.annotate} onClick={()=>{s.pause();setSheet('');useCourt.setState({annotate:!c.annotate,visible:true})}}>{c.annotate?'Navigate':'Annotate'}</button>{['Player','Layers','Notes','More'].map(item=><button key={item} aria-expanded={sheet===item} onClick={()=>{useCourt.setState({annotate:false});setSheet(sheet===item?'':item)}}>{item}{item==='Notes'&&marks.length?` (${marks.length})`:''}</button>)}</nav>
    </>}
    {c.annotate&&<DrawingTools/>}
    {!c.immersive&&<div className="court-guidance"><span>{provenance}</span>{!name&&<span>Tap a player for Now / Next</span>}</div>}
    <CourtDock/>
    {c.storageError&&<div className="court-save-error" role="alert">{c.storageError}<button onClick={exportCourtNotes}>Export now</button></div>}
    {sheet&&!c.immersive&&<aside className="court-sheet" aria-label={`${sheet} sheet`}><div className="court-sheet-heading"><h2>{sheet==='Case'?'Choose an authored case':sheet==='Player'?name??'Whole team':sheet}</h2><button onClick={()=>setSheet('')}>Close</button></div>
      {sheet==='Case'&&<><p>Opponent attack toward our side of the court</p><div className="court-row">{(['left','right'] as const).map(side=><button key={side} disabled={side==='right'&&!source.alternates} aria-pressed={s.opponentAttack===side} onClick={()=>{s.chooseTactics(side,s.firstTouch);s.seek(0)}}>Our {side}</button>)}<button disabled title="No independently authored middle branch">Middle unavailable</button></div><p>First contact</p><div className="court-row">{(['normal','harry'] as const).map(first=><button key={first} disabled={first==='harry'&&!source.alternates} aria-pressed={s.firstTouch===first} onClick={()=>{s.chooseTactics(s.opponentAttack,first);s.seek(0)}}>{first==='normal'?'Normal':'Harry first'}</button>)}</div><p>Choices use actual source cases. No new tactics are generated.</p></>}
      {sheet==='Player'&&<><div className="court-row"><button aria-pressed={!name} onClick={()=>useRotations.setState({selected:''})}>Whole team</button>{bundle.team.players.map(p=><button key={p.id} aria-pressed={s.selected===p.id} onClick={()=>useRotations.setState({selected:p.id})}>{p.name}</button>)}</div><dl className="court-story"><dt>Now</dt><dd>{story.now}</dd><dt>Next</dt><dd>{story.nextEvent?.label} {story.nextText}</dd><dt>If</dt><dd>{story.ifText}</dd></dl><p>{phase.cue}</p><p>These are authored example roles. Coverage and attack readiness require coaching review.</p></>}
      {sheet==='Layers'&&<>{([{key:'labels',label:'Player names'},{key:'trails',label:'Movement paths'},{key:'receiveAreas',label:'Coverage areas'},{key:'ballFlight',label:'Ball flight'},{key:'setterTargetVisible',label:'Setter target'}] as const).map(({key,label})=><label className="court-layer" key={key}><input type="checkbox" checked={s[key]} onChange={e=>useRotations.setState({[key]:e.target.checked})}/>{label}</label>)}<label className="court-layer"><input type="checkbox" checked={c.visible} onChange={e=>useCourt.setState({visible:e.target.checked})}/>Coaching marks</label></>}
      {sheet==='Notes'&&<CourtNotes/>}
      {sheet==='More'&&<><p>{provenance}</p><p>One finger rotates in 3D; preset views pan. Two fingers pan across the court and pinch to zoom together. Free orbit releases a preset. Mouse: drag to orbit, right-drag to pan, wheel to zoom. Reset fits the current view.</p><p>Annotate: one finger or pen draws; two fingers navigate. Add text before tapping its court position. Notes are browser-local and never change tactics.</p><button onClick={async()=>{try{await navigator.clipboard.writeText(courtLink());setMessage(c.reviewId?'Exact review link copied. Private notes are excluded.':s.draft&&!s.publishedOnly?'Published view link copied. Local strategy edits and notes are excluded; publish a review packet to share exact draft data.':'Published view link copied. Private notes are excluded.')}catch{setMessage(courtLink())}}}>Copy view link</button><p role="status">{message}</p>{c.reviewId&&<><a href={`${import.meta.env.BASE_URL}reviews/${c.reviewEntry?.plan}`} target="_blank" rel="noreferrer">Tactical plan (Markdown)</a><a href={`${import.meta.env.BASE_URL}reviews/${c.reviewEntry?.data}`} target="_blank" rel="noreferrer">Exact review JSON</a><button onClick={()=>{const url=new URL(location.href);url.searchParams.delete('review');history.pushState(null,'',url);useCourt.setState({reviewId:null});useRotations.setState({reviewBundle:null,reviewScope:null,publishedOnly:true})}}>Return to published example</button></>}<button onClick={onSets}>Open Set arcs</button></>}
    </aside>}
  </main>
}
