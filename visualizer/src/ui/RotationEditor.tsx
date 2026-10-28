import { useRef, useState } from 'react'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { exportBundle, parseBundle, validateBundle } from '../lib/rotationValidation'

export function RotationEditor() {
  const s = useRotations(), bundle = activeBundle(s)!, scenario = activeScenario(s)!
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const errors = validateBundle(bundle)
  const track = scenario.tracks[s.selected]
  const point = s.selected === 'target' ? scenario.setterTarget : track?.find((k) => k.time === s.editTime)
  const times = [...new Set(Object.values(scenario.tracks).flatMap((ks) => ks.map((k) => k.time)))].sort((a, b) => a - b)
  const download = () => {
    if (errors.length) { setMessage('Fix validation errors before exporting.'); return }
    const url = URL.createObjectURL(new Blob([exportBundle(bundle)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'rotation-studio-plan.json'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Exported local draft. Public files are unchanged.')
  }
  return <div className="rotation-editor">
    <p>Coach draft · local only. Drag in Top view, or edit metres below. Contact-frame edits keep ball endpoints linked. Export requires a valid plan.</p>
    {scenario.tactics && <p>Editing R{s.rotation} · {s.serve === 'they' ? 'They' : 'Us'} serve · Our {s.opponentAttack} · {s.firstTouch === 'harry' ? 'Harry first' : 'Normal first contact'}.</p>}
    <div className="editor-grid">
      <label>Athlete / target<select value={s.selected} onChange={(e) => useRotations.setState({ selected: e.target.value })}>
        {bundle.team.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="target">PASS HERE target</option>
      </select></label>
      <label>Keyframe<select value={s.editTime} onChange={(e) => { const time = Number(e.target.value); s.seek(time); useRotations.setState({ editTime: time }) }}>
        {times.map((time) => <option key={time} value={time}>{time}s · {scenario.phases.find((p) => p.time === time)?.label ?? 'Frame'}</option>)}
      </select></label>
      {(['x', 'z'] as const).map((axis) => <label key={axis}>{axis.toUpperCase()} (m)<input type="number" step="0.1" value={point?.[axis] ?? ''} disabled={!point} onChange={(e) => {
        if (point && e.target.value !== '') s.edit({ ...point, [axis]: Number(e.target.value) })
      }} /></label>)}
    </div>
    {!point && <p>No authored frame at this time for this athlete. Select another keyframe.</p>}
    <div className="rotation-row"><button onClick={download}>Export JSON</button><button onClick={() => input.current?.click()}>Import JSON</button><button onClick={() => { s.resetDraft(); setMessage('Published plan restored.') }}>Reset draft</button></div>
    <input ref={input} type="file" accept=".json,application/json" hidden aria-label="Import tactical JSON" onChange={async (e) => {
      const file = e.target.files?.[0]; if (!file) return
      try {
        if (file.size > 2_000_000) throw new Error('Plan file must be smaller than 2 MB.')
        const draft = parseBundle(await file.text()); s.importDraft(draft); setMessage('Imported validated local draft.')
      } catch (error) { setMessage(error instanceof Error ? error.message : String(error)) }
      e.target.value = ''
    }} />
    {errors.length > 0 && <div role="alert" className="rotation-errors">{errors.slice(0, 12).map((error, i) => <p key={i}>{error}</p>)}{errors.length > 12 && <p>+{errors.length - 12} more errors</p>}</div>}
    {message && <p role="status">{message}</p>}
  </div>
}
