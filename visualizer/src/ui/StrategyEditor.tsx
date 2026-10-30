import { useState, type ReactNode, type CSSProperties } from 'react'
import { useStrategies } from '../state/strategyStore'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { positionOf, sampleTrack, selectScenario } from '../lib/rotationModel'
import { BASE_REVISION, laterDefendTime, scenarioCaseKey, stageOrder, stageTimes } from '../lib/strategyDraft'
import type { PlayerId, RotationKey } from '../lib/strategyDraft'
import { resolveStrategyRotation } from '../lib/strategyOverlay'
import { commitMetres } from '../lib/metreDraft'
import { scopeEditorFindings } from '../lib/editorFindings'
import type { ReviewProjection } from '../lib/reviewTypes'
import { CoverageEditor } from './CoverageEditor'
import { EventNavigator } from './EventNavigator'
import { eventRouteInterval, sourceEvents } from '../lib/strategyEvents'
import { selectDesktopEvent } from '../state/desktopNavigation'

function EditorDisclosure({ desktop, title, children }: { desktop: boolean; title: string; children: ReactNode }) {
  return desktop ? <details className="editor-disclosure"><summary>{title}</summary>{children}</details> : <>{children}</>
}

function MetreField({ axis, value, max, commit }: { axis: 'x' | 'z'; value: number; max: number; commit: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null), [invalid, setInvalid] = useState(false)
  const finish = () => {
    if (draft === null) return
    const n = commitMetres(draft, axis === 'x' ? -4.5 : 0, max)
    if (n === null) { setInvalid(true); return }
    if (n !== value) commit(n)
    setDraft(null); setInvalid(false)
  }
  return <label>{axis.toUpperCase()} (m)<input aria-label={`${axis.toUpperCase()} metres`} type="text" inputMode="decimal"
    value={draft ?? String(Number(value.toFixed(2)))} aria-invalid={invalid}
    onChange={e => { setDraft(e.target.value); setInvalid(false) }} onBlur={finish}
    onKeyDown={e => {
      if (e.key === 'Enter') { e.preventDefault(); finish() }
      if (e.key === 'Escape') { e.preventDefault(); setDraft(null); setInvalid(false) }
    }} />{invalid && <span role="alert">Enter a decimal from {axis === 'x' ? -4.5 : 0} to {max} m. Escape cancels.</span>}</label>
}

function ImpactInspector({ review, rotationKey }: { review: ReviewProjection | null; rotationKey: RotationKey }) {
  const [expanded, setExpanded] = useState(false)
  const findings = scopeEditorFindings(review?.reviewFindings ?? [], rotationKey)
  return <details className="case-impact" aria-label="Case impact inspector">
    <summary>Case impact · {findings.length} findings · DRAFT</summary>
    <p>All authored cases for this rotation/serve. Structural checks and movement screens do not approve tactics or referee foot positions.</p>
    <button onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse case evidence' : 'Expand all case evidence'}</button>
    {(['RULE', 'GEOMETRY_TIME', 'CONTACT', 'COVERAGE', 'TACTICAL_REVIEW'] as const).map(category => <section key={category} aria-label={category}>
      <h3>{category}</h3>
      {(['INVALID', 'CAUTION', 'REVIEW'] as const).map(severity => {
        const items = findings.filter(f => f.category === category && f.severity === severity)
        return !items.length ? null : <div key={severity} className={`impact-${severity.toLowerCase()}`}><h4>{severity} · {items.length}</h4>
          {items.map((f, i) => <details key={`${category}/${severity}/${i}`} open={expanded || undefined}>
            <summary>{f.playerId ? `${f.playerId} · ` : ''}{f.summary} ({f.affectedCases.length} cases)</summary>
            <p><strong>Why it matters:</strong> {f.category === 'RULE' ? 'A required rule screen is invalid; this draft needs correction and human review.'
              : f.category === 'CONTACT' ? 'The named contact and linked ball endpoints must agree.'
                : f.category === 'GEOMETRY_TIME' ? 'The displayed route must fit the actual authored time; this is a teaching screen.'
                  : 'Authored responsibilities and alternate readiness still need coaching review.'}</p>
            <p><strong>What to check:</strong> {f.suggestedCheck}</p>
            <p>Evidence source: {f.source}{f.affectedStage ? ` · ${f.affectedStage}` : ''}</p>
            {f.affectedCases.map(caseKey => <details key={caseKey} open={expanded || undefined}><summary>{caseKey}</summary>
              {f.details.filter(d => d.caseKey === caseKey).map((d, j) => <p key={j}><strong>What happened:</strong> {d.message}
                {d.interval && <> {d.interval.from.label} ({d.interval.from.time.toFixed(2)} s) → {d.interval.to.label} ({d.interval.to.time.toFixed(2)} s): {d.interval.pathMetres.toFixed(2)} m / {d.interval.availableSeconds.toFixed(2)} s.</>}</p>)}
            </details>)}
          </details>)}
        </div>
      })}
      {!findings.some(f => f.category === category) && <p>No finding in this category. Not a tactical approval.</p>}
    </section>)}
  </details>
}

export function StrategyEditor({ review, desktop = false }: { review: ReviewProjection | null; desktop?: boolean }) {
  const studio = useStrategies(), s = useRotations(), scenario = activeScenario(s)!, team = activeBundle(s)!.team
  const [reset, setReset] = useState<'case' | 'rotation' | null>(null)
  const key = `${s.rotation}/${s.serve}` as RotationKey, caseKey = scenarioCaseKey(scenario)!
  const root = s.published?.plans.scenarios.find(v => v.rotation === s.rotation && v.serve === s.serve)
  const source = root ? selectScenario(root, s.opponentAttack, s.firstTouch) : scenario
  const events = sourceEvents(source), event = studio.event ? events.find(e => e.id === studio.event!.id) : undefined
  const later = studio.laterDefend && s.serve === 'us' && studio.stage === 'Defend'
  const stages = stageOrder(s.serve), times = stageTimes(scenario), time = event?.time ?? (later ? laterDefendTime(scenario)! : times[studio.stage])
  const selectStage = (stage: typeof studio.stage) => {
    const destination = times[stage]
    if (s.reducedMotion || Math.abs(s.time - destination) < .005) {
      studio.setStage(stage); s.navigate(destination, true)
    } else s.navigate(destination)
  }
  const selectEvent = (id: string) => {
    if (desktop) { selectDesktopEvent(source, id); return }
    const destination = events.find(e => e.id === id)?.time
    if (destination === undefined) return
    if (s.reducedMotion || Math.abs(s.time - destination) < .005) {
      studio.setEvent(source, id, s.published ?? undefined); s.navigate(destination, true)
    } else s.navigate(destination)
  }
  const point = s.selected === 'target' ? scenario.setterTarget : sampleTrack(scenario.tracks[s.selected], time)
  const effective = studio.working ? resolveStrategyRotation(studio.working, scenario) : null
  const bends = event ? effective?.eventOverrides?.[event.id]?.routes?.[s.selected as PlayerId] : later ? effective?.laterDefend?.routes?.[s.selected as PlayerId] : effective?.routes?.[studio.stage]?.[s.selected as PlayerId]
  const comparison = review?.comparison, path = comparison?.current.incoming
  const name = (id: string | null) => id === 'target' ? 'Setter pass target' : team.players.find(p => p.id === id)?.name ?? 'Not authored for this case'
  const targetDisabled = (later || !!event) && s.selected === 'target'
  const routesDisabled = s.selected === 'target' || (event ? event.time <= scenario.ball[0].start : studio.stage === 'Start')
  const athlete = team.players.find(p => p.id === s.selected)
  const athletePicker = <label>Selected athlete<select aria-label="Selected athlete" value={s.selected} onChange={e => useRotations.setState({ selected: e.target.value })}>
    {team.players.map(p => <option key={p.id} value={p.id}>{p.name} · P{positionOf(team, s.rotation, p.id)}</option>)}<option value="target" disabled={later || !!event}>Setter pass target · gold ring</option>
  </select></label>
  const historyControls = <div className="rotation-row editor-history">
    <button disabled={!studio.past.length || !!studio.gesture || s.playing} onClick={studio.undo}>Undo</button><button disabled={!studio.future.length || !!studio.gesture || s.playing} onClick={studio.redo}>Redo</button>
    {event ? <button onClick={() => studio.resetEvent(key)}>Reset event</button> : <button onClick={() => studio.resetStage(key)}>Reset stage</button>}
    {studio.scope ? <button disabled={!studio.working?.caseOverrides?.[caseKey]} onClick={() => setReset('case')}>Reset case to shared</button> : <button onClick={() => setReset('rotation')}>Reset rotation</button>}
  </div>
  return <section className="strategy-editor" aria-label="Court strategy editor">
    {desktop && <div className="editor-athlete-heading" style={{ '--athlete-color': athlete?.color ?? '#efb56b' } as CSSProperties}>
      <p className="editor-eyebrow">POSITION EDITOR <span>{event?.time.toFixed(2) ?? time.toFixed(2)} s · {event?.label ?? studio.stage}</span></p>
      <h2>{name(s.selected)} <span>{athlete ? `P${positionOf(team, s.rotation, athlete.id)}` : 'Target'}</span></h2>
      <p className="editor-current-task">{review?.explanation.player || review?.explanation.team || (athlete && sampleTrack(source.tracks[athlete.id], time).role) || 'Choose an athlete and drag to reposition.'}</p>
      <div className="editor-athlete-picker">{athletePicker}</div>
      <p className="editor-scope" aria-label="Current edit scope">{studio.scope ? 'This exact case · Only this version' : 'Shared · Edits affect all 4 versions'}</p>
      <div className="editor-scope-actions" aria-label="Edit scope">
        <button aria-pressed={!studio.scope} onClick={() => studio.setScope(null)}>All 4 versions</button>
        <button aria-pressed={!!studio.scope} onClick={() => studio.setScope(caseKey)}>Only this version</button>
      </div>
    </div>}
    {!desktop && <>
    <div className="editor-context">
      <h2>R{s.rotation} · {s.serve === 'us' ? 'Us' : 'They'} serve · {event?.label ?? studio.stage}</h2>
      <nav className="strategy-stages" aria-label="Court stages">{stages.map(stage => <button key={stage} aria-pressed={!event && studio.stage === stage} onClick={() => selectStage(stage)}>{stage}</button>)}</nav>
      <p className="editor-scope" aria-label="Current edit scope">{studio.scope ? 'This exact case · 1 authored alternative' : 'Shared · all 4 authored alternatives'}<br />{name(s.selected)} · {event ? `${event.label} · ${time.toFixed(2)} s` : later ? 'Later: after our attack' : studio.stage}</p>
    </div>
    <EventNavigator events={events} selectedId={event?.id} onSelect={selectEvent} />
    </>}
    <EditorDisclosure desktop={desktop} title="Version & source details">
    {event && <section aria-label="Source event facts" className="editor-comparison">
      <h3>{event.label} · {time.toFixed(2)} s · source occurrence {event.occurrence}</h3>
      <p>{event.id} · {event.caseKey}<br />Source contact: {event.actors.map(name).join(', ') || 'No named our-team contact at this boundary'}. Selected athlete source role: {s.selected === 'target' ? 'Select an athlete' : sampleTrack(source.tracks[s.selected], time).role}.</p>
      <p>Timing, ball kind and touch ownership are read-only. Editing a position or coach-assigned area does not author a different toucher or flight.</p>
      {time <= scenario.ball[0].start && <p>Service-contact hold: this placement holds from Start through the existing serve hit. Incoming routes are read-only until release.</p>}
    </section>}
    <div className="editor-grid" aria-label="Authored case selection">
      <label>Their attack<select aria-label="Editor attack side" value={s.opponentAttack} onChange={e => s.chooseTactics(e.target.value as typeof s.opponentAttack, s.firstTouch)}><option value="left">Our left</option><option value="right">Our right</option></select></label>
      <label>First touch<select aria-label="Editor first touch" value={s.firstTouch} onChange={e => s.chooseTactics(s.opponentAttack, e.target.value as typeof s.firstTouch)}><option value="normal">Normal</option><option value="harry">Harry first</option></select></label>
    </div>
    <p className="editor-provenance">Source case: {caseKey} · {review?.caseSource ?? 'published'} · Team V3 {BASE_REVISION}</p>
    </EditorDisclosure>
    {!desktop && studio.working && <div className="rotation-row" aria-label="Edit scope">
      <button aria-pressed={!studio.scope} onClick={() => studio.setScope(null)}>Shared: all 4 cases</button>
      <button aria-pressed={!!studio.scope} onClick={() => studio.setScope(caseKey)}>Customise this case</button>
    </div>}
    {!desktop && !studio.scope && studio.working?.caseOverrides && <p>Exact-case placements take precedence over shared fields. Inspect each alternative below.</p>}
    {!event && s.serve === 'us' && studio.stage === 'Defend' && laterDefendTime(scenario) !== undefined && <div className="editor-occurrence" role="group" aria-label="Defend occurrence">
      <button aria-pressed={!later} onClick={() => studio.setLaterDefend(null)}>First: after our serve</button>
      <button aria-pressed={later} onClick={() => studio.setLaterDefend(scenario)}>Later: after our attack</button>
    </div>}
    {!studio.working ? <p>Team V3 is read-only. Create a strategy to place athletes and edit routes.</p> : <fieldset className="editor-fields" disabled={s.playing}>
      {s.playing && <p role="status">Preview playing · edit handles return when paused at an event.</p>}
      <p className="editor-instruction">{desktop ? s.view === 'top' ? 'Drag the selected athlete on court, or enter metres below.' : 'Switch to Top to reposition athletes. Other views are for inspection.' : 'Drag athletes or enter metres. Fields commit on Enter or blur; Escape cancels. Scope selection alone saves no edit.'}</p>
      {studio.stage === 'Start' && <p className="strategy-warning">Start holds through service contact. Keep rotational order and P1 behind the endline on our serve; review the rule findings.</p>}
      <div className="editor-grid">
        {!desktop && athletePicker}
        {!desktop && <button disabled={later || !!event} aria-pressed={s.selected === 'target'} onClick={() => useRotations.setState({ selected: 'target' })}>Select gold target</button>}
        {!targetDisabled && (['x', 'z'] as const).map(axis => <MetreField key={`${caseKey}/${studio.scope}/${studio.stage}/${event?.id}/${later}/${s.selected}/${axis}`} axis={axis} value={point[axis]} max={axis === 'x' ? 4.5 : s.selected === 'target' || (time === scenario.secondContact.time && s.selected === scenario.secondContact.player) ? 2.99 : event && time > scenario.ball[0].start ? 9 : 12} commit={n => s.edit({ ...point, [axis]: n })} />)}
      </div>
      {targetDisabled && <p>Select an athlete to edit this occurrence; the gold ring belongs to the first set and is read-only here.</p>}
      {desktop && <>
        <p className="edit-change-summary" aria-label="Position change from Team V3">{comparison ? Math.hypot(point.x - comparison.baseline.point.x, point.z - comparison.baseline.point.z) < .005 ? 'Original position · no displacement from Team V3 at this moment' : `${Math.hypot(point.x - comparison.baseline.point.x, point.z - comparison.baseline.point.z).toFixed(2)} m from Team V3 at this moment` : 'Setter pass target · linked to the first set'}</p>
        {historyControls}
      </>}
      <CoverageEditor />
      <EditorDisclosure desktop={desktop} title="Position & movement evidence">
      <section className="editor-comparison" aria-label="Selected player comparison">
        <h3>{name(s.selected)} · {review?.eventLabel} · {time.toFixed(2)} s</h3>
        <p>Current: X {point.x.toFixed(2)}, Z {point.z.toFixed(2)} m</p>
        {comparison ? <>
          <p>Team V3 ghost: X {comparison.baseline.point.x.toFixed(2)}, Z {comparison.baseline.point.z.toFixed(2)} m · same {time.toFixed(2)} s</p>
          <p>{comparison.affectedCases.length} of 4 authored timelines changed; {comparison.caseChanges.filter(c => c.pointChanged || c.pathChanged).length} selected-player paths/points changed at this occurrence.</p>
          {path && <p>Incoming: {path.from.label} ({path.from.time.toFixed(2)} s) → {path.to.label} ({path.to.time.toFixed(2)} s). Actual interval {path.availableSeconds.toFixed(2)} s.<br />Straight line {path.straightMetres.toFixed(2)} m · sampled timeline path including bends {path.pathMetres.toFixed(2)} m.<br />Team V3 path {comparison.baseline.incoming.pathMetres.toFixed(2)} m. Teaching geometry, not measured sprint capability or a success guarantee.</p>}
          {comparison.current.releaseToEvent && <p>Service release to event: {comparison.current.releaseToEvent.from.time.toFixed(2)} → {time.toFixed(2)} s · {comparison.current.releaseToEvent.availableSeconds.toFixed(2)} s available · {comparison.current.releaseToEvent.pathMetres.toFixed(2)} m timeline path (straight {comparison.current.releaseToEvent.straightMetres.toFixed(2)} m).</p>}
        </> : <p>Gold target links the first second-contact athlete; select an athlete for a timed V3 route comparison.</p>}
      </section>
      </EditorDisclosure>
      <EditorDisclosure desktop={desktop} title="Advanced · incoming route tools">
      <div className="rotation-row">
        <button aria-pressed={studio.routeVisible} disabled={s.selected === 'target'} onClick={() => useStrategies.setState({ routeVisible: !studio.routeVisible })}>Incoming route</button>
        <button disabled={routesDisabled} onClick={() => {
          const previous = stages[stages.indexOf(studio.stage) - 1]
          const start = event ? eventRouteInterval(source, event.id, s.selected).start : later ? times.Attack : Math.max(scenario.ball[0].start, times[previous])
          const a = sampleTrack(scenario.tracks[s.selected], start), b = sampleTrack(scenario.tracks[s.selected], time)
          studio.bend(key, s.selected, [{ x: Math.max(-4.5, Math.min(4.5, (a.x + b.x) / 2 + .6)), z: (a.z + b.z) / 2 }])
          useStrategies.setState({ routeVisible: true })
        }}>{bends?.length ? 'Replace with one bend' : 'Add bend'}</button>
        <button disabled={routesDisabled} onClick={() => studio.bend(key, s.selected, [])}>Straighten</button>
      </div>
      </EditorDisclosure>
      {!desktop && historyControls}
      {!event && studio.stage === 'Set' && <div className="strategy-assist">
        <p>Animated hitter: {name(review?.animatedHitter ?? null)}; other eligible front-row hitters: {review?.actors.filter(a => a.isOtherFrontHitterOption).map(a => name(a.id)).join(', ') || 'none'}. This does not author their ball trajectories.</p>
        {review?.actors.filter(a => a.isOtherFrontHitterOption).map(a => <p key={a.id}>{name(a.id)}: {a.availabilityText}</p>)}
        <button onClick={() => studio.prepareHitters(key)}>Prepare all hitters</button>
        <p>Optional approach-ready placements for eligible front athletes. Keeps the active setter and explicit placements. Undo or Reset stage to revert.</p>
      </div>}
      <details><summary>Editing help</summary><p>Incoming routes run from the prior stage after service contact; later defence starts at our attack. Drag a bend handle to reshape the route. The faint floor marker and line show unchanged Team V3 at the same time. Coverage remains approximate responsibility, not measured reach.</p></details>
      {reset && <div role="alert" className="strategy-confirm">{reset === 'case' ? `Delete only ${caseKey} overrides and inherit shared placements?` : `Revert shared edits to R${s.rotation}, ${s.serve} serve? Exact-case edits remain.`}
        <button onClick={() => { if (reset === 'case') studio.resetCase(caseKey); else studio.resetRotation(key); setReset(null) }}>{reset === 'case' ? 'Confirm case reset' : 'Confirm rotation reset'}</button><button onClick={() => setReset(null)}>Cancel</button>
      </div>}
    </fieldset>}
    <ImpactInspector review={review} rotationKey={key} />
  </section>
}
