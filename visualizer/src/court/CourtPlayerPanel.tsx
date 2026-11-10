import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { playerFocusStory } from '../lib/playerFocusStory'
import { coverageStage } from '../lib/coverage'
import { resolveStrategyRotation } from '../lib/strategyOverlay'
import { ACTION_LABELS } from '../lib/athletePlan'
import { sourceEvents } from '../lib/strategyEvents'
import type { PlayerId, RotationKey } from '../lib/strategyDraft'
export function CourtPlayerPanel() {
  const s=useRotations(),b=activeBundle(s)!,scenario=activeScenario(s)!,stored=useStrategies(v=>v.working)
  const working=s.review?s.review.strategy:stored,stage=coverageStage(scenario,s.time),key=`${s.rotation}/${s.serve}` as RotationKey
  const player=b.team.players.find(p=>p.id===s.selected),id=player?.id as PlayerId|undefined
  const root=b.plans.scenarios.find(p=>p.rotation===s.rotation&&p.serve===s.serve)!
  const alternate=s.firstTouch==='normal'?(s.opponentAttack==='left'?root.alternates?.harry:root.alternates?.harryRight):(s.opponentAttack==='left'?root:root.alternates?.right)
  const story=playerFocusStory(b.team,scenario,s.time,id??null,id?working?.notes?.players?.[key]?.[stage]?.[id]:null,working?.notes?.team?.[key]?.[stage],alternate)
  const event=sourceEvents(scenario).filter(e=>e.time<=s.time+1e-7).at(-1)
  const action=id&&working&&event?resolveStrategyRotation(working,scenario).eventOverrides?.[event.id]?.actions?.[id]:null
  return <>
    <div className="cm-player-picker" role="group" aria-label="Focus athlete"><button aria-pressed={!player} onClick={()=>useRotations.setState({selected:''})}>Team</button>{b.team.players.map(p=><button key={p.id} aria-pressed={s.selected===p.id} onClick={()=>useRotations.setState({selected:p.id})}><i style={{background:p.color}} />{p.name}</button>)}</div>
    <h3>{player?.name??'Whole team'} <span>{story.moment}</span></h3>
    {action&&<p className="cm-coached-action">Coach action: {ACTION_LABELS[action]}</p>}
    <dl className="cm-instructions"><dt>Now</dt><dd>{story.now}</dd><dt>Next</dt><dd>{story.nextText}</dd><dt>If</dt><dd>{story.ifText}</dd></dl>
    {story.location&&<p className="cm-muted">{story.location}</p>}
    <p className="cm-muted">Instructions describe this authored example. Coverage areas are approximate responsibilities, not measured reach.</p>
  </>
}
