import { activeBundle, useRotations } from '../state/rotationStore'
import { SAMPLE_X, SAMPLE_Z } from '../lib/receiveExample'

export function FirstBallExamples() {
  const s = useRotations(), bundle = activeBundle(s)!
  return <fieldset className="first-ball-examples" disabled={s.editor}>
    <legend>First-ball example</legend>
    <button aria-pressed={!s.example} onClick={() => s.chooseExample(null)}>Authored (default)</button>
    <div className="first-ball-grid" role="group" aria-label="First-ball landing location">
      {SAMPLE_Z.map((z, row) => SAMPLE_X.map((x, col) => <button key={`${x}/${z}`}
        aria-label={`${['Short', 'Mid', 'Deep'][row]} ${['left', 'centre', 'right'][col]}, x ${x}, z ${z} metres`}
        aria-pressed={s.example?.x === x && s.example?.z === z}
        onClick={() => s.chooseExample({ x, z, receiver: s.example?.receiver ?? 'auto' })}>
        {['Short', 'Mid', 'Deep'][row]} {['L', 'C', 'R'][col]}
      </button>))}
    </div>
    <label className="example-receiver">Receiver<select aria-label="First-ball receiver" disabled={!s.example}
      value={s.example?.receiver ?? 'auto'} onChange={(e) => { if (s.example) s.chooseExample({ ...s.example, receiver: e.target.value }) }}>
      <option value="auto">Auto (best reachable)</option>
      {bundle.team.players.map((p) => <option key={p.id} value={p.id} disabled={s.firstTouch === 'harry' ? p.id !== 'harry' : p.id === 'harry'}>{p.name}</option>)}
    </select></label>
    <p>{s.serve === 'us' ? 'Opposing attack dig · from defensive ready.' : 'Incoming serve · from legal starts.'} {s.firstTouch === 'harry' ? 'Harry only; authored backup sets.' : 'Normal excludes Harry.'}</p>
    <p>Short / mid / deep: z 3.5 / 5.8 / 8m. L / C / R: x −3 / 0 / +3m. Reach and spacing are teaching heuristics; skills are relative preferences, not measured speeds.</p>
    {s.editor && <p>Leave Coach draft to choose a teaching sample.</p>}
  </fieldset>
}
