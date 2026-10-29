import type { Bundle, Scenario, Spot } from './rotationTypes.ts'
import type { LaterDefend, StrategyDraft, StrategyRotation } from './strategyDraft.ts'
import { sampleTrack } from './rotationModel.ts'
import { EXAMPLE_SCREEN } from './receiveExample.ts'

export type SourceEvent = {
  id: string; label: string; time: number; phaseOrdinal: number; occurrence: number; caseKey: string
  actors: string[]; frames: { player: string; ordinal: number; role: string }[]
  contacts: { ordinal: number; side: 'from' | 'to'; kind: string; owner?: string }[]
}
const caseOf = (s: Scenario) => `${s.rotation}/${s.serve}/${s.tactics?.opponentAttack}/${s.tactics?.firstTouch}`
const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const isSourceEventId = (id: string) => id.length <= 96 && /^p(?:[0-9]|[12][0-9]):[a-z0-9]+(?:-[a-z0-9]+)*(?::t(?:0|[1-9][0-9]{0,5}))?$/.test(id)

// Infer once from immutable source geometry; never reassign a toucher from an
// edited position. Named first/second/next setter identities outrank proximity.
export function sourceEndpointOwners(s: Scenario): (string | undefined)[][] {
  return s.ball.map(b => (['from', 'to'] as const).map(side => {
    const time = side === 'from' ? b.start : b.end, point = b[side]
    if (point.z < 0) return undefined
    if (time === s.firstContact.time) return s.firstContact.player
    if (time === s.secondContact.time) return s.secondContact.player
    if (b.kind === 'pass' && side === 'to') return s.tactics?.nextSetter
    const matches = Object.keys(s.tracks).filter(id => {
      const p = sampleTrack(s.tracks[id], time)
      return Math.hypot(p.x - point.x, p.z - point.z) < .4 &&
        (b.kind !== 'attack' || side !== 'from' || p.role === 'attack')
    })
    return matches.length === 1 ? matches[0] : undefined
  }))
}

export function sourceEvents(s: Scenario): SourceEvent[] {
  if (s.teachingOnly || !s.tactics) throw new Error('Event editing requires an authored case.')
  const times = new Set([...s.phases.map(p => p.time), ...s.ball.flatMap(b => [b.start, b.end]), ...Object.values(s.tracks).flatMap(t => t.map(f => f.time))])
  if (new Set(s.phases.map(p => p.time)).size !== s.phases.length) throw new Error('Ambiguous source event: duplicate phase times.')
  const owners = sourceEndpointOwners(s)
  let reception = 0
  return [...times].sort((a, b) => a - b).map(time => {
    if (!Number.isFinite(time) || Math.abs(time * 100 - Math.round(time * 100)) > 1e-6) throw new Error('Source event time requires bounded centisecond precision.')
    const phaseOrdinal = s.phases.map(p => p.time <= time).lastIndexOf(true), phase = s.phases[phaseOrdinal]
    if (!phase) throw new Error('Missing source phase for event.')
    const contacts: SourceEvent['contacts'] = s.ball.flatMap((b, ordinal) => (['from', 'to'] as const)
      .filter(side => (side === 'from' ? b.start : b.end) === time)
      .map(side => ({ ordinal, side, kind: b.kind, ...(owners[ordinal][side === 'from' ? 0 : 1] ? { owner: owners[ordinal][side === 'from' ? 0 : 1] } : {}) })))
    const frames = Object.entries(s.tracks).flatMap(([player, track]) => track.flatMap((f, ordinal) => f.time === time ? [{ player, ordinal, role: f.role }] : []))
    const named = phase.time === time, receiving = s.ball.some(b => b.kind === 'pass' && b.start === time)
    if (receiving) reception++
    const id = `p${phaseOrdinal}:${slug(phase.label)}${named ? '' : `:t${Math.round(time * 100)}`}`
    if (!isSourceEventId(id)) throw new Error('Source event identity exceeds supported bounds.')
    return { id, label: named ? phase.label : contacts.length ? `Ball ${contacts[0].kind} boundary` : 'Track frame', time, phaseOrdinal,
      occurrence: receiving ? reception : s.phases.slice(0, phaseOrdinal + 1).filter(p => p.label === phase.label).length,
      caseKey: caseOf(s), actors: [...new Set(contacts.flatMap(c => c.owner ? [c.owner] : []))], frames, contacts }
  })
}

export function requireSourceEvent(s: Scenario, id: string): SourceEvent {
  const matches = sourceEvents(s).filter(e => e.id === id)
  if (matches.length !== 1) throw new Error(`${caseOf(s)}: missing or ambiguous source event ${id}.`)
  return matches[0]
}

export function validateEventPatch(s: Scenario, id: string, patch: LaterDefend) {
  const event = requireSourceEvent(s, id), serve = s.ball[0].start
  for (const [player, point] of Object.entries(patch.anchors ?? {})) {
    const server = s.serve === 'us' && sourceEndpointOwners(s)[0][0] === player && event.time <= serve
    if (!s.tracks[player] || point.z > (server ? 12 : 9) || (server && point.z <= 9)) throw new Error(`${id}: event position must stay on our court (server behind endline through contact).`)
    if (event.time === s.secondContact.time && player === s.secondContact.player && point.z >= 3) throw new Error(`${id}: first setter target requires Z < 3.`)
  }
  for (const bends of Object.values(patch.routes ?? {})) {
    if (event.time <= serve) throw new Error(`${id}: incoming routes before service release are read-only.`)
    if (bends.some(p => p.z > 9)) throw new Error(`${id}: event route must stay on our court.`)
  }
}

// Validate against every affected source case, even when an exact event replaces
// a shared one. Imports cannot hide a stale shared ID behind a case exception.
export function validateStrategyEvents(base: Bundle, draft: StrategyDraft) {
  const scenarios = base.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])
  for (const [key, changes] of [...Object.entries(draft.overrides), ...Object.entries(draft.schemaVersion === 2 ? draft.caseOverrides ?? {} : {})]) {
    if (!changes.eventOverrides || !Object.keys(changes.eventOverrides).length) continue
    const affected = scenarios.filter(s => key === caseOf(s) || key === `${s.rotation}/${s.serve}`)
    if (!affected.length) throw new Error(`Missing authored case for event overrides: ${key}.`)
    for (const s of affected) for (const [id, patch] of Object.entries(changes.eventOverrides)) validateEventPatch(s, id, patch)
  }
}

export function eventRouteInterval(s: Scenario, id: string, player: string): { start: number; end: number } {
  const event = requireSourceEvent(s, id)
  const priorFrame = s.tracks[player]?.filter(f => f.time < event.time).at(-1)?.time ?? event.time
  return { start: Math.max(s.ball[0].start, priorFrame), end: event.time }
}

export function applyEventOverrides(source: Scenario, s: Scenario, changes: StrategyRotation, warnings: string[]) {
  for (const event of sourceEvents(source)) {
    const patch = changes.eventOverrides?.[event.id]
    if (!patch) continue
    const ids = new Set([...Object.keys(patch.anchors ?? {}), ...Object.keys(patch.routes ?? {})])
    for (const id of ids) {
      const track = s.tracks[id], point = patch.anchors?.[id as keyof NonNullable<LaterDefend['anchors']>]
      const bends = patch.routes?.[id as keyof NonNullable<LaterDefend['routes']>]
      if (event.time <= s.ball[0].start) {
        if (point) for (const frame of track.filter(f => f.time <= s.ball[0].start)) Object.assign(frame, point)
        continue
      }
      let frame = track.find(f => f.time === event.time)
      if (!frame) {
        const previous = track.filter(f => f.time < event.time).at(-1)!
        // Preserve discrete source metadata; sampling's computed facing is not
        // a new authored field. Only this boundary receives an inserted frame.
        frame = { ...previous, ...xy(sampleTrack(track, event.time)), time: event.time }
        delete frame.via
        track.push(frame); track.sort((a, b) => a.time - b.time)
      }
      if (point) Object.assign(frame, point)
      if (bends !== undefined) frame.via = bends.map(xy)
      if (point && event.time === s.secondContact.time && id === s.secondContact.player) s.setterTarget = xy(point)
      const index = track.indexOf(frame)
      for (const i of [index, index + 1]) if (i > 0 && i < track.length) {
        const a = track[i - 1], b = track[i], path = [a, ...(b.via ?? []), b]
        const length = path.slice(1).reduce((n, p, j) => n + Math.hypot(p.x - path[j].x, p.z - path[j].z), 0)
        if (1.5 * length / (b.time - a.time) > EXAMPLE_SCREEN.peakSpeed) warnings.push(`${caseOf(source)}: ${id} at ${event.label} (${event.time.toFixed(2)} s) exceeds the teaching movement screen; review the route and source time.`)
      }
    }
  }
}
const xy = (p: Spot): Spot => ({ x: p.x, z: p.z })
