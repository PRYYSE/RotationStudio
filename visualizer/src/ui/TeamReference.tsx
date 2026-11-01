import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PlayerId } from '../lib/strategyDraft'
import type { TeamReferenceData } from '../lib/teamReference'
import { referencePath } from '../lib/teamReference'
import { sampleTrack } from '../lib/rotationModel'
import type { Scenario } from '../lib/rotationTypes'

type Props = { data: TeamReferenceData; scenario: Scenario; name: string; author: string; revision: string; onClose: () => void }
const sx = (x: number) => 300 + x * 42
const sy = (z: number) => 75 + z * 42
type Stage = Omit<TeamReferenceData['stages'][number], 'stage' | 'pathFrom'> & { stage: string; pathFrom: string | null }
const noteLabels = { primary: 'Primary', ifDifferent: 'If different', fallback: 'Fallback', teamCall: 'Team call' }

// Keep every supplied stage. Additional authored phases (including later digs)
// are read-only samples of this same scenario, never a second tactical source.
export function referenceSnapshots(data: TeamReferenceData, scenario: Scenario): Stage[] {
  const stages: Stage[] = [...data.stages]
  for (const phase of scenario.phases) {
    if (stages.some(s => Math.abs(s.time - phase.time) < .001)) continue
    stages.push({ stage: phase.label, time: phase.time, eventLabel: phase.label, cue: phase.cue,
      teamNote: null, path: [], pathFrom: null, setterTarget: { ...scenario.setterTarget },
      actors: data.stages[0].actors.map(a => {
        const p = sampleTrack(scenario.tracks[a.id], phase.time)
        return { ...a, point: { x: p.x, z: p.z }, role: p.role, notes: null }
      }) })
  }
  return stages.sort((a, b) => a.time - b.time).map((s, i, all) => ({ ...s, pathFrom: all[i - 1]?.stage ?? null }))
}

export function MiniCourt({ stage, path, player }: { stage: Stage; path: { x: number; z: number }[]; player: PlayerId | '' }) {
  const x = (v: number) => 150 + v * 24, y = (v: number) => 36 + v * 24
  const actors = stage.actors.map(a => ({ ...a, x: x(a.point.x), y: y(a.point.z) }))
  const close = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < 28
  const crowded = actors.filter(a => actors.some(b => a.id !== b.id && close(a, b)))
  const occupied = actors.filter(a => !crowded.includes(a)).map(a => ({ x: a.x, y: a.y }))
  const labels = actors.map(a => {
    if (!crowded.includes(a)) return { ...a, label: { x: a.x, y: a.y }, linked: false }
    // Only the label moves. A small dot and solid leader retain the exact
    // authored position when two P-number badges would otherwise overlap.
    const candidates = [0, -28, 28, -56, 56].flatMap(dx => [0, -28, 28, -56, 56].map(dy => ({ x: a.x + dx, y: a.y + dy })))
      .sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))
    const label = candidates.find(p => p.x >= 16 && p.x <= 284 && p.y >= 52 && !actors.some(b => close(p, b)) && !occupied.some(b => close(p, b))) ?? { x: a.x + 84, y: a.y }
    occupied.push(label)
    return { ...a, label, linked: true }
  })
  // Preserve positions, including local edits near boundaries or in service
  // space. Expand the drawing rather than clamping a marker or cropping a path.
  const points = [...stage.actors.map(a => ({ x: x(a.point.x), y: y(a.point.z) })), ...path.map(p => ({ x: x(p.x), y: y(p.z) })), ...labels.map(a => a.label)]
  const left = Math.min(0, ...points.map(p => p.x - 17)), right = Math.max(300, ...points.map(p => p.x + 17))
  const top = Math.min(0, ...points.map(p => p.y - 17)), bottom = Math.max(324, ...points.map(p => p.y + 36))
  const focus = stage.actors.find(a => a.id === player)
  return <svg className="reference-mini-court" viewBox={`${left} ${top} ${right - left} ${bottom - top}`} role="img" aria-label={`${stage.stage}: six player positions; net above, our endline below${focus ? `; dashed incoming path for ${focus.name}` : ''}`}>
    <title>{stage.actors.map(a => `P${a.number} ${a.name}: ${a.role}`).join('; ')}</title>
    <rect x="42" y="252" width="216" height={bottom - 276} fill="#f7f7f7" stroke="#73808a" strokeDasharray="3 3" />
    <rect x="42" y="36" width="216" height="216" fill="#eef7fc" stroke="#264058" strokeWidth="2" />
    <line x1="42" x2="258" y1="108" y2="108" stroke="#73808a" />
    <line x1="36" x2="264" y1="36" y2="36" stroke="#172d43" strokeWidth="4" />
    <text x="150" y="20" textAnchor="middle">NET ↑</text>
    <text x="150" y={bottom - 6} textAnchor="middle">OUR ENDLINE ↓</text>
    {path.length > 1 && <polyline data-incoming-player={player} points={path.map(p => `${x(p.x)},${y(p.z)}`).join(' ')} fill="none" stroke="#172d43" strokeWidth="2.5" strokeDasharray="5 3" />}
    {labels.map(a => <g key={a.id} data-reference-player={a.id} data-x={a.point.x} data-z={a.point.z} data-focused={a.id === player}>
      <title>{`${a.name} · P${a.number} · ${a.role}`}</title>
      {a.linked && <line x1={a.x} y1={a.y} x2={a.label.x} y2={a.label.y} stroke="#172d43" />}
      <circle data-position-anchor="true" cx={a.x} cy={a.y} r={a.linked ? 4 : 12} fill={a.color} stroke="#172d43" strokeWidth="1.5" />
      {a.id === player && <circle cx={a.label.x} cy={a.label.y} r="15" fill="white" stroke="#172d43" strokeWidth="2" />}
      <circle cx={a.label.x} cy={a.label.y} r="12" fill={a.color} stroke="#172d43" strokeWidth="1.5" />
      <text x={a.label.x} y={a.label.y + 5} textAnchor="middle" className="reference-mini-number">P{a.number}</text>
    </g>)}
  </svg>
}
function Court({ stage, path }: { stage: Stage; path: { x: number; z: number }[] }) {
  const occupied: { x: number; y: number }[] = []
  const labels = stage.actors.map(a => {
    const x = sx(a.point.x), y = sy(a.point.z)
    const candidates = [14, -36, 38, -60, 62, -84].flatMap(dy => [12, -112].map(dx => ({ x: Math.max(4, Math.min(496, x + dx)), y: Math.max(48, Math.min(628, y + dy)) })))
    const label = candidates.find(p => !occupied.some(q => Math.abs(p.x - q.x) < 104 && Math.abs(p.y - q.y) < 24)) ?? candidates[0]
    occupied.push(label)
    return { ...a, label, x, y }
  })
  return <svg className="reference-court" viewBox="0 0 600 660" role="img" aria-label={`${stage.stage}: actual court positions, names and P numbers`}>
    <title>{stage.stage} · {stage.eventLabel} · {stage.time.toFixed(2)} seconds</title>
    <rect x="111" y="75" width="378" height="378" fill="#eef7fc" stroke="#264058" strokeWidth="2" />
    <line x1="111" x2="489" y1="201" y2="201" stroke="#74889b" />
    <line x1="101" x2="499" y1="75" y2="75" stroke="#172d43" strokeWidth="5" />
    <text x="300" y="33" textAnchor="middle">NET · looking toward opponents</text>
    <text x="300" y="475" textAnchor="middle" fontSize="12">OUR ENDLINE · service area below</text>
    {path.length > 1 && <polyline points={path.map(p => `${sx(p.x)},${sy(p.z)}`).join(' ')} fill="none" stroke="#324c91" strokeWidth="3" strokeDasharray="7 4" />}
    {stage.stage === 'Set' && <circle cx={sx(stage.setterTarget.x)} cy={sy(stage.setterTarget.z)} r="14" fill="none" stroke="#9c7000" strokeWidth="3"><title>Actual setter target</title></circle>}
    {labels.map(a => <g key={a.id} data-reference-player={a.id} data-x={a.point.x} data-z={a.point.z}>
      <line x1={a.x} y1={a.y} x2={a.label.x + 50} y2={a.label.y + 11} stroke="#657789" />
      <circle cx={a.x} cy={a.y} r="9" fill={a.color} stroke="#172d43" strokeWidth="2" />
      <rect x={a.label.x} y={a.label.y} width="100" height="22" rx="4" fill="white" stroke="#657789" />
      <text x={a.label.x + 50} y={a.label.y + 15} textAnchor="middle" fontSize="14">{a.name} · P{a.number}</text>
    </g>)}
  </svg>
}
export function TeamReference({ data, scenario, name, author, revision, onClose }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [player, setPlayer] = useState<PlayerId | ''>(data.selectedPlayer ?? '')
  const [view, setView] = useState<'quick' | 'full'>('quick')
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, root = document.getElementById('root'), wasInert = root?.inert
    if (root) root.inert = true
    host.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key !== 'Tab') return
      const controls = host.current?.querySelectorAll<HTMLElement>('button,select')
      if (!controls?.length) return
      const first = controls[0], last = controls[controls.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (root) root.inert = wasInert ?? false
      // The library can replace the launching button while capturing its
      // snapshot. Restore to its equivalent control if that node was detached.
      const restore = previous?.isConnected ? previous : [...(root?.querySelectorAll<HTMLElement>('button,select') ?? [])]
        .find(e => e.tagName === previous?.tagName && e.textContent === previous?.textContent && e.getAttribute('aria-label') === previous?.getAttribute('aria-label'))
      restore?.focus()
    }
  }, [onClose])
  const stages = referenceSnapshots(data, scenario)
  const focus = stages[0].actors.find(a => a.id === player)
  return createPortal(<div ref={host} className={`team-reference reference-${view}`} role="dialog" aria-modal="true" aria-labelledby="reference-title">
    <nav className="reference-actions" aria-label="Team reference actions">
      <button onClick={onClose}>Close reference</button><button onClick={() => window.print()}>Print team reference</button>
      <div className="reference-view-switch" role="group" aria-label="Reference view">
        <button aria-pressed={view === 'quick'} onClick={() => setView('quick')}>Quick guide</button>
        <button aria-pressed={view === 'full'} onClick={() => setView('full')}>Full detail</button>
      </div>
      <label>Focus player<select value={player} onChange={e => setPlayer(e.target.value as PlayerId | '')}>
        <option value="">Whole team</option>{stages[0].actors.map(a => <option value={a.id} key={a.id}>{a.name} · P{a.number}</option>)}
      </select></label>
    </nav>
    <article className="reference-document">
      <header><h1 id="reference-title">Team reference · R{data.rotation} · {data.serve === 'us' ? 'Us' : 'They'} serve</h1>
        <p>{scenario.tactics ? `Their attack our ${scenario.tactics.opponentAttack} · ${scenario.tactics.firstTouch === 'harry' ? 'Harry first' : 'Normal'}` : 'Attack / first-contact variant not specified'}</p>
        <p>{name} · {author}</p><p className="reference-draft">{data.status}</p>
        {data.teachingOnly && <p>Teaching example · not an authored match plan</p>}
        {view === 'full' && <><p>Source revision {revision}</p>
        <p>Case: {data.caseKey ?? 'Not authored'}{data.teachingOnly ? ' · TEACHING EXAMPLE; not an authored match plan' : ' · Authored example with current local edits'}</p>
        <p>Read-only snapshot of this rotation. Dots are real court positions. P numbers are rotational roster positions, not shirt numbers. X: court left/right, 0 centre; Z: metres back from net. Source timing and contacts are unchanged.</p>
        </>}
      </header>
      {view === 'quick' && <>
        <ul className="reference-legend" aria-label="Player identity and rotational P numbers">{stages[0].actors.map(a => <li key={a.id} data-focused={a.id === player}>
          <span style={{ backgroundColor: a.color }}>P{a.number}</span><strong>{a.name}</strong>
        </li>)}</ul>
        <p className="reference-reading">NET ↑ · our endline ↓ · looking toward opponents. P numbers are rotational positions, not shirts. Linked labels separate close players; dots keep real positions. {focus ? `${focus.name} in focus; dashed lines show the incoming path from the previous snapshot.` : 'Whole team; choose a focus player for their incoming path and notes.'}</p>
        <div className="reference-quick-stages">{stages.map((stage, index) => {
          const actor = stage.actors.find(a => a.id === player)
          const path = player && index ? referencePath(scenario.tracks[player], stages[index - 1].time, stage.time) : []
          const notes = actor?.notes && Object.entries(actor.notes).filter(([, note]) => note?.trim())
          return <section key={`${stage.stage}-${stage.time}`} className="reference-quick-stage" aria-label={`${stage.stage} reference`} data-time={stage.time}>
            <h2>{stage.stage}<span>+{(stage.time - stages[0].time).toFixed(2)}s</span></h2>
            {stage.eventLabel !== stage.stage && <p className="reference-event">{stage.eventLabel}</p>}
            <div className="reference-quick-body"><MiniCourt stage={stage} path={path} player={player} />
            <div>{actor ? <div className="reference-player-note"><p><strong>{actor.name} · P{actor.number}</strong> — {actor.role}</p>
              {notes?.length ? notes.map(([field, note]) => <p key={field}><strong>{noteLabels[field as keyof typeof noteLabels]}:</strong> {note}</p>) : <p>No specific player note authored</p>}
            </div> : <ul className="reference-quick-roles" aria-label="Player responsibilities">{stage.actors.map(a => <li key={a.id}><strong>P{a.number}</strong> {a.role}</li>)}</ul>}
            {(stage.teamNote || stage.cue) && <p className="reference-quick-cue" title={stage.teamNote || stage.cue}><strong>{stage.teamNote ? 'Team' : 'Cue'}:</strong> {stage.teamNote || stage.cue}</p>}
            </div></div>
          </section>
        })}</div>
      </>}
      {view === 'full' && <>
      {stages.map((stage, index) => {
        const path = player ? referencePath(scenario.tracks[player], index ? stages[index - 1].time : stage.time, stage.time) : []
        return <section key={`${stage.stage}-${stage.time}`} className="team-reference-stage" aria-label={`${stage.stage} reference`}>
          <div className="reference-formation"><h2>{stage.stage} · {stage.eventLabel} · {stage.time.toFixed(2)}s</h2>
            <p className="reference-draft">{data.status}</p><p>{stage.cue}</p>
            <Court stage={stage} path={path} />
            <p>{stage.stage === 'Start' ? 'Start/service formation; hold rotational order until service contact.' : stage.pathFrom && player ? `Dashed incoming path: ${stages[0].actors.find(a => a.id === player)?.name}, ${stage.pathFrom} → ${stage.stage}.` : 'No incoming path selected.'}</p>
          </div>
          <p><strong>Team note:</strong> {stage.teamNote || 'Needs coaching note.'}</p>
          <ul className="reference-roster">{stage.actors.map(a => <li key={a.id}>
            <strong>{a.name} · P{a.number}</strong> · {a.role} · X {a.point.x.toFixed(2)}, Z {a.point.z.toFixed(2)} m
            {a.notes && Object.entries(a.notes).map(([field, note]) => <p key={field}><strong>{noteLabels[field as keyof typeof noteLabels]}:</strong> {note}</p>)}
          </li>)}</ul>
        </section>
      })}
      </>}
    </article>
  </div>, document.body)
}
