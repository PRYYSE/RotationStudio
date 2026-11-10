import { useEffect, useRef } from 'react'
import { activeScenario, useRotations } from '../state/rotationStore'
import { chronologicalPhases } from '../lib/courtMode'
import { phaseAt } from '../lib/rotationModel'
import { CourtIcon } from './CourtIcon'
export function CourtPlayback() {
  const s=useRotations(),scenario=activeScenario(s)!,phase=phaseAt(scenario,s.time),rail=useRef<HTMLElement>(null)
  const phases=chronologicalPhases(scenario.phases)
  const step=(direction:number)=>{
    const event=direction>0?phases.find(p=>p.time>s.time+.01):[...phases].reverse().find(p=>p.time<s.time-.01)
    if(event)s.navigate(event.time,true)
  }
  useEffect(()=>{rail.current?.querySelector('[aria-current="step"]')?.scrollIntoView({block:'nearest',inline:'nearest'})},[phase.label])
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if((e.target as HTMLElement).closest('input,select,textarea,button')||e.metaKey||e.ctrlKey||e.altKey)return
      if(e.code==='Space'){e.preventDefault();useRotations.getState().toggle()}
      if(e.code==='ArrowRight'||e.code==='ArrowLeft'){e.preventDefault();step(e.code==='ArrowRight'?1:-1)}
    }
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
  })
  return <footer className="cm-playback" aria-label="Rally playback">
    <div className="cm-moment"><strong>{phase.label==='Legal start'?'Before serve':phase.label}</strong><output aria-label="Rally time">{s.time.toFixed(2)} <span>/ {scenario.duration.toFixed(1)}s</span></output></div>
    <nav className="cm-phase-rail" aria-label="All rally phases" ref={rail}>{phases.map((p,i)=><button key={`${p.time}/${p.label}`} aria-current={p===phase?'step':undefined} onClick={()=>s.navigate(p.time,true)}><span>{i+1}</span>{p.label==='Legal start'?'Start':p.label}</button>)}</nav>
    <div className="cm-transport">
      <button className="cm-icon-button" aria-label="Restart rally" onClick={()=>s.seek(0)}><CourtIcon name="restart" /></button>
      <button className="cm-icon-button" aria-label="Previous phase" disabled={s.time<=0} onClick={()=>step(-1)}><CourtIcon name="previous" /></button>
      <button className="cm-play" aria-label={s.playing?'Pause rally':'Play rally'} onClick={()=>useRotations.getState().toggle()}><CourtIcon name={s.playing?'pause':'play'} /></button>
      <button className="cm-icon-button" aria-label="Next phase" disabled={s.time>=phases.at(-1)!.time} onClick={()=>step(1)}><CourtIcon name="next" /></button>
      <input type="range" min="0" max={scenario.duration} step=".01" value={s.time} aria-label="Scrub complete rally" onChange={e=>s.seek(Number(e.target.value))} />
      <select aria-label="Playback speed" value={s.rate} onChange={e=>useRotations.setState({rate:Number(e.target.value)})}>{[.25,.5,1,1.5,2].map(rate=><option key={rate} value={rate}>{rate}×</option>)}</select>
    </div>
  </footer>
}
