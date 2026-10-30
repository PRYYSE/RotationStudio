import type { Scenario } from '../lib/rotationTypes.ts'
import { requireSourceEvent } from '../lib/strategyEvents.ts'
import { useRotations } from './rotationStore.ts'
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
