import type { Keyframe, Scenario, Spot, Team } from './rotationTypes.ts'
import { isFront, positionOf, sampleTrack } from './rotationModel.ts'
import { serviceDiagnostics } from './rotationValidation.ts'

export type FirstBallExample = Spot & { receiver: string } // 'auto' or stable athlete ID
export type ReceiveExampleResult =
  | { ok: true; scenario: Scenario; receiver: string; setter: string; hitter: string; message: string }
  | { ok: false; message: string }
export const SAMPLE_X = [-3, 0, 3] as const
export const SAMPLE_Z = [3.5, 5.8, 8] as const
// Teaching screens only: neither measured athlete speed nor a physical safety guarantee.
export const EXAMPLE_SCREEN = { reach: 2.6, peakSpeed: 4, spacing: 0.56, reaction: 0.18 } as const
const distance = (a: Spot, b: Spot) => Math.hypot(a.x - b.x, a.z - b.z)
const toward = (a: Spot, b: Spot, limit: number): Spot => {
  const f = Math.min(1, limit / (distance(a, b) || 1))
  return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f }
}
const frame = (time: number, spot: Spot, role: Keyframe['role']): Keyframe => ({ time, x: spot.x, z: spot.z, role })

// Uses the same eased, waypoint-aware paths as the renderer. The analytical peak
// bound catches even a very short interval that falls between sampled instants.
export function movementIssue(s: Scenario): string | undefined {
  const tracks = Object.values(s.tracks)
  for (const track of tracks) for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i], path = [a, ...(b.via ?? []), b]
    const length = path.slice(1).reduce((sum, p, j) => sum + distance(path[j], p), 0)
    if (b.time <= a.time || 1.5 * length / (b.time - a.time) > EXAMPLE_SCREEN.peakSpeed + 1e-6) return 'Travel exceeds the teaching movement screen.'
  }
  // Subdivide close approaches using the maximum relative-motion bound.
  // Retaining a blanket sampling margin would reject the authored close lanes.
  const apart = (a: Keyframe[], b: Keyframe[], start: number, end: number, da: number, db: number): boolean => {
    if (Math.min(da, db) < EXAMPLE_SCREEN.spacing) return false
    if (Math.min(da, db) >= EXAMPLE_SCREEN.spacing + EXAMPLE_SCREEN.peakSpeed * (end - start)) return true
    if (end - start < 0.0001) return false // unresolved close approach: conservative rejection
    const mid = (start + end) / 2, dm = distance(sampleTrack(a, mid), sampleTrack(b, mid))
    return apart(a, b, start, mid, da, dm) && apart(a, b, mid, end, dm, db)
  }
  for (let i = 0; i < tracks.length; i++) for (let j = i + 1; j < tracks.length; j++) {
    for (let t = 0; t < s.duration; t += 0.04) {
      const end = Math.min(t + 0.04, s.duration)
      if (!apart(tracks[i], tracks[j], t, end, distance(sampleTrack(tracks[i], t), sampleTrack(tracks[j], t)), distance(sampleTrack(tracks[i], end), sampleTrack(tracks[j], end)))) return 'Local paths are too close under the teaching spacing screen.'
    }
  }
}

/** Non-destructive first-ball illustration; the input is an already validated,
 * selected authored variant. No rescheduling or invented faster athlete speeds.
 * Unsupported reaches/continuations deliberately have no Scenario in the result.
 */
export function receiveExample(team: Team, authored: Scenario, sample: FirstBallExample): ReceiveExampleResult {
  const fail = (reason: string): ReceiveExampleResult => ({ ok: false, message: `No feasible first touch at this sample. ${reason}` })
  if (!SAMPLE_X.some((x) => x === sample.x) || !SAMPLE_Z.some((z) => z === sample.z)) return fail('Choose one of the nine landing areas.')
  if (!authored.tactics || team.players.some((p) => !p.skills)) return fail('This plan has no coaching preferences for adaptive examples.')
  const harryFirst = authored.tactics.firstTouch === 'harry'
  if (sample.receiver !== 'auto' && !team.players.some((p) => p.id === sample.receiver)) return fail('Unknown receiver.')
  if (harryFirst && !['auto', 'harry'].includes(sample.receiver)) return fail('Harry-first allows only Harry; the authored backup sets.')
  if (!harryFirst && sample.receiver === 'harry') return fail('Normal reception excludes Harry. Choose Harry first to use the backup setter.')
  const passIndex = authored.ball.findIndex((b) => b.kind === 'pass')
  const incoming = authored.ball[passIndex - 1], set = authored.ball[passIndex + 1], attack = authored.ball[passIndex + 2]
  if (!incoming || set?.kind !== 'set' || attack?.kind !== 'attack') return fail('No supported first-ball sequence in this plan.')
  const firstTime = authored.firstContact.time, secondTime = authored.secondContact.time, hitTime = attack.start
  // Our serve is immutable. Intercept the opposing ATTACK from defensive ready,
  // which occurs just after their launch, never from the initial service lineup.
  const ready = authored.phases.find((p) => p.label === 'Defence ready')?.time
  const reactTime = authored.serve === 'us' ? Math.max(incoming.start + EXAMPLE_SCREEN.reaction, ready ?? incoming.start) : incoming.start + EXAMPLE_SCREEN.reaction
  const radius = Math.min(EXAMPLE_SCREEN.reach, EXAMPLE_SCREEN.peakSpeed * (firstTime - reactTime) / 1.5)
  const starts = Object.fromEntries(team.players.map((p) => [p.id, sampleTrack(authored.tracks[p.id], authored.serve === 'us' ? reactTime : incoming.start)]))
  const candidates = team.players.filter((p) => (harryFirst ? p.id === 'harry' : p.id !== 'harry') &&
    (sample.receiver === 'auto' || sample.receiver === p.id) && distance(starts[p.id], sample) <= radius)
  const preference = (id: string) => {
    const p = team.players.find((p) => p.id === id)!, zone = authored.serve === 'they' && authored.tactics?.receiveZones.find((z) => z.player === id)
    const zoneCost = zone ? Math.min(2, Math.hypot((sample.x - zone.center.x) / zone.radiusX, (sample.z - zone.center.z) / zone.radiusZ)) * (zone.duty === 'compact' ? 0.2 : 0.1) : 0.25
    return distance(starts[id], sample) + zoneCost - p.skills!.receive * 0.10 - p.skills!.mobility * 0.04
  }
  candidates.sort((a, b) => preference(a.id) - preference(b.id) || a.id.localeCompare(b.id))
  if (!candidates.length) return fail(`${sample.receiver === 'auto' ? 'No eligible athlete' : team.players.find((p) => p.id === sample.receiver)!.name} can reach from ${authored.serve === 'us' ? 'defensive ready' : 'the legal service lineup'} within the teaching reach screen.`)
  const originalHitter = team.players.find((p) => distance(sampleTrack(authored.tracks[p.id], hitTime), set.to) < 0.1 && sampleTrack(authored.tracks[p.id], hitTime).role === 'attack')?.id
  if (!originalHitter) return fail('No authored hitter at ball launch.')
  let reason = 'No available hitter and local recovery in the authored time.'
  for (const receiver of candidates) {
    const hitters = receiver.id !== originalHitter ? [originalHitter] : team.players
      .filter((p) => p.id !== receiver.id && p.id !== authored.secondContact.player && isFront(positionOf(team, authored.rotation, p.id)) && sampleTrack(authored.tracks[p.id], hitTime).role === 'attack')
      .sort((a, b) => b.skills!.attack - a.skills!.attack || b.skills!.setting - a.skills!.setting).map((p) => p.id)
    for (const hitter of hitters) {
      const s = structuredClone(authored)
      delete s.alternates
      s.teachingOnly = true
      s.firstContact.player = receiver.id
      // Former scripted passer stays in their own lane; no role/track swapping.
      if (receiver.id !== authored.firstContact.player) {
        const id = authored.firstContact.player
        const old = s.tracks[id].find((k) => k.time === firstTime)
        if (old) Object.assign(old, frame(firstTime, starts[id], 'receive'), { via: undefined })
      }
      const track = authored.tracks[receiver.id]
      const rejoin = track.find((k) => k.time > hitTime && (k.role === 'block' || k.role === 'defend'))
      if (!rejoin) continue
      const recovery = toward(sample, rejoin, 0.65)
      const prefix = track.filter((k) => k.time <= reactTime)
      // Their serve: hold legal starts through reaction. Our serve: the prefix
      // ends at the existing defensive-ready keyframe, so its easing is intact.
      const anchor = frame(reactTime, starts[receiver.id], authored.serve === 'us' ? 'defend' : 'receive')
      s.tracks[receiver.id] = [...prefix.filter((k) => k.time < reactTime), anchor,
        frame(firstTime, sample, 'pass'), frame(secondTime, recovery, 'help'), frame(hitTime, recovery, 'help'),
        { ...rejoin, via: undefined }, ...track.filter((k) => k.time > rejoin.time)]
      // Keep all original service-contact keyframes, including our P1 server.
      if (authored.serve === 'they') {
        s.tracks[receiver.id] = [...track.filter((k) => k.time <= incoming.start), anchor, ...s.tracks[receiver.id].filter((k) => k.time > reactTime)]
      }
      const pass = s.ball[passIndex]
      pass.from = { ...pass.from, x: sample.x, z: sample.z }
      s.ball[passIndex - 1].to = { ...pass.from }
      const launch = sampleTrack(s.tracks[hitter], hitTime)
      s.ball[passIndex + 1].to = { ...set.to, x: launch.x, z: launch.z }
      s.ball[passIndex + 2].from = { ...s.ball[passIndex + 1].to }
      const names = (id: string) => team.players.find((p) => p.id === id)!.name
      const message = `${names(receiver.id)} receives · ${names(s.secondContact.player)} sets · ${names(hitter)} sample hitter`
      for (const phase of s.phases) {
        if (phase.time === firstTime) phase.cue = `${names(receiver.id)} takes the sample ${s.serve === 'us' ? 'attack dig' : 'serve'}. Pass high to the marked window, then recover locally.`
        if (phase.time === secondTime) phase.cue = `${names(s.secondContact.player)} sets to ${names(hitter)}. ${names(receiver.id)} recovers; other athletes keep their lanes.`
        if (phase.time === hitTime) phase.cue = `${names(hitter)} meets the sample ball. ${names(receiver.id)} covers locally after first touch.`
      }
      const issue = serviceDiagnostics(team, s)[0] ?? movementIssue(s)
      if (issue) { reason = issue; continue }
      return { ok: true, scenario: s, receiver: receiver.id, setter: s.secondContact.player, hitter, message }
    }
  }
  return fail(reason)
}
