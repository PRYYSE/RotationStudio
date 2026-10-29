import { useState } from 'react'
import { useStrategies } from '../state/strategyStore'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { COVERAGE_ROLES } from '../lib/strategyDraft'
import type { CoverageZone, PlayerId, RotationKey } from '../lib/strategyDraft'
import { resolveStrategyRotation } from '../lib/strategyOverlay'
import { coverageAreas, coverageZoneAt } from '../lib/coverage'
import { isFront, positionOf } from '../lib/rotationModel'
import { commitMetres } from '../lib/metreDraft'

function CoverageMetres({ label, value, min, max, commit }: { label: string; value: number; min: number; max: number; commit: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null), [invalid, setInvalid] = useState(false)
  const finish = () => {
    if (draft === null) return
    const n = commitMetres(draft, min, max)
    if (n === null) { setInvalid(true); return }
    if (n !== value) commit(n)
    setDraft(null); setInvalid(false)
  }
  return <label>{label} (m)<input type="text" inputMode="decimal" aria-label={`Coverage ${label.toLowerCase()} metres`}
    aria-invalid={invalid} value={draft ?? String(Number(value.toFixed(2)))}
    onChange={e => { setDraft(e.target.value); setInvalid(false) }} onBlur={finish}
    onKeyDown={e => {
      if (e.key === 'Enter') { e.preventDefault(); finish() }
      if (e.key === 'Escape') { e.preventDefault(); setDraft(null); setInvalid(false) }
    }} />{invalid && <span role="alert">Enter {min} to {max} m. Escape cancels.</span>}</label>
}

export function CoverageEditor() {
  const studio = useStrategies(), s = useRotations(), scenario = activeScenario(s)!, team = activeBundle(s)!.team
  const id = s.selected as PlayerId, key = `${s.rotation}/${s.serve}` as RotationKey
  const player = team.players.find(p => p.id === id)
  const changes = studio.working ? resolveStrategyRotation(studio.working, scenario) : undefined
  const zone = coverageZoneAt(changes, scenario, s.time, id)
  const approximate = coverageAreas(team, scenario, s.time, true).find(a => a.player === id)
  const own = studio.scope ? studio.working?.caseOverrides?.[studio.scope] : studio.working?.overrides[key]
  const ownZone = studio.event ? own?.eventOverrides?.[studio.event.id]?.coverage?.[id] : studio.laterDefend ? own?.laterDefend?.coverage?.[id] : own?.coverage?.[studio.stage]?.[id]
  const set = (patch: Partial<CoverageZone>) => studio.setCoverage(key, id, {
    ...(zone ?? { role: 'custom', radiusX: approximate?.radiusX ?? 1, radiusZ: approximate?.radiusZ ?? 1 }), ...patch
  })
  return <details className="coverage-editor">
    <summary>Coverage responsibility{player ? ` · ${player.name}` : ''}</summary>
    <p>Coach-assigned area, not measured reach. Width/depth are full ellipse spans; offsets are relative to this athlete at this stage and case. At court edges the centre is clamped to keep the full ellipse on our 9×9 m floor.</p>
    <div className="rotation-row" role="group" aria-label="Coverage display">{(['all', 'selected', 'off'] as const).map(mode => <button key={mode}
      aria-pressed={(s.receiveAreas ? studio.coverageDisplay : 'off') === mode} onClick={() => {
        useRotations.setState({ receiveAreas: mode !== 'off' }); useStrategies.setState({ coverageDisplay: mode })
      }}>{mode === 'all' ? 'All areas' : mode === 'selected' ? 'Selected area' : 'Areas off'}</button>)}</div>
    {!player ? <p>Select an athlete above to author coverage.</p> : <>
      <label className="coverage-toggle"><input type="checkbox" checked={!studio.coverageHidden.includes(id)} onChange={e => useStrategies.setState({ coverageHidden: e.target.checked ? studio.coverageHidden.filter(p => p !== id) : [...studio.coverageHidden, id] })} /> Show {player.name}'s area</label>
      <p>{studio.scope ? 'Only this exact case' : 'Shared across all 4 cases'} · {studio.event ? `${studio.event.id} · ${s.time.toFixed(2)} s` : studio.laterDefend ? 'Later: after our attack' : studio.stage}{zone ? ownZone ? ' · authored here' : ' · inherited' : ' · approximate V3 area'}</p>
      <label>Area role<select aria-label="Coverage role" value={zone?.role ?? ''} onChange={e => set({ role: e.target.value as CoverageZone['role'] })}>
        <option value="" disabled>Choose responsibility to author</option>
        {COVERAGE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
      </select></label>
      {zone && <div className="editor-grid" key={`${id}/${studio.scope}/${studio.stage}/${studio.event?.id}/${studio.laterDefend}`}>
        <CoverageMetres label="Width" value={zone.radiusX * 2} min={.2} max={9} commit={n => set({ radiusX: n / 2 })} />
        <CoverageMetres label="Depth" value={zone.radiusZ * 2} min={.2} max={9} commit={n => set({ radiusZ: n / 2 })} />
        <CoverageMetres label="X offset" value={zone.offsetX ?? 0} min={-4.5} max={4.5} commit={n => set({ offsetX: n })} />
        <CoverageMetres label="Z offset" value={zone.offsetZ ?? 0} min={-4.5} max={4.5} commit={n => set({ offsetZ: n })} />
      </div>}
      {zone?.role === 'block' && !isFront(positionOf(team, s.rotation, id)) && <p role="alert" className="strategy-warning">REVIEW: {player.name} is back-row. A block responsibility needs coaching review; this does not change existing contact, ball or track roles.</p>}
      <p>Choose a role to start from the displayed approximate dimensions. Then edit metres or drag the two diamond radius handles. One field edit or drag is one Undo.</p>
      <div className="rotation-row"><button disabled={!ownZone} onClick={() => studio.resetCoverage(key, id)}>Reset coverage</button>
        <button disabled={!studio.past.length || !!studio.gesture} onClick={studio.undo}>Undo coverage edit</button></div>
      <p>Reset removes this athlete's coverage in the current scope/occurrence and restores inherited or approximate coverage.</p>
    </>}
  </details>
}
