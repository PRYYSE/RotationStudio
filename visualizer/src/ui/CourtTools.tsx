import { useState } from 'react'
import { useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import type { RotationView } from '../lib/rotationTypes'

export function CourtTools() {
  const s = useRotations(), studio = useStrategies(), [layers, setLayers] = useState(false)
  const views: RotationView[] = ['front', 'side', 'orbit', 'top']
  return <div className="court-tools glass">
    <nav className="desktop-camera-views desktop-only" aria-label="Quick court views">
      {(['top', 'orbit', 'front', 'side'] as RotationView[]).map(view => <button key={view} aria-pressed={s.view === view} onClick={() => useRotations.setState({ view })}>{view[0].toUpperCase() + view.slice(1)}</button>)}
    </nav>
    <label>Camera <select aria-label="Court camera view" value={s.view} onChange={e => useRotations.setState({ view: e.target.value as RotationView })}>
      {views.map(view => <option key={view} value={view}>{view[0].toUpperCase() + view.slice(1)}</option>)}
    </select></label>
    <button aria-label="Cycle camera view" onClick={() => useRotations.setState({ view: views[(views.indexOf(s.view) + 1) % views.length] })}>↻</button>
    <button aria-expanded={layers} aria-controls="court-visibility" onClick={() => setLayers(!layers)}>Visibility</button>
    {layers && <div id="court-visibility" className="court-visibility" role="group" aria-label="Court visibility">
      <div><strong>Visible layers</strong><button aria-label="Close visibility" onClick={() => setLayers(false)}>Close</button></div>
      <label><input type="checkbox" checked={s.labels} onChange={e => useRotations.setState({ labels: e.target.checked })} />Names / P numbers</label>
      <label><input type="checkbox" checked={s.strategyMode ? studio.routeVisible : s.trails} onChange={e => {
        useRotations.setState({ trails: e.target.checked }); useStrategies.setState({ routeVisible: e.target.checked })
      }} />Movement paths</label>
      <label><input type="checkbox" checked={s.receiveAreas && (!s.strategyMode || studio.coverageDisplay !== 'off')} onChange={e => {
        useRotations.setState({ receiveAreas: e.target.checked }); if (e.target.checked && studio.coverageDisplay === 'off') useStrategies.setState({ coverageDisplay: 'all' })
      }} />Coverage · approximate / coach-assigned</label>
      <label><input type="checkbox" checked={s.ballFlight} onChange={e => useRotations.setState({ ballFlight: e.target.checked })} />Ball flight path</label>
      <label><input type="checkbox" checked={s.setterTargetVisible} onChange={e => useRotations.setState({ setterTargetVisible: e.target.checked })} />Setter pass target</label>
      <label><input type="checkbox" checked={s.legalHints} onChange={e => useRotations.setState({ legalHints: e.target.checked })} />Legal-start hints · centres only, before release</label>
      <label><input type="checkbox" checked={s.v3Ghost} onChange={e => useRotations.setState({ v3Ghost: e.target.checked })} />V3 ghost · selected athlete</label>
      <p>Coverage is not measured reach. Start guides require a referee-foot check. Ghost uses unchanged Team V3 at the same time.</p>
    </div>}
  </div>
}
