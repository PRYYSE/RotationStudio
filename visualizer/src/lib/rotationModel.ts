import type { BallSegment, Point, Scenario, Spot, Team, Keyframe, OpponentAttack, FirstTouch } from './rotationTypes.ts'
import { arcControl } from './trajectory.ts'

export function rotationOrder(initial: string[], turns: number): string[] {
  const n = ((turns % 6) + 6) % 6
  return [...initial.slice(n), ...initial.slice(0, n)]
}
export function positionOf(team: Team, rotation: number, id: string) {
  return rotationOrder(team.initialOrder, rotation - 1).indexOf(id) + 1
}
export const isFront = (position: number) => position >= 2 && position <= 4
const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x))
export function sampleTrack(track: Keyframe[], time: number): Keyframe {
  if (time <= track[0].time) return { ...track[0] }
  const end = track.findIndex((p) => p.time > time)
  if (end < 0) return { ...track[track.length - 1] }
  const a = track[end - 1], b = track[end]
  const t = clamp((time - a.time) / (b.time - a.time), 0, 1)
  const eased = t * t * (3 - 2 * t)
  const path: Spot[] = [a, ...(b.via ?? []), b]
  const lengths = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.z - path[i].z))
  let distance = eased * lengths.reduce((sum, n) => sum + n, 0)
  let i = 0
  while (i < lengths.length - 1 && distance > lengths[i]) distance -= lengths[i++]
  const f = lengths[i] ? distance / lengths[i] : 0
  const start = path[i], finish = path[i + 1]
  // Roles are discrete events; seeking backwards never retains a future role.
  const facingA = a.facing ?? 0, facingB = b.facing ?? facingA
  const angle = Math.atan2(Math.sin(facingB - facingA), Math.cos(facingB - facingA))
  return { ...a, time, x: start.x + (finish.x - start.x) * f, z: start.z + (finish.z - start.z) * f, facing: facingA + angle * eased }
}
export function sampleArc(segment: BallSegment, t: number): Point {
  const u = clamp(t, 0, 1), v = 1 - u
  const c = arcControl(segment.from, segment.to, segment.height)
  return {
    x: v * v * segment.from.x + 2 * v * u * c.x + u * u * segment.to.x,
    y: v * v * segment.from.y + 2 * v * u * c.y + u * u * segment.to.y,
    z: v * v * segment.from.z + 2 * v * u * c.z + u * u * segment.to.z,
  }
}
export function ballAt(scenario: Scenario, time: number): Point {
  const segment = scenario.ball.find((s) => time <= s.end) ?? scenario.ball[scenario.ball.length - 1]
  return sampleArc(segment, (time - segment.start) / (segment.end - segment.start))
}
export function phaseAt(scenario: Scenario, time: number) {
  return [...scenario.phases].reverse().find((p) => p.time <= time) ?? scenario.phases[0]
}
export function selectScenario(base: Scenario, opponentAttack: OpponentAttack, firstTouch: FirstTouch): Scenario {
  const key = firstTouch === 'harry' ? (opponentAttack === 'right' ? 'harryRight' : 'harry') : opponentAttack === 'right' ? 'right' : null
  // Legacy demos have no variants. Never synthesize tracks or contacts.
  return key ? base.alternates?.[key] ?? base : base
}
export function showReceiveAreas(scenario: Scenario, time: number, enabled: boolean) {
  return enabled && scenario.serve === 'they' && time <= scenario.firstContact.time &&
    phaseAt(scenario, time).section === 'Receive' && !!scenario.tactics?.receiveZones.length
}
export function readRotationLink(search: string) {
  const p = new URLSearchParams(search)
  const rotation = Number(p.get('r'))
  const time = Number(p.get('t'))
  return { rotation: Number.isInteger(rotation) && rotation >= 1 && rotation <= 6 ? rotation : 1,
    serve: p.get('serve') === 'us' ? 'us' as const : 'they' as const,
    opponentAttack: p.get('attack') === 'right' ? 'right' as const : 'left' as const,
    firstTouch: p.get('first') === 'harry' ? 'harry' as const : 'normal' as const,
    time: Number.isFinite(time) ? Math.max(0, time) : 0 }
}
export function rotationLink(base: string, rotation: number, serve: string, time: number, opponentAttack: OpponentAttack = 'left', firstTouch: FirstTouch = 'normal') {
  const url = new URL(base)
  url.search = new URLSearchParams({ mode: 'rotations', r: String(rotation), serve, t: time.toFixed(2) }).toString()
  // Default selections keep the original link shape.
  if (opponentAttack !== 'left') url.searchParams.set('attack', opponentAttack)
  if (firstTouch !== 'normal') url.searchParams.set('first', firstTouch)
  url.hash = ''
  return url.toString()
}
