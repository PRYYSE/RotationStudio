import { useEffect, useState } from 'react'
import { activeScenario, timelineTimes, useRotations } from '../state/rotationStore'
import { sourceEvents } from '../lib/strategyEvents'
import { phaseAt } from '../lib/rotationModel'
export function CourtDock() {
  const s=useRotations(),scenario=activeScenario(s)!
  const [loop,setLoop]=useState('off'),[segment,setSegment]=useState<[number,number]>([0,scenario.duration])
  const events=scenario.tactics && !scenario.teachingOnly ? sourceEvents(scenario) : timelineTimes(scenario).map(time=>({id:String(time),label:scenario.phases.find(p=>p.time===time)?.label??'Track / ball event',time}))
  const current=[...events].reverse().find(e=>e.time<=s.time+.0001)
  function step(dir:number){const event=dir>0?events.find(e=>e.time>s.time+.001):[...events].reverse().find(e=>e.time<s.time-.001);if(event)s.seek(event.time)}
  useEffect(()=>{setLoop('off')},[s.rotation,s.serve,s.opponentAttack,s.firstTouch,scenario])
  useEffect(()=>{useRotations.setState({repeatRange:loop==='off'?null:segment});return()=>useRotations.setState({repeatRange:null})},[loop,segment])
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes((e.target as HTMLElement).tagName) || e.ctrlKey || e.metaKey || e.altKey)return
      if(e.code==='Space'){e.preventDefault();useRotations.getState().toggle()}
      if(e.code==='ArrowRight'||e.code==='ArrowLeft'){e.preventDefault();step(e.code==='ArrowRight'?1:-1)}
    };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
  })
  return <footer className="court-dock" aria-label="Court playback">
    <div className="court-event-strip" aria-label="Exact authored events">{events.map(e=><button key={e.id} aria-pressed={current?.id===e.id} onClick={()=>s.seek(e.time)} title={`${e.time.toFixed(2)}s`}>{e.label}<small>{e.time.toFixed(2)}</small></button>)}</div>
    <div className="court-transport">
      <button aria-label="Restart" onClick={()=>s.seek(loop==='off'?0:segment[0])}>↺</button>
      <button aria-label="Previous event" disabled={s.time<=0} onClick={()=>step(-1)}>◀</button>
      <button className="court-play" aria-label={s.playing?'Pause':'Play'} onClick={()=>s.toggle()}>{s.playing?'Pause':'Play'}</button>
      <button aria-label="Next event" disabled={s.time>=scenario.duration} onClick={()=>step(1)}>▶</button>
      <input type="range" aria-label="Scrub court timeline" min={0} max={scenario.duration} step={.01} value={s.time} onChange={e=>s.seek(Number(e.target.value))}/>
      <output aria-label="Court time">{s.time.toFixed(2)}s</output>
      <select className="court-speed" aria-label="Playback speed" value={s.rate} onChange={e=>useRotations.setState({rate:Number(e.target.value)})}>{[.25,.5,1,1.5,2].map(r=><option key={r} value={r}>{r}×</option>)}</select>
      <select className="court-loop" aria-label="Repeat" value={loop} onChange={e=>{const value=e.target.value;setLoop(value);const phase=phaseAt(scenario,s.time);setSegment(value==='phase'?[phase.time,scenario.phases.find(p=>p.time>phase.time)?.time??scenario.duration]:[0,scenario.duration])}}><option value="off">Repeat off</option><option value="rally">Repeat rally</option><option value="phase">Repeat phase</option></select>
    </div>
  </footer>
}
