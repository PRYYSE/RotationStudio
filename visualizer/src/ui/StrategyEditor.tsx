import { useState } from 'react'
import { useStrategies } from '../state/strategyStore'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { isFront, positionOf, sampleTrack } from '../lib/rotationModel'
import { stageOrder, stageTimes } from '../lib/strategyDraft'
import type { PlayerId, RotationKey } from '../lib/strategyDraft'
import { strategyPoint } from '../lib/strategyOverlay'

export function StrategyEditor({ warnings }: { warnings: string[] }) {
  const studio = useStrategies(), s = useRotations(), scenario = activeScenario(s)!, team = activeBundle(s)!.team
  const [reset, setReset] = useState(false)
  const key = `${s.rotation}/${s.serve}` as RotationKey
  const point = strategyPoint(studio.working, scenario, studio.stage, s.selected)
  const stages = stageOrder(s.serve), times = stageTimes(scenario)
  const bends = studio.working?.overrides[key]?.routes?.[studio.stage]?.[s.selected as PlayerId]
  const front = team.players.filter(p => isFront(positionOf(team, s.rotation, p.id)) && p.id !== scenario.secondContact.player)
  return <section className="strategy-editor" aria-label="Court strategy editor">
    <h2>R{s.rotation} · {s.serve === 'us' ? 'Us' : 'They'} serve · {studio.stage}</h2>
    <nav className="strategy-stages" aria-label="Court stages">{stages.map(stage => <button key={stage} aria-pressed={studio.stage === stage} onClick={() => studio.setStage(stage)}>{stage}</button>)}</nav>
    <label className="coverage-toggle"><input type="checkbox" checked={s.receiveAreas} onChange={e => useRotations.setState({ receiveAreas: e.target.checked })} /> Coverage areas</label>
    {!studio.working ? <p>Team V3 is read-only. Create a strategy to place athletes and edit routes.</p> : <>
      <p>Drag athletes or enter metres. Changes apply to all four variants for this serve.</p>
      {studio.stage === 'Start' && <p className="strategy-warning">Start holds through service contact in playback. Keep rotational order and P1 behind the endline on our serve; review any warnings below.</p>}
      <div className="editor-grid">
        <label>Selected athlete<select aria-label="Selected athlete" value={s.selected} onChange={e => useRotations.setState({ selected: e.target.value })}>
          {team.players.map(p => <option key={p.id} value={p.id}>{p.name} · P{positionOf(team, s.rotation, p.id)}</option>)}<option value="target">Setter pass target · gold ring</option>
        </select></label>
        <button aria-pressed={s.selected === 'target'} onClick={() => useRotations.setState({ selected: 'target' })}>Select gold target</button>
        {(['x', 'z'] as const).map(axis => <label key={axis}>{axis.toUpperCase()} (m)<input key={`${key}/${studio.stage}/${s.selected}/${axis}`} aria-label={`${axis.toUpperCase()} metres`} type="number" step="0.1" min={axis === 'x' ? -4.5 : 0} max={axis === 'x' ? 4.5 : s.selected === 'target' ? 2.99 : 12} value={Number(point[axis].toFixed(2))} onChange={e => { if (e.target.value !== '') s.edit({ ...point, [axis]: Number(e.target.value) }) }} /></label>)}
      </div>
      <div className="rotation-row">
        <button aria-pressed={studio.routeVisible} disabled={s.selected === 'target' || studio.stage === 'Start'} onClick={() => useStrategies.setState({ routeVisible: !studio.routeVisible })}>Incoming route</button>
        <button disabled={s.selected === 'target' || studio.stage === 'Start'} onClick={() => {
          const previous = stages[stages.indexOf(studio.stage) - 1]
          const a = sampleTrack(scenario.tracks[s.selected], Math.max(scenario.ball[0].start, times[previous])), b = sampleTrack(scenario.tracks[s.selected], times[studio.stage])
          studio.bend(key, s.selected, [{ x: Math.max(-4.5, Math.min(4.5, (a.x + b.x) / 2 + .6)), z: (a.z + b.z) / 2 }])
          useStrategies.setState({ routeVisible: true })
        }}>{bends?.length ? 'Replace with one bend' : 'Add bend'}</button>
        <button disabled={s.selected === 'target' || studio.stage === 'Start'} onClick={() => studio.bend(key, s.selected, [])}>Straighten</button>
      </div>
      <div className="rotation-row">
        <button disabled={!studio.past.length || !!studio.gesture} onClick={studio.undo}>Undo</button><button disabled={!studio.future.length || !!studio.gesture} onClick={studio.redo}>Redo</button>
        <button onClick={() => studio.resetStage(key)}>Reset stage</button><button onClick={() => setReset(true)}>Reset rotation</button>
      </div>
      {studio.stage === 'Set' && <div className="strategy-assist">
        <button onClick={() => studio.prepareHitters(key)}>Prepare all hitters</button>
        <p>Optional approach-ready positions for {front.map(p => p.name).join(', ')}. Keeps the active setter and your explicit placements. Undo or Reset stage to revert.</p>
      </div>}
      <details><summary>Editing help</summary><p>Each stage places all six athletes. Incoming routes run from the previous anchor after service contact. Add a bend, then drag its handle. Coverage shows approximate responsibilities, not measured reach.</p></details>
      {reset && <div role="alert" className="strategy-confirm">Revert all edits to R{s.rotation}, {s.serve === 'us' ? 'Us' : 'They'} serve? Other serve order stays separate.
        <button onClick={() => { studio.resetRotation(key); setReset(false) }}>Confirm rotation reset</button><button onClick={() => setReset(false)}>Cancel</button>
      </div>}
    </>}
    {!!warnings.length && <details className="strategy-warning"><summary>Needs review · {warnings.length} {warnings.length === 1 ? 'notice' : 'notices'}</summary>{warnings.slice(0, 20).map((w, i) => <p key={i}>{w}</p>)}{warnings.length > 20 && <p>{warnings.length - 20} further {warnings.length - 20 === 1 ? 'notice' : 'notices'}. Review exported JSON before approval.</p>}</details>}
  </section>
}
