import type { AthleteAction, PlayerId, StrategyRotation } from './strategyDraft.ts'
import type { Scenario, Team } from './rotationTypes.ts'
import { requireSourceEvent, sourceEvents } from './strategyEvents.ts'
import { isFront, positionOf, sampleTrack } from './rotationModel.ts'
import { splitTrack } from './trackSplit.ts'
import { EXAMPLE_SCREEN } from './receiveExample.ts'

export const ACTION_LABELS: Record<AthleteAction, string> = {
  ready: 'Ready', receive: 'Receive/Dig', set: 'Set', attack: 'Attack', block: 'Block', cover: 'Cover', recover: 'Recover',
}
export function actionAt(changes: StrategyRotation | undefined, source: Scenario, time: number, player: string): AthleteAction | undefined {
  const event = sourceEvents(source).filter(e => e.time <= time + 1e-7).at(-1)
  return event ? changes?.eventOverrides?.[event.id]?.actions?.[player as PlayerId] ?? undefined : undefined
}
export function actionWarning(source: Scenario, team: Team, eventId: string, player: string, action?: AthleteAction): string[] {
  if (!action) return []
  const event = requireSourceEvent(source, eventId), warnings: string[] = []
  if (action === 'block' && !isFront(positionOf(team, source.rotation, player))) warnings.push('Back-row athlete: blocking above the net is illegal. Preview keeps both feet down and arms below the net.')
  const expected = sampleTrack(source.tracks[player], event.time).role
  const matches = action === 'receive' ? ['receive', 'pass', 'defend'].includes(expected)
    : action === 'cover' ? expected === 'help' : action === 'ready' ? ['start', 'defend'].includes(expected) : expected === action
  if (event.actors.includes(player) && !matches) warnings.push(`Coaching action differs from this athlete’s original ${expected} contact. The authored ball and toucher stay unchanged.`)
  else if (!event.actors.includes(player) && ['receive', 'set', 'attack'].includes(action)) warnings.push('Teaching pose only. This action does not give this athlete the ball.')
  return warnings
}
export function routeMetres(s: Scenario, player: string, start: number, end: number): number {
  const points = Array.from({ length: 100 }, (_, i) => sampleTrack(s.tracks[player], start + (end - start) * i / 99))
  return points.slice(1).reduce((n, p, i) => n + Math.hypot(p.x - points[i].x, p.z - points[i].z), 0)
}

export function routeBends(s: Scenario, source: Scenario, eventId: string, player: string) {
  const events = sourceEvents(source), event = events.find(e => e.id === eventId)
  if (!event) return []
  const previous = events[events.indexOf(event) - 1], track = structuredClone(s.tracks[player])
  if (previous && previous.time >= source.ball[0].start) splitTrack(track, previous.time)
  return splitTrack(track, event.time).via ?? []
}


/** Preview-only movement screen, using the same conservative acceleration
 * multiplier as authored-strategy warnings. Not a player-specific speed model. */
export function movementReview(s: Scenario, player: string, start: number, end: number) {
  const seconds = end - start
  const metres = seconds > 0 ? routeMetres(s, player, start, end) : 0
  const requiredPace = seconds > 0 ? 1.5 * metres / seconds : 0
  const review = seconds <= 0 || !Number.isFinite(requiredPace)
    ? 'unavailable'
    : metres < .15 ? 'stationary'
    : requiredPace > EXAMPLE_SCREEN.peakSpeed ? 'check' : 'normal'
  const label = review === 'unavailable' ? 'No timed path'
    : review === 'stationary' ? 'Holding position'
    : review === 'check' ? 'Check this move: it may be too fast for a practical rally'
    : 'Within the rough teaching movement screen'
  return { metres, seconds, requiredPace, review, label }
}
