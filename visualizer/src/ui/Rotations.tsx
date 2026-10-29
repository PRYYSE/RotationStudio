import { useEffect, useRef, useState } from 'react'
import { RotationScene } from '../three/RotationScene'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { loadBundle } from '../lib/rotationValidation'
import { phaseAt, rotationLink, selectScenario } from '../lib/rotationModel'
import { coverageStage } from '../lib/coverage'
import { sourceEvents } from '../lib/strategyEvents'
import { RotationEditor } from './RotationEditor'
import { FirstBallExamples } from './FirstBallExamples'
import type { RotationView } from '../lib/rotationTypes'
import { selectedEvent, stageOrder, stageTimes } from '../lib/strategyDraft'
import { useStrategyStudio } from './useStrategyStudio'
import { StrategyLibrary } from './StrategyLibrary'
import { StrategyEditor } from './StrategyEditor'
import { useStrategies } from '../state/strategyStore'
import { PlayerFocus } from './PlayerFocus'
import { useViewerReview } from './useViewerReview'
import { RotationPlayback, ViewerEvents, useRotationPlayback } from './RotationPlayback'
import { CourtTools } from './CourtTools'
import { ShuffleControls } from './ShuffleControls'

export function Rotations() {
  const s = useRotations(), bundle = activeBundle(s), scenario = activeScenario(s)
  const { studio, warnings } = useStrategyStudio()
  useRotationPlayback()
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [settings, setSettings] = useState(false)
  const [lowMotion, setLowMotion] = useState(false)
  const [share, setShare] = useState('')
  const labelHost = useRef<HTMLDivElement>(null)
  const currentStage = studio.editing && !s.playing ? studio.stage : scenario
    ? selectedEvent(scenario, s.time) ?? coverageStage(scenario, s.time)
    : 'Start'
  const review = useViewerReview(currentStage, studio.editing && studio.laterDefend && s.serve === 'us' && currentStage === 'Defend')
  const leaveEditor = () => {
    useStrategies.setState({ editing: false })
    if (s.editor) { const time = s.time; s.setEditor(false); s.seek(time) }
  }
  const load = () => {
    useRotations.setState({ loading: true, error: '' })
    loadBundle(import.meta.env.BASE_URL).then((bundle) => useRotations.getState().setBundle(bundle))
      .catch((error) => useRotations.setState({ loading: false, error: error.message }))
  }
  useEffect(() => {
    if (!useRotations.getState().published) load()
    return () => { useRotations.getState().stopShuffle(); useRotations.setState({ playing: false }) }
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(tag) || (e.target as HTMLElement)?.isContentEditable) return
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
  const times = stageTimes(scenario)
  const selected = currentStage
  const panel = studio.editing || libraryOpen
  return <main className={`rotations court-first ${panel ? 'strategy-open' : ''} ${studio.editing ? 'strategy-editing' : ''} ${settings ? 'settings-open' : ''}`} aria-label="Rotation studio">
    <div className="rotation-canvas" aria-label="Interactive volleyball court">
      <RotationScene labelHost={labelHost} lowMotion={lowMotion} />
      {studio.editing && <div className="editor-zoom glass" role="group" aria-label="Edit court zoom">
        <button aria-label="Zoom in" onClick={() => studio.zoomCamera('in')}>+</button>
        <button aria-label="Zoom out" onClick={() => studio.zoomCamera('out')}>−</button>
        <button onClick={() => studio.zoomCamera('fit')}>Fit our court</button>
      </div>}
      <div className="court-labels" ref={labelHost} aria-label="Court identities">
        <svg aria-hidden="true">{bundle.team.players.map(p => <line key={p.id} data-leader={p.id} stroke={p.color} />)}</svg>
        {bundle.team.players.map(p => <span key={p.id} data-player={p.id} hidden className="athlete-label" style={{ borderColor: p.color }} aria-label={p.name} />)}
      </div>
    </div>
    <div className="rotation-top">
      <nav className="rotation-row glass" aria-label="Strategy mode">
        <button aria-pressed={!studio.editing && !libraryOpen} onClick={() => { leaveEditor(); setLibraryOpen(false) }}>View</button>
        <button aria-pressed={studio.editing} onClick={() => {
          s.stopShuffle()
          if (!studio.working) studio.newStrategy(false, s.published ?? undefined)
          const root = s.published?.plans.scenarios.find(p => p.rotation === s.rotation && p.serve === s.serve)
          const source = root && selectScenario(root, s.opponentAttack, s.firstTouch)
          const event = source?.tactics && sourceEvents(source).find(e => Math.abs(e.time - s.time) < .005)
          if (source && event && s.time !== times[currentStage]) studio.setEvent(source, event.id, s.published ?? undefined)
          else studio.setStage(currentStage)
          if (!bundle.team.players.some(p => p.id === s.selected)) useRotations.setState({ selected: 'harry' })
          useStrategies.setState({ editing: true }); s.setEditor(true); setSettings(false); setLibraryOpen(false)
        }}>Edit strategy</button>
        <button aria-pressed={libraryOpen && !studio.editing} aria-expanded={libraryOpen && !studio.editing} onClick={() => { s.stopShuffle(); if (studio.editing) leaveEditor(); setLibraryOpen(!libraryOpen) }}>Strategies</button>
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
      {!studio.editing && <p className="library-preview-context" aria-label="Current preview focus">{currentStage} · {bundle.team.players.find(p => p.id === s.selected)?.name ?? 'Whole team'} · {phase.label} · {s.time.toFixed(2)}s</p>}
      <StrategyLibrary compact={studio.editing} />
      {warnings.filter(w => w.startsWith('Event edits were not applied:')).map(w => <p className="strategy-warning" role="alert" key={w}>{w}</p>)}
      {studio.editing && <StrategyEditor key={`${s.rotation}/${s.serve}/${s.opponentAttack}/${s.firstTouch}`} review={review} />}
      {!studio.editing && studio.working && <p className="strategy-warning">Foundation needs tactical review. View plays the V3 timing template with your foundation edits.</p>}
      {!studio.editing && <ViewerEvents />}
    </aside>}
    {!panel && <aside className="viewer-panel glass" aria-label="Court context">
      <div className="viewer-heading"><strong>{settings ? 'Scenario Explorer' : 'Player Focus'}</strong>
        <button aria-expanded={settings} onClick={() => setSettings(!settings)}>{settings ? 'Player Focus' : 'Scenario Explorer'}</button></div>
      <ShuffleControls />
      <PlayerFocus review={review} />
      <ViewerEvents />
      {settings && <section className="rotation-settings" aria-label="Rotation settings">
        <div className="settings-heading"><strong>Scenario Explorer & settings</strong><button aria-label="Close settings" onClick={() => setSettings(false)}>Close</button></div>
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
          {hasAlternates && <FirstBallExamples review={review} />}
          {s.exampleNotice && <p className="example-notice" role="status">{s.exampleNotice}</p>}
          <nav className="rotation-row" aria-label="Camera view">{(['front', 'side', 'orbit', 'top'] as RotationView[]).map((view) => <button key={view} aria-pressed={s.view === view} onClick={() => useRotations.setState({ view })}>{view[0].toUpperCase() + view.slice(1)}</button>)}</nav>
          <div className="rotation-row options-row">
            <label><input type="checkbox" checked={s.labels} onChange={(e) => useRotations.setState({ labels: e.target.checked })} /> Names</label>
            <label><input type="checkbox" checked={s.trails} onChange={(e) => useRotations.setState({ trails: e.target.checked })} /> Paths</label>
            <label><input type="checkbox" checked={s.receiveAreas} onChange={(e) => useRotations.setState({ receiveAreas: e.target.checked })} /> Coverage areas</label>
            <label><input type="checkbox" checked={lowMotion} onChange={(e) => setLowMotion(e.target.checked)} /> Low motion / phone performance</label>
            {!studio.editing && !studio.working && <label><input type="checkbox" checked={s.editor} onChange={(e) => s.setEditor(e.target.checked)} /> Advanced V3 Coach draft</label>}
          </div>
          {s.receiveAreas && <p className="coverage-note">Colour areas follow athletes at every stage. Approximate responsibilities, not measured reach: compact block/tip lanes, broader backcourt cover. On their serve, original receive proportions apply. Call MINE on overlaps.</p>}
          {s.editor && !studio.editing && <RotationEditor />}
      </section>}
    </aside>}
    <div className="rotation-bottom">
      <div className="rotation-cue" aria-live="off"><strong>{selected} · {bundle.team.players.find(p => p.id === s.selected)?.name ?? 'Whole team'} · {unavailable ? 'Sample unavailable · playback paused' : phase.label === 'Legal start' ? 'At serve contact' : phase.label}</strong></div>
      <CourtTools />
      <div className="rotation-timeline glass">
        <div className="rotation-markers" aria-label="Timeline markers">{stageOrder(s.serve).map(stage => <button key={stage} aria-label={`Seek ${stage}`} aria-pressed={selected === stage} onClick={() => {
          if (!studio.editing) { s.navigate(times[stage]); return }
          if (s.reducedMotion || Math.abs(s.time - times[stage]) < .005) { studio.setStage(stage); s.navigate(times[stage], true) }
          else s.navigate(times[stage])
        }}>{stage}</button>)}</div>
        <RotationPlayback />
        <div className="rotation-footer"><span>{s.example ? 'TEACHING SAMPLE · UNAPPROVED' : s.draft ? 'LOCAL DRAFT · not shared' : status}</span><div>
          <button onClick={async () => {
            const url = rotationLink(window.location.href, s.rotation, s.serve, s.time, s.opponentAttack, s.firstTouch, s.example)
            try { await navigator.clipboard.writeText(url); setShare('Published view link copied. Draft edits are excluded.') }
            catch { setShare(url) }
          }}>Share view</button><button disabled={panel} aria-expanded={settings} onClick={() => setSettings(!settings)}>Settings</button>
        </div></div>
        {share && <div className="share-feedback" role="status">{share}<button aria-label="Dismiss share message" onClick={() => setShare('')}>×</button></div>}
      </div>
      <p className="demo-disclaimer">{s.example ? 'Teaching example — not approved match positions.' : demo ? 'DEMO · Demonstration movements — not approved match positions.' : s.draft || status === 'DRAFT' ? 'Draft — not approved match positions.' : 'Coach-approved plan · structural checks are not referee certification.'}</p>
    </div>
  </main>
}
