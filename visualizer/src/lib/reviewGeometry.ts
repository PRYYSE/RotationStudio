import type { Keyframe, Scenario, Spot } from './rotationTypes.ts'
import type { PlayerId, StrategyStage } from './strategyDraft.ts'
import { stageOrder, stageTimes } from './strategyDraft.ts'
import { sampleTrack } from './rotationModel.ts'

export const metresBetween = (a: Spot, b: Spot): number => Math.hypot(b.x - a.x, b.z - a.z)
export const reviewPoint = (p: Spot): Spot => ({ x: p.x, z: p.z })
export type TimedPath = {
  from: Spot & { time: number; label: string }
  to: Spot & { time: number; label: string }
  availableSeconds: number
  straightMetres: number
  pathMetres: number
}
const easedFraction = (t: number) => {
  const u = Math.max(0, Math.min(1, t))
  return u * u * (3 - 2 * u)
}

/** Exact arclength of the renderer's piecewise eased polylines, clipped to time.
 * Includes every intervening keyframe and bend, even between phase events.
 * Coordinates are source court metres; no pixel scale or speed prediction.
 */
export function timelinePath(track: Keyframe[], start: number, end: number): TimedPath {
  if (!track.length || !Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error('Invalid timeline interval.')
  let pathMetres = 0
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i]
    if (b.time <= a.time) throw new Error('Invalid keyframe interval.')
    if (b.time <= start || a.time >= end) continue
    const path = [a, ...(b.via ?? []), b]
    const length = path.slice(1).reduce((sum, p, j) => sum + metresBetween(path[j], p), 0)
    pathMetres += length * (easedFraction((end - a.time) / (b.time - a.time)) - easedFraction((start - a.time) / (b.time - a.time)))
  }
  const from = reviewPoint(sampleTrack(track, start)), to = reviewPoint(sampleTrack(track, end))
  return { from: { ...from, time: start, label: '' }, to: { ...to, time: end, label: '' },
    availableSeconds: end - start, straightMetres: metresBetween(from, to), pathMetres }
}

export function eventLabel(s: Scenario, time: number): string {
  return s.phases.find(p => Math.abs(p.time - time) < 1e-6)?.label ?? 'Not authored for this case'
}

export function playerComparisonAt(s: Scenario, stage: StrategyStage, id: PlayerId, time: number, later: boolean) {
  const times = stageTimes(s), order = stageOrder(s.serve), index = order.indexOf(stage)
  const previous = later ? times.Attack : index > 0 ? Math.max(s.ball[0].start, times[order[index - 1]]) : time
  const path = (start: number) => {
    const p = timelinePath(s.tracks[id], start, time)
    p.from.label = eventLabel(s, start); p.to.label = eventLabel(s, time)
    return p
  }
  return { point: reviewPoint(sampleTrack(s.tracks[id], time)), incoming: path(previous),
    ...(time >= s.ball[0].start ? { releaseToEvent: path(s.ball[0].start) } : {}) }
}
