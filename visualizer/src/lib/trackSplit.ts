import type { Keyframe, Spot } from './rotationTypes.ts'
import { sampleTrack } from './rotationModel.ts'

/** Insert a frame while retaining the existing incoming and outgoing bends. */
export function splitTrack(track: Keyframe[], time: number): Keyframe {
  const existing = track.find(f => f.time === time)
  if (existing) return existing
  const before = track.filter(f => f.time < time).at(-1)
  const after = track.find(f => f.time > time)
  if (!before || !after) throw new Error('Movement moment is outside the athlete track.')
  const point = sampleTrack(track, time)
  const path = [before, ...(after.via ?? []), after]
  const lengths = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.z - path[i].z))
  const fraction = (time - before.time) / (after.time - before.time)
  const split = lengths.reduce((a, b) => a + b, 0) * fraction * fraction * (3 - 2 * fraction)
  const incoming: Spot[] = [], outgoing: Spot[] = []
  let distance = 0
  for (let i = 1; i < path.length - 1; i++) {
    distance += lengths[i - 1]
    ;(distance < split ? incoming : outgoing).push({ x: path[i].x, z: path[i].z })
  }
  const frame: Keyframe = { ...before, x: point.x, z: point.z, time, via: incoming }
  if (after.via || outgoing.length) after.via = outgoing
  track.push(frame); track.sort((a, b) => a.time - b.time)
  return frame
}
