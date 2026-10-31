import type { Keyframe, Role, Scenario, Spot, Team } from './rotationTypes.ts'
import { isFront, positionOf, sampleTrack } from './rotationModel.ts'
import type { AthleteAction } from './strategyDraft.ts'

type Contact = { time: number; kind: 'receive' | 'set' | 'attack' | 'serve' }
export type PoseCues = { contacts: Contact[]; blocks: number[]; front: boolean; serviceTime: number }
export type PlayerPose = {
  x: number; z: number; facing: number; cue: Contact['kind'] | 'approach' | 'block' | 'ready' | 'cover' | 'recover'
  lift: number; crouch: number; lean: number
  leftArm: number; rightArm: number; armSpread: number; leftLeg: number; rightLeg: number
}
const distance = (a: Spot, b: Spot) => Math.hypot(a.x - b.x, a.z - b.z)

/** Resolve once per scenario/player, never by the role held across a whole stage.
 * Ambiguous or disconnected endpoints get no contact gesture. No source writes.
 */
export function createPoseCues(s: Scenario, team: Team, id: string): PoseCues {
  const contacts: Contact[] = []
  const owner = (time: number, point: Spot, roles: Role[]) => {
    const ids = Object.keys(s.tracks).filter(key => {
      // Tolerate floating-point representations of the same authored boundary.
      const p = sampleTrack(s.tracks[key], time + 1e-7)
      return roles.includes(p.role) && distance(p, point) < .01
    })
    return ids.length === 1 ? ids[0] : null
  }
  const add = (player: string | null, time: number, kind: Contact['kind']) => {
    if (player === id && !contacts.some(c => c.time === time && c.kind === kind)) contacts.push({ time, kind })
  }
  for (const b of s.ball) {
    if (b.kind === 'pass') {
      const first = owner(b.start, b.from, ['pass', 'receive'])
      const second = owner(b.end, b.to, ['set'])
      if (Math.abs(b.start - s.firstContact.time) > 1e-6 || first === s.firstContact.player) add(first, b.start, 'receive')
      if (Math.abs(b.end - s.secondContact.time) > 1e-6 || second === s.secondContact.player) add(second, b.end, 'set')
    }
    if (b.kind === 'attack' && b.from.z >= 0) {
      const set = s.ball.find(a => a.kind === 'set' && Math.abs(a.end - b.start) < 1e-6 && distance(a.to, b.from) < .01)
      if (set) add(owner(b.start, b.from, ['attack']), b.start, 'attack')
    }
    if (b.kind === 'serve' && s.serve === 'us') add(owner(b.start, b.from, ['serve']), b.start, 'serve')
  }
  const front = isFront(positionOf(team, s.rotation, id))
  const blocks = front ? s.tracks[id].filter((k, i, track) => k.role === 'block' && track[i - 1]?.role !== 'block').map(k => k.time) : []
  return { contacts, blocks, front, serviceTime: s.ball.find(b => b.kind === 'serve')?.start ?? 0 }
}

const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t) }
const pulse = (time: number, contact: number, before: number, after: number) => time <= contact
  ? smooth(1 - (contact - time) / before) : smooth(1 - (time - contact) / after)

/** Deterministic animation-time sampling: pause/reverse/seek cannot retain a
 * stale gesture. Only the body is lifted; floor location always equals track.
 */
export function playerPose(track: Keyframe[], cues: PoseCues, time: number, reduced = false, action?: AthleteAction, actionTime?: number): PlayerPose {
  const p = sampleTrack(track, time)
  const a = reduced ? p : sampleTrack(track, Math.max(track[0].time, time - .02))
  const b = reduced ? p : sampleTrack(track, Math.min(track[track.length - 1].time, time + .02))
  const dt = Math.min(track[track.length - 1].time, time + .02) - Math.max(track[0].time, time - .02)
  const vx = dt > 0 && time > cues.serviceTime ? (b.x - a.x) / dt : 0
  const vz = dt > 0 && time > cues.serviceTime ? (b.z - a.z) / dt : 0
  const speed = Math.hypot(vx, vz)
  const restFacing = p.facing ?? 0
  const travelFacing = speed > .001 ? Math.atan2(-vx, -vz) : restFacing // avatar faces local -Z
  const turn = Math.atan2(Math.sin(travelFacing - restFacing), Math.cos(travelFacing - restFacing))
  const swing = reduced ? 0 : (Math.sin(time * 9) * .34 * smooth(speed / 2) || 0)
  const pose: PlayerPose = {
    x: p.x, z: p.z, facing: restFacing + turn * smooth(speed / .35), cue: 'ready',
    lift: 0, crouch: reduced ? 0 : .12, lean: reduced ? 0 : -Math.min(speed * .035, .12),
    leftArm: .15 - swing * .6, rightArm: .15 + swing * .6, armSpread: .12,
    leftLeg: swing, rightLeg: swing ? -swing : 0,
  }
  // Only front-row block entries have a cue, including in invalid edited drafts.
  const block = Math.max(0, ...cues.blocks.map(t => pulse(time, t, .18, .25)))
  if (block > 0) {
    pose.cue = 'block'
    pose.leftArm += (2.85 - pose.leftArm) * (reduced ? 1 : block)
    pose.rightArm += (2.85 - pose.rightArm) * (reduced ? 1 : block)
    pose.lift = reduced ? 0 : block * .1
  }
  for (const contact of cues.contacts) {
    const attack = contact.kind === 'attack'
    const weight = pulse(time, contact.time, attack ? .2 : .28, .22)
    if (attack && time >= contact.time - .65 && time < contact.time + .22) {
      const approach = reduced ? 1 : time <= contact.time
        ? smooth((time - contact.time + .65) / .35) : pulse(time, contact.time, .65, .22)
      pose.cue = 'approach'
      if (!reduced) { pose.crouch += (.3 - pose.crouch) * approach; pose.lean += (-.12 - pose.lean) * approach }
      pose.leftArm += (-.3 - pose.leftArm) * approach
      pose.rightArm += (-.3 - pose.rightArm) * approach
    }
    if (weight <= 0) continue
    const strength = reduced ? 1 : weight
    pose.cue = contact.kind
    if (contact.kind === 'receive') {
      pose.leftArm += (1.2 - pose.leftArm) * strength
      pose.rightArm += (1.2 - pose.rightArm) * strength
      pose.armSpread += (-.45 - pose.armSpread) * strength
      if (!reduced) { pose.crouch += (.65 - pose.crouch) * weight; pose.lean += (-.22 - pose.lean) * weight }
    } else if (contact.kind === 'set') {
      pose.leftArm += (2.65 - pose.leftArm) * strength
      pose.rightArm += (2.65 - pose.rightArm) * strength
      pose.armSpread += (-.08 - pose.armSpread) * strength
    } else {
      pose.leftArm += (1.25 - pose.leftArm) * strength
      pose.rightArm += (3 - pose.rightArm) * strength
      if (attack && !reduced) pose.lift = weight * .16
    }
    if (contact.kind === 'serve' || attack) {
      pose.leftLeg = pose.leftLeg * (1 - strength) || 0
      pose.rightLeg = pose.rightLeg * (1 - strength) || 0
    }
  }
  if (action) {
    // A coached action describes what happens at one authored moment, not a
    // pose to hold while the athlete travels toward the next moment.
    const weight = actionTime === undefined ? 1 : smooth(1 - Math.max(0, time - actionTime) / .6)
    const before = { ...pose }
    pose.cue = action
    pose.lift = 0; pose.crouch = .12; pose.lean = 0; pose.armSpread = .12
    pose.leftArm = .15; pose.rightArm = .15
    if (action === 'receive') { pose.leftArm = pose.rightArm = 1.2; pose.armSpread = -.45; pose.crouch = .65; pose.lean = -.22 }
    if (action === 'set') { pose.leftArm = pose.rightArm = 2.65; pose.armSpread = -.08 }
    if (action === 'attack') { pose.leftArm = 1.25; pose.rightArm = 3 }
    if (action === 'block') { pose.leftArm = pose.rightArm = cues.front ? 2.85 : .7; pose.crouch = cues.front ? .1 : .35; pose.lift = cues.front && !reduced && time >= cues.serviceTime ? .1 : 0 }
    if (action === 'cover') { pose.leftArm = pose.rightArm = .65; pose.armSpread = .5; pose.crouch = .5; pose.lean = -.15 }
    if (action === 'recover') { pose.leftArm = .4 - swing; pose.rightArm = .4 + swing; pose.lean = -.1 }
    if (weight < 1) {
      for (const key of ['lift', 'crouch', 'lean', 'armSpread', 'leftArm', 'rightArm'] as const) pose[key] = before[key] + (pose[key] - before[key]) * weight
      if (weight === 0) pose.cue = before.cue
    }
  }
  return pose
}

/** Same secondary-motion policy for the OS preference and opt-in phone mode. */
export function motionBudget(lowMotion: boolean, reducedMotion: boolean): { secondary: boolean; dpr: [number, number]; shadows: boolean } {
  const secondary = !lowMotion && !reducedMotion
  return { secondary, dpr: secondary ? [1, 1.7] : [1, 1], shadows: secondary }
}
