import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PlayerId } from '../lib/strategyDraft'
import type { TeamReferenceData } from '../lib/teamReference'
import { referencePath } from '../lib/teamReference'
import type { Scenario } from '../lib/rotationTypes'

type Props = { data: TeamReferenceData; scenario: Scenario; name: string; author: string; revision: string; onClose: () => void }
const sx = (x: number) => 300 + x * 42
const sy = (z: number) => 75 + z * 42
function Court({ stage, path }: { stage: TeamReferenceData['stages'][number]; path: { x: number; z: number }[] }) {
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
    return () => { document.removeEventListener('keydown', onKey); if (root) root.inert = wasInert ?? false; previous?.focus() }
  }, [onClose])
  const stages = data.stages
  return createPortal(<div ref={host} className="team-reference" role="dialog" aria-modal="true" aria-labelledby="reference-title">
    <nav className="reference-actions" aria-label="Team reference actions">
      <button onClick={onClose}>Close reference</button><button onClick={() => window.print()}>Print team reference</button>
      <label>Incoming path<select aria-label="Reference path" value={player} onChange={e => setPlayer(e.target.value as PlayerId | '')}>
        <option value="">No path</option>{stages[0].actors.map(a => <option value={a.id} key={a.id}>{a.name} · P{a.number}</option>)}
      </select></label>
    </nav>
    <article className="reference-document">
      <header><h1 id="reference-title">Team reference · R{data.rotation} · {data.serve === 'us' ? 'Us' : 'They'} serve</h1>
        <p className="reference-draft">{data.status}</p><p>{name} · {author} · Source revision {revision}</p>
        <p>Case: {data.caseKey ?? 'Not authored'}{data.teachingOnly ? ' · TEACHING EXAMPLE; not an authored match plan' : ' · Authored example with current local edits'}</p>
        <p>Read-only snapshot of this rotation. Dots are real court positions. P numbers are rotational roster positions, not shirt numbers. X: court left/right, 0 centre; Z: metres back from net. Source timing and contacts are unchanged.</p>
      </header>
      {stages.map((stage, index) => {
        const path = player ? referencePath(scenario.tracks[player], index ? stages[index - 1].time : stage.time, stage.time) : []
        return <section key={stage.stage} className="team-reference-stage" aria-label={`${stage.stage} reference`}>
          <div className="reference-formation"><h2>{stage.stage} · {stage.eventLabel} · {stage.time.toFixed(2)}s</h2>
            <p className="reference-draft">{data.status}</p><p>{stage.cue}</p>
            <Court stage={stage} path={path} />
            <p>{stage.stage === 'Start' ? 'Start/service formation; hold rotational order until service contact.' : stage.pathFrom && player ? `Dashed incoming path: ${stages[0].actors.find(a => a.id === player)?.name}, ${stage.pathFrom} → ${stage.stage}.` : 'No incoming path selected.'}</p>
          </div>
          <p><strong>Team note:</strong> {stage.teamNote || 'Needs coaching note.'}</p>
          <ul className="reference-roster">{stage.actors.map(a => <li key={a.id}>
            <strong>{a.name} · P{a.number}</strong> · {a.role} · X {a.point.x.toFixed(2)}, Z {a.point.z.toFixed(2)} m
            {a.notes && Object.entries(a.notes).map(([field, note]) => <p key={field}><strong>{{ primary: 'Primary', ifDifferent: 'If different', fallback: 'Fallback', teamCall: 'Team call' }[field]}:</strong> {note}</p>)}
          </li>)}</ul>
        </section>
      })}
    </article>
  </div>, document.body)
}
