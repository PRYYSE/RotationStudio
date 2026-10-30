import type { Scenario } from '../lib/rotationTypes.ts'
import { requireSourceEvent } from '../lib/strategyEvents.ts'
import { activeScenario, useRotations } from './rotationStore.ts'
import { useStrategies } from './strategyStore.ts'

/** Desktop selection is an edit destination, never an implicit Play command.
 * Resolve against published source so edited geometry cannot redefine contacts. */
export function selectDesktopEvent(source: Scenario, id: string) {
  const event = requireSourceEvent(source, id)
  const r = useRotations.getState(), studio = useStrategies.getState()
  if (studio.gesture) return
  studio.setEvent(source, id, r.published ?? undefined)
  r.navigate(event.time, true)
}

/** Explicit desktop Play traverses the rest of the actual authored rally. */
export function playDesktopRally() {
  const r = useRotations.getState(), scenario = activeScenario(r)
  if (!scenario || useStrategies.getState().gesture || r.exampleResult?.ok === false) return
  if (r.playing) { r.pause(); return }
  useRotations.setState({ time: r.time >= scenario.duration ? 0 : r.time,
    playing: true, transitionTarget: scenario.duration, shuffleRunning: false })
}
