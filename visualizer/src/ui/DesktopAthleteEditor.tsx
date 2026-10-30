import { useEffect, useState, type CSSProperties } from 'react'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { isFront, positionOf, sampleTrack, selectScenario } from '../lib/rotationModel'
import { ATHLETE_ACTIONS, COVERAGE_ROLES, scenarioCaseKey } from '../lib/strategyDraft'
import type { AthleteAction, CoverageZone, PlayerId, RotationKey } from '../lib/strategyDraft'
import { resolveStrategyRotation } from '../lib/strategyOverlay'
import { sourceEvents } from '../lib/strategyEvents'
import { ACTION_LABELS, actionWarning, routeBends, routeMetres } from '../lib/athletePlan'
import { coverageAreas, coverageZoneAt } from '../lib/coverage'
import type { ReviewProjection } from '../lib/reviewTypes'

const coverageNames: Record<CoverageZone['role'], string> = {
  receive: 'Receive / dig', tip: 'Short ball / tips', block: 'Block lane', deep: 'Deep court',
  'attack-cover': 'Cover our hitter', 'setter-support': 'Support setter', custom: 'Other area',
}
const roleNames: Record<string, string> = { start: 'Ready', serve: 'Serve', receive: 'Receive', pass: 'Receive/Dig', set: 'Set', attack: 'Attack', block: 'Block', help: 'Support', defend: 'Defend', recover: 'Recover' }

export function DesktopAthleteEditor({ review }: { review: ReviewProjection | null }) {
  const studio = useStrategies(), r = useRotations(), scenario = activeScenario(r)!, team = activeBundle(r)!.team
  const root = r.published!.plans.scenarios.find(s => s.rotation === r.rotation && s.serve === r.serve)!
  const source = selectScenario(root, r.opponentAttack, r.firstTouch)
  const events = sourceEvents(source), event = r.playing ? events.filter(e => e.time <= r.time + 1e-7).at(-1) : events.find(e => e.id === studio.event?.id)
  const [confirmShared, setConfirmShared] = useState(false)
  const [activeTool, setActiveTool] = useState<'position' | 'movement' | 'action' | 'coverage'>('position')
  const key = `${r.rotation}/${r.serve}` as RotationKey, caseKey = scenarioCaseKey(source)!
  const id = r.selected as PlayerId, player = team.players.find(p => p.id === id)
  const time = event?.time ?? r.time, changes = studio.working ? resolveStrategyRotation(studio.working, source) : undefined
  const index = event ? events.indexOf(event) : -1, previous = events[index - 1], next = events[index + 1]
  const target = studio.routeDirection === 'into' ? event : next
  const start = studio.routeDirection === 'into' ? previous : event
  const canRoute = !!player && !!target && !!start && start.time >= source.ball[0].start
  const bends = canRoute ? routeBends(scenario, source, target!.id, id) : []
  const point = player ? sampleTrack(scenario.tracks[id], time) : null
  const baseline = player ? sampleTrack(source.tracks[id], time) : null
  const action = event && player ? changes?.eventOverrides?.[event.id]?.actions?.[id] : undefined
  const role = player ? sampleTrack(source.tracks[id], time).role : ''
  const zone = player ? coverageZoneAt(changes, source, time, id) : undefined
  const own = studio.scope ? studio.working?.caseOverrides?.[studio.scope] : studio.working?.overrides[key]
  const ownZone = event && own?.eventOverrides?.[event.id]?.coverage?.[id]
  const area = player ? coverageAreas(team, scenario, time, true, changes).find(a => a.player === id) : undefined
  const setZone = (patch: Partial<CoverageZone>) => {
    if (!player) return
    studio.setCoverage(key, id, { ...(zone ?? { role: 'custom', radiusX: area?.radiusX ?? 1, radiusZ: area?.radiusZ ?? 1 }), ...patch })
    useRotations.setState({ receiveAreas: true }); useStrategies.setState({ coverageDisplay: 'selected', coverageHidden: studio.coverageHidden.filter(p => p !== id) })
  }
  // A newly selected strategy starts with the visible case, including when a
  // saved strategy is selected while the editor remains open.
  useEffect(() => { if (studio.working) useStrategies.getState().setScope(caseKey) }, [studio.working?.id])
  if (!player || !point || !baseline || !event) return <p>Select an athlete and a moment on the rally below.</p>
  const warnings = actionWarning(source, team, event.id, id, action ?? undefined)
  const routeText = (a: typeof event | undefined, b: typeof event | undefined) => a && b
    ? `${a.label} → ${b.label} · ${routeMetres(scenario, id, a.time, b.time).toFixed(1)} m / ${(b.time - a.time).toFixed(2)} s` : 'No movement at this end of the rally.'
  return <section className="strategy-editor desktop-athlete-editor" aria-label="Athlete editor">
    <div className="editor-athlete-heading" style={{ '--athlete-color': player.color } as CSSProperties}>
      <p className="editor-eyebrow">ATHLETE PLAN <span>{event.label} · {time.toFixed(2)} s</span></p>
      <h2>{player.name} <span>P{positionOf(team, r.rotation, id)}</span></h2>
      <p className="athlete-compact-status" aria-label="Current athlete action">{action ? ACTION_LABELS[action] : roleNames[role] ?? role} · {zone?.role ? coverageNames[zone.role] + ' zone' : 'Coverage not customised'}</p>
      <p className="editor-current-task">{review?.explanation.player || review?.explanation.team || 'Choose what this athlete should do at this moment.'}</p>
      <label>Selected athlete<select aria-label="Selected athlete" value={id} onChange={e => useRotations.setState({ selected: e.target.value })}>
        {team.players.map(p => <option value={p.id} key={p.id}>{p.name} · P{positionOf(team, r.rotation, p.id)}</option>)}
      </select></label>
      <p className="editor-scope">R{r.rotation} · {r.serve === 'us' ? 'Our' : 'Their'} serve · {r.opponentAttack === 'left' ? 'Attack from our left' : 'Attack from our right'} · {r.firstTouch === 'harry' ? 'Harry first' : 'Normal first touch'}</p>
      <p className="editor-scope">{studio.scope ? 'This case · 1 of 4 versions' : 'Shared foundation · up to 4 versions'}</p>
      <div className="editor-scope-actions"><button aria-pressed={!!studio.scope} onClick={() => { studio.setScope(caseKey); setConfirmShared(false) }}>This case</button>
        <button aria-pressed={!studio.scope} onClick={() => setConfirmShared(true)}>Shared foundation</button></div>
      {confirmShared && studio.scope && <div className="strategy-confirm">Shared changes apply to these 4 versions. Case-specific edits take precedence.
        <ul>{[root, ...Object.values(root.alternates ?? {})].map(c => {
          const ck = scenarioCaseKey(c)!, exact = studio.working?.caseOverrides?.[ck]
          return <li key={ck}>{c.tactics?.opponentAttack === 'left' ? 'Our left' : 'Our right'} · {c.tactics?.firstTouch === 'harry' ? 'Harry first' : 'Normal first'}{exact ? ' · has case edits' : ' · inherits foundation'}</li>
        })}</ul>
        <button onClick={() => { studio.setScope(null); setConfirmShared(false) }}>Edit shared foundation</button><button onClick={() => setConfirmShared(false)}>Cancel</button></div>}
    </div>
    <div className="athlete-tool-switcher" role="group" aria-label="Athlete editing tools">
      {(['position', 'movement', 'action', 'coverage'] as const).map(tool => <button key={tool} type="button" aria-pressed={activeTool === tool}
        onClick={() => { setActiveTool(tool); if (tool === 'coverage') useRotations.setState({ receiveAreas: true }) }}>
        {tool === 'position' ? 'Place' : tool === 'movement' ? 'Route' : tool === 'action' ? 'Action' : 'Zone'}
      </button>)}
    </div>
    <div className="athlete-quick-history" role="group" aria-label="Edit history">
      <button disabled={!studio.past.length || r.playing} onClick={studio.undo}>Undo</button>
      <button disabled={!studio.future.length || r.playing} onClick={studio.redo}>Redo</button>
      <span>{studio.saved ? 'Saved locally' : 'Unsaved changes'}</span>
    </div>
    <fieldset className="editor-fields" id="athlete-tool-panel" disabled={!studio.working || r.playing}>
      {activeTool === 'position' && <section className="athlete-section"><h3>Position</h3>
        <p>{r.view === 'top' ? 'Drag the athlete on court to move them.' : 'Choose Top view to drag the athlete.'}</p>
        <p className="edit-change-summary">{Math.hypot(point.x - baseline.x, point.z - baseline.z).toFixed(2)} m from original position · the faint marker shows the original.</p>
      </section>}
      {activeTool === 'movement' && <section className="athlete-section"><h3>Movement</h3>
        <p>Into: {routeText(previous, event)}</p><p>Out: {routeText(event, next)}</p>
        <div className="rotation-row" aria-label="Route to edit"><button aria-pressed={studio.routeDirection === 'into'} onClick={() => useStrategies.setState({ routeDirection: 'into' })}>Into moment</button><button aria-pressed={studio.routeDirection === 'out'} onClick={() => useStrategies.setState({ routeDirection: 'out' })}>Out of moment</button></div>
        <div className="rotation-row"><button disabled={!canRoute || bends.length >= 8} onClick={() => {
          if (!target || !start) return
          const a = sampleTrack(scenario.tracks[id], start.time), b = sampleTrack(scenario.tracks[id], target.time)
          studio.bendAt(key, id, target.id, [...bends, { x: Math.max(-4.5, Math.min(4.5, (a.x + b.x) / 2 + .4)), z: Math.max(0, Math.min(9, (a.z + b.z) / 2)) }])
          useStrategies.setState({ routeVisible: true })
        }}>Add bend</button><button disabled={!canRoute} onClick={() => target && studio.bendAt(key, id, target.id, [])}>Straighten</button></div>
        {bends.length > 0 && <p>Drag a light handle on the court. {bends.map((_, i) => <button key={i} onClick={() => target && studio.bendAt(key, id, target.id, bends.filter((_, n) => n !== i))}>Delete bend {i + 1}</button>)}</p>}
        {!canRoute && <p>Movement editing starts after the serve and needs a neighbouring moment.</p>}
      </section>}
      {activeTool === 'action' && <section className="athlete-section"><h3>Action</h3><p>What {player.name} does at this moment. Original role: {roleNames[role] ?? role}.</p>
        <label>Teaching action<select aria-label="Teaching action" value={action ?? ''} onChange={e => studio.setAction(key, id, (e.target.value || null) as AthleteAction | null)}>
          <option value="">Original role · {roleNames[role] ?? role}</option>{ATHLETE_ACTIONS.map(a => <option value={a} key={a}>{ACTION_LABELS[a]}</option>)}
        </select></label><p className="action-badge">{action ? ACTION_LABELS[action] : `Original: ${roleNames[role] ?? role}`}</p>
        {warnings.map(w => <p className="strategy-warning" role="alert" key={w}>{w}</p>)}
        {action === 'block' && !isFront(positionOf(team, r.rotation, id)) && <p>Back-row athletes may defend near the net without blocking above it.</p>}
      </section>}
      {activeTool === 'coverage' && <section className="athlete-section"><h3>Coverage</h3><p>The space {player.name} is responsible for, separate from their action. Drag the two diamonds to resize.</p>
        <label>Coverage purpose<select aria-label="Coverage purpose" value={zone?.role ?? ''} onChange={e => setZone({ role: e.target.value as CoverageZone['role'] })}>
          <option value="" disabled>Choose a purpose</option>{COVERAGE_ROLES.map(v => <option value={v} key={v}>{coverageNames[v]}</option>)}
        </select></label>
        {zone && <details><summary>Advanced · precise area</summary><div className="editor-grid">
          {(['radiusX', 'radiusZ', 'offsetX', 'offsetZ'] as const).map(field => <label key={field}>{field === 'radiusX' ? 'Width' : field === 'radiusZ' ? 'Depth' : field === 'offsetX' ? 'Side offset' : 'Depth offset'} (m)
            <input key={`${id}/${field}/${zone[field]}`} type="number" step="0.1" min={field.startsWith('radius') ? .2 : -4.5} max={field.startsWith('radius') ? 9 : 4.5} defaultValue={field.startsWith('radius') ? (zone[field] ?? 0) * 2 : zone[field] ?? 0} onBlur={e => {
              const n = Number(e.target.value), radius = field.startsWith('radius')
              if (e.target.value !== '' && Number.isFinite(n) && n >= (radius ? .2 : -4.5) && n <= (radius ? 9 : 4.5)) setZone({ [field]: radius ? n / 2 : n })
            }} /></label>)}
        </div></details>}
        {zone && <button disabled={!ownZone} onClick={() => studio.resetCoverage(key, id)}>Reset coverage</button>}
      </section>}
    </fieldset>
    {studio.error && <p className="strategy-warning" role="alert">{studio.error}</p>}
  </section>
}
