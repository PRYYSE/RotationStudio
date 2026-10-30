import { useEffect, useMemo, useRef } from 'react'
import { activeScenario, authoredScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { sourceEvents } from '../lib/strategyEvents'
import { stageOrder, stageTimes } from '../lib/strategyDraft'
import { selectScenario } from '../lib/rotationModel'
import { EventNavigator } from './EventNavigator'
import { useDesktopWorkbench } from './useDesktopWorkbench'
import { selectDesktopEvent } from '../state/desktopNavigation'

export function useRotationPlayback() {
  const s = useRotations(), studio = useStrategies(), wasPlaying = useRef(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      useRotations.setState({ reducedMotion: media.matches })
      const state = useRotations.getState()
      if (media.matches && state.transitionTarget !== null) state.navigate(state.transitionTarget, true)
    }
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (wasPlaying.current && !s.playing && studio.editing) {
      const root = s.published?.plans.scenarios.find(p => p.rotation === s.rotation && p.serve === s.serve)
      const source = root && selectScenario(root, s.opponentAttack, s.firstTouch)
      const event = source?.tactics && sourceEvents(source).find(e => e.time === s.time)
      if (source && event) studio.setEvent(source, event.id, s.published ?? undefined)
    }
    wasPlaying.current = s.playing
  }, [s.playing, s.time, studio.editing])
}

export function ViewerEvents() {
  const s = useRotations(), scenario = authoredScenario(s)
  if (!scenario?.tactics || s.example) return null
  const events = sourceEvents(scenario), current = [...events].reverse().find(e => e.time <= s.time)
  return <EventNavigator events={events} selectedId={current?.id} readOnly onSelect={id => {
    const event = events.find(e => e.id === id)
    if (event) s.navigate(event.time)
  }} />
}

export function RotationPlayback() {
  const desktop = useDesktopWorkbench()
  const s = useRotations(), studio = useStrategies(), scenario = activeScenario(s)!
  const order = stageOrder(s.serve), times = stageTimes(scenario)
  const root = s.published?.plans.scenarios.find(p => p.rotation === s.rotation && p.serve === s.serve)
  const source = root ? selectScenario(root, s.opponentAttack, s.firstTouch) : scenario
  const events = useMemo(() => source.tactics && !source.teachingOnly ? sourceEvents(source) : [], [source])
  const step = (direction: number, instant = false, preview = false) => {
    const time = studio.editing
      ? (direction > 0 ? events.find(e => e.time > s.time) : [...events].reverse().find(e => e.time < s.time))?.time
      : (direction > 0 ? order.map(k => times[k]).find(t => t > s.time) : order.map(k => times[k]).reverse().find(t => t < s.time))
    if (time === undefined) return
    if (studio.editing && desktop && !preview) {
      selectDesktopEvent(source, events.find(e => e.time === time)!.id)
    } else if (studio.editing && (instant || s.reducedMotion)) {
      const event = events.find(e => e.time === time)!
      studio.setEvent(source, event.id, s.published ?? undefined)
      s.navigate(time, true)
    } else s.navigate(time, instant)
  }
  const play = () => {
    // Resolve playback state at click time: the renderer can commit a new frame
    // between the button label update and a quick Play/Pause gesture.
    const current = useRotations.getState()
    if (current.playing) current.pause()
    else if (useStrategies.getState().editing) step(1, false, true)
    else current.toggle()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY'].includes(target.tagName) || target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.code === 'Space') { e.preventDefault(); play() }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { e.preventDefault(); step(e.code === 'ArrowRight' ? 1 : -1, e.shiftKey) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  const unavailable = s.exampleResult?.ok === false || (s.editor && !studio.editing) || !!studio.gesture
  return <>
    <div className="rotation-step-row" role="group" aria-label={studio.editing ? 'Event steps' : 'Phase transitions'}>
      <button aria-label={studio.editing ? 'Previous edit event' : 'Previous phase'} disabled={unavailable || s.time <= 0} onClick={() => step(-1)}>Previous</button>
      <button className="rotation-play" aria-label={s.playing ? s.shuffleRunning ? 'Pause shuffle' : 'Pause transition' : studio.editing ? 'Play transition' : s.shuffleEnabled ? 'Play shuffle' : 'Play rotations'} onClick={play} disabled={unavailable}>{s.playing ? 'Pause' : studio.editing ? 'Play transition' : s.shuffleEnabled ? 'Play shuffle' : 'Play'}</button>
      <button aria-label={studio.editing ? 'Next edit event' : 'Next phase'} disabled={unavailable || s.time >= (studio.editing ? events.at(-1)?.time ?? 0 : times[order.at(-1)!])} onClick={() => step(1)}>Next</button>
      {!studio.editing && <button aria-label="Jump to destination or next phase" disabled={unavailable} onClick={() => s.transitionTarget !== null ? s.navigate(s.transitionTarget, true) : step(1, true)}>Jump</button>}
      <output aria-label="Timeline time" data-playing={s.playing} data-destination={s.transitionTarget ?? ''}>{s.time.toFixed(2)}s</output>
    </div>
    {!studio.editing && <div className="rotation-play-row">
      <button aria-label="Restart rotations" onClick={() => s.navigate(0, true)}>↺</button>
      <input type="range" min="0" max={scenario.duration} step="0.01" value={s.time} aria-label="Scrub rotations" onChange={e => s.seek(Number(e.target.value))} />
      <select aria-label="Rotation playback speed" value={s.rate} onChange={e => useRotations.setState({ rate: Number(e.target.value) })}>{[.25, .5, 1, 1.5, 2].map(rate => <option key={rate} value={rate}>{rate}×</option>)}</select>
    </div>}
  </>
}
