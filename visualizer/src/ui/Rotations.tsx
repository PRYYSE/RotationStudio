import { useEffect, useState } from 'react'
import { RotationScene } from '../three/RotationScene'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { loadBundle } from '../lib/rotationValidation'
import { phaseAt, rotationLink } from '../lib/rotationModel'
import { RotationEditor } from './RotationEditor'
import { FirstBallExamples } from './FirstBallExamples'
import type { RotationView } from '../lib/rotationTypes'
import { selectedEvent, stageOrder, stageTimes } from '../lib/strategyDraft'
import { useStrategyStudio } from './useStrategyStudio'
import { StrategyLibrary } from './StrategyLibrary'
import { StrategyEditor } from './StrategyEditor'
import { useStrategies } from '../state/strategyStore'

export function Rotations() {
  const s = useRotations(), bundle = activeBundle(s), scenario = activeScenario(s)
  const { studio, warnings } = useStrategyStudio()
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [settings, setSettings] = useState(false)
  const [share, setShare] = useState('')
  const load = () => {
    useRotations.setState({ loading: true, error: '' })
    loadBundle(import.meta.env.BASE_URL).then((bundle) => useRotations.getState().setBundle(bundle))
      .catch((error) => useRotations.setState({ loading: false, error: error.message }))
  }
  useEffect(() => {
    if (!useRotations.getState().published) load()
    return () => { useRotations.setState({ playing: false }) }
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(tag) || (e.target as HTMLElement)?.isContentEditable) return
      if (e.code === 'Space' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); useRotations.getState().toggle() }
      if (e.shiftKey && ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        e.preventDefault(); useRotations.setState({ view: (['front', 'side', 'orbit', 'top'] as RotationView[])[Number(e.code.slice(-1)) - 1] })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!bundle || !scenario) return <div className="rotation-loading" role="status">
    {s.loading ? 'Loading training demo…' : <><p role="alert">{s.error}</p><button onClick={load}>Retry plans</button></>}
  </div>
  const phase = phaseAt(scenario, s.time)
  const status = bundle.plans.status
  const demo = status === 'TRAINING DEMO / UNAPPROVED'
  const unavailable = s.exampleResult?.ok === false
  const hasAlternates = !!bundle.plans.scenarios.find((p) => p.rotation === s.rotation && p.serve === s.serve)?.alternates
  const jump = (time: number) => { s.seek(time); useRotations.setState({ editTime: time }) }
  const times = stageTimes(scenario)
  const selected = selectedEvent(scenario, s.time)
  const panel = studio.editing || libraryOpen
  return <main className={`rotations ${panel ? 'strategy-open' : ''} ${studio.editing ? 'strategy-editing' : ''}`} aria-label="Rotation studio">
    <div className="rotation-canvas"><RotationScene /></div>
    <div className="rotation-top">
      {!studio.editing && <nav className="rotation-phases glass" aria-label="Tactical phase">
        {(['Receive', 'Attack', 'Defend'] as const).map((section) => <button key={section} aria-pressed={selected === section} onClick={() => jump(times[section])}>{section}</button>)}
      </nav>}
      <nav className="rotation-row glass" aria-label="Strategy mode">
        <button aria-pressed={!studio.editing && !libraryOpen} onClick={() => { useStrategies.setState({ editing: false }); s.setEditor(false); setLibraryOpen(false) }}>View</button>
        <button aria-pressed={studio.editing} onClick={() => {
          if (!studio.working) studio.newStrategy(false, s.published ?? undefined)
          useStrategies.setState({ editing: true }); s.setEditor(true); setSettings(false); setLibraryOpen(false)
        }}>Edit strategy</button>
        <button aria-pressed={libraryOpen && !studio.editing} aria-expanded={libraryOpen && !studio.editing} onClick={() => { if (studio.editing) { useStrategies.setState({ editing: false }); s.setEditor(false) } setLibraryOpen(!libraryOpen) }}>Strategies</button>
      </nav>
      <div className="rotation-selectors glass">
        <nav className="rotation-row rotation-numbers" aria-label="Rotation">
          {[1, 2, 3, 4, 5, 6].map((r) => <button key={r} aria-pressed={r === s.rotation} onClick={() => s.choose(r, s.serve)}>R{r}</button>)}
        </nav>
        <div className="rotation-row serve-row" role="group" aria-label="Serve ownership">
          <button aria-pressed={s.serve === 'they'} onClick={() => s.choose(s.rotation, 'they')}>They serve</button><button aria-pressed={s.serve === 'us'} onClick={() => s.choose(s.rotation, 'us')}>Us serve</button>
          <span className="demo-tag">{demo ? 'DEMO ONLY' : status}</span>
        </div>
      </div>
    </div>
    {panel && <aside className="strategy-panel glass" aria-label="Strategy studio controls">
      <StrategyLibrary compact={studio.editing} />
      {studio.editing && <StrategyEditor warnings={warnings} />}
      {!studio.editing && studio.working && <p className="strategy-warning">Foundation needs tactical review. View plays the V3 timing template with your foundation edits.</p>}
    </aside>}
    {!studio.editing && <div className="rotation-bottom">
      <div className="rotation-cue">
        {studio.working && <span className="rotation-coach-note">Foundation needs tactical review · {studio.saved ? 'Saved locally' : studio.preview ? 'Preview · Save a copy' : 'Unsaved'}</span>}
        {s.example && s.exampleResult && <span className="rotation-coach-note" role="status">{s.exampleResult.ok
          ? `Teaching sample · ${s.exampleResult.message}`
          : `${s.exampleResult.message} Showing ${s.exampleScenario ? 'previous valid example' : 'authored example'}; playback paused.`}</span>}
        <strong>{unavailable ? 'Sample unavailable' : phase.label}</strong>{!unavailable && <span>{phase.cue}</span>}
        {!unavailable && s.firstTouch === 'harry' && scenario.tactics && <span className="rotation-coach-note">{scenario.tactics.coachNote}</span>}
      </div>
      {settings && <section className="rotation-settings glass" aria-label="Rotation settings">
        <div className="settings-heading"><strong>View & draft</strong><button aria-label="Close settings" onClick={() => setSettings(false)}>Close</button></div>
        <div className="settings-scroll">
          {hasAlternates && <>
            <div className="rotation-row tactics-row" role="group" aria-label="Their attack"><span>Their attack:</span>
              <button aria-pressed={s.opponentAttack === 'left'} onClick={() => s.chooseTactics('left', s.firstTouch)}>Our left</button>
              <button aria-pressed={s.opponentAttack === 'right'} onClick={() => s.chooseTactics('right', s.firstTouch)}>Our right</button>
            </div>
            <div className="rotation-row tactics-row" role="group" aria-label="First contact"><span>First contact:</span>
              <button aria-pressed={s.firstTouch === 'normal'} onClick={() => s.chooseTactics(s.opponentAttack, 'normal')}>Normal</button>
              <button aria-pressed={s.firstTouch === 'harry'} onClick={() => s.chooseTactics(s.opponentAttack, 'harry')}>Harry first</button>
            </div>
          </>}
          {hasAlternates && <FirstBallExamples />}
          {s.exampleNotice && <p className="example-notice" role="status">{s.exampleNotice}</p>}
          <nav className="rotation-row" aria-label="Camera view">{(['front', 'side', 'orbit', 'top'] as RotationView[]).map((view) => <button key={view} aria-pressed={s.view === view} onClick={() => useRotations.setState({ view })}>{view[0].toUpperCase() + view.slice(1)}</button>)}</nav>
          <div className="rotation-row options-row">
            <label><input type="checkbox" checked={s.labels} onChange={(e) => useRotations.setState({ labels: e.target.checked })} /> Names</label>
            <label><input type="checkbox" checked={s.trails} onChange={(e) => useRotations.setState({ trails: e.target.checked })} /> Paths</label>
            <label><input type="checkbox" checked={s.receiveAreas} onChange={(e) => useRotations.setState({ receiveAreas: e.target.checked })} /> Coverage areas</label>
            {!studio.editing && !studio.working && <label><input type="checkbox" checked={s.editor} onChange={(e) => s.setEditor(e.target.checked)} /> Advanced V3 Coach draft</label>}
          </div>
          {s.receiveAreas && <p className="coverage-note">Colour areas follow athletes at every stage. Approximate responsibilities, not measured reach: compact block/tip lanes, broader backcourt cover. On their serve, original receive proportions apply. Call MINE on overlaps.</p>}
          {s.editor && !studio.editing && <RotationEditor />}
        </div>
      </section>}
      <div className="rotation-timeline glass">
        <div className="rotation-markers" aria-label="Timeline markers">{stageOrder(s.serve).map(stage => <button key={stage} aria-label={`Seek ${stage}`} aria-pressed={selected === stage} onClick={() => jump(times[stage])}>{stage}</button>)}</div>
        <div className="rotation-play-row">
          <button className="rotation-play" aria-label={s.playing ? 'Pause rotations' : 'Play rotations'} onClick={s.toggle} disabled={s.editor || s.exampleResult?.ok === false} title={s.editor ? "Leave Coach draft to play" : s.exampleResult?.ok === false ? "Choose a feasible sample or Authored to play" : "Space to play / pause"}>{s.playing ? 'Pause' : 'Play'}</button>
          <button aria-label="Restart rotations" onClick={() => jump(0)}>↺</button>
          <input type="range" disabled={studio.editing} min="0" max={scenario.duration} step="0.01" value={s.time} aria-label="Scrub rotations" onChange={(e) => s.seek(Number(e.target.value))} />
          <output aria-label="Timeline time">{s.time.toFixed(1)}s</output>
          <select aria-label="Rotation playback speed" value={s.rate} onChange={(e) => useRotations.setState({ rate: Number(e.target.value) })}>{[0.25, 0.5, 1, 1.5, 2].map((rate) => <option key={rate} value={rate}>{rate}×</option>)}</select>
        </div>
        <div className="rotation-footer"><span>{s.example ? 'TEACHING SAMPLE · UNAPPROVED' : s.draft ? 'LOCAL DRAFT · not shared' : status}</span><div>
          <button onClick={async () => {
            const url = rotationLink(window.location.href, s.rotation, s.serve, s.time, s.opponentAttack, s.firstTouch, s.example)
            try { await navigator.clipboard.writeText(url); setShare('Published view link copied. Draft edits are excluded.') }
            catch { setShare(url) }
          }}>Share view</button><button aria-expanded={settings} onClick={() => setSettings(!settings)}>Settings</button>
        </div></div>
        {share && <div className="share-feedback" role="status">{share}<button aria-label="Dismiss share message" onClick={() => setShare('')}>×</button></div>}
      </div>
      <p className="demo-disclaimer">{s.example ? 'Teaching example — not approved match positions.' : demo ? 'DEMO · Demonstration movements — not approved match positions.' : s.draft || status === 'DRAFT' ? 'Draft — not approved match positions.' : 'Coach-approved plan · structural checks are not referee certification.'}</p>
    </div>}
  </main>
}
