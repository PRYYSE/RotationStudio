import { lazy, Suspense, useState } from 'react'
import { initialWorkspace, type Workspace } from './lib/courtMode'
import { useRotations } from './state/rotationStore'
import { useStrategySimulation } from './state/useStrategySimulation'
import { useStrategies } from './state/strategyStore'
const CourtMode = lazy(() => import('./court/CourtMode').then(m => ({ default: m.CourtMode })))
const StudioApp = lazy(() => import('./StudioApp').then(m => ({ default: m.StudioApp })))
export function App() {
  useStrategySimulation()
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    let saved = null; try { saved = localStorage.getItem('rotation-workspace-v1') } catch { /* optional preference */ }
    if (location.hash.startsWith('#court-review=')) return 'court'
    return initialWorkspace(location.search, saved, navigator.userAgent, navigator.maxTouchPoints)
  })
  const switchTo = (next: Workspace) => {
    const s = useRotations.getState()
    s.stopShuffle(); s.pause()
    if (next === 'court') {
      useStrategies.setState({ editing: false })
      useRotations.setState({ editor: false, strategyMode: false, strategyEdit: null })
    }
    try { localStorage.setItem('rotation-workspace-v1', next) } catch { /* workspace still switches */ }
    const url = new URL(location.href); url.searchParams.set('workspace', next)
    history.replaceState(null, '', url); setWorkspace(next)
  }
  return <Suspense fallback={<div role="status" style={{padding:32}}>Opening RotationStudio…</div>}>
    {workspace === 'court' ? <CourtMode onStudio={() => switchTo('studio')} /> : <StudioApp onCourt={() => switchTo('court')} />}
  </Suspense>
}
