import { useState } from 'react'
import type { Spot } from '../lib/rotationTypes.ts'
import type { CoverageZone } from '../lib/strategyDraft.ts'
import type { CoverageArea } from '../lib/coverage.ts'
import { MAX_COVERAGE_VERTICES, addPolygonCorner, coveragePolygonError, hexagonFromEllipse } from '../lib/coveragePolygon.ts'

type Props = { zone: CoverageZone | undefined; area: CoverageArea | undefined; onCommit: (next: CoverageZone) => void }

export function CoveragePolygonEditor({ zone, area, onCommit }: Props) {
  const [error, setError] = useState('')
  if (!area) return null
  const basis: CoverageZone = zone ?? { role: 'custom', radiusX: Math.max(.1, area.radiusX), radiusZ: Math.max(.1, area.radiusZ) }
  const vertices = zone?.vertices
  const apply = (points: Spot[]) => {
    const problem = coveragePolygonError(points)
    if (problem) { setError(problem); return }
    setError('')
    onCommit({ ...basis, vertices: points })
  }
  const edit = (index: number, axis: 'x' | 'z', raw: string) => {
    if (!vertices || raw.trim() === '') { setError('Enter a coordinate in metres.'); return }
    const n = Number(raw)
    if (!Number.isFinite(n)) { setError('Enter a finite number in metres.'); return }
    const next = vertices.map((v, i) => i === index ? { ...v, [axis]: n } : { ...v })
    apply(next)
  }
  return <section className="coverage-polygon-editor" aria-label="Freeform coverage boundary">
    {!vertices ? <div className="rotation-row">
      <button type="button" onClick={() => apply(hexagonFromEllipse(area.center, area.radiusX, area.radiusZ))}>Edit as 6-corner zone</button>
      <span>Or keep the existing ellipse.</span>
    </div> : <>
      <p>Each corner moves independently. The boundary stays at these court positions for this moment, even when the athlete moves.</p>
      <div className="rotation-row">
        <button type="button" disabled={vertices.length >= MAX_COVERAGE_VERTICES} onClick={() => apply(addPolygonCorner(vertices))}>Add corner</button>
        <button type="button" onClick={() => { const { vertices: _removed, ...ellipse } = basis; onCommit(ellipse); setError('') }}>Use ellipse</button>
      </div>
      <details className="coverage-corner-details">
        <summary>Corner coordinates ({vertices.length})</summary>
        <p>X is sideways from court centre; Z is distance from the net, both in metres.</p>
        <div className="coverage-corner-list">
          {vertices.map((point, index) => <div className="coverage-corner-row" key={index}>
            <span>Corner {index + 1}</span>
            {(['x', 'z'] as const).map(axis => <label key={axis}>{axis.toUpperCase()}
              <input key={`${index}-${axis}-${point[axis]}`} aria-label={`Corner ${index + 1} ${axis.toUpperCase()} metres`} type="number" step="0.01" min={axis === 'x' ? -4.5 : 0} max={axis === 'x' ? 4.5 : 9}
                defaultValue={point[axis]} onBlur={e => { if (e.target.value !== String(point[axis])) edit(index, axis, e.target.value) }}
                onKeyDown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }} />
            </label>)}
            <button type="button" aria-label={`Remove corner ${index + 1}`} disabled={vertices.length <= 3} onClick={() => apply(vertices.filter((_, i) => i !== index))}>Remove</button>
          </div>)}
        </div>
      </details>
    </>}
    {error && <p role="alert" className="strategy-warning">{error}</p>}
  </section>
}
