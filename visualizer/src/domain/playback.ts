import type { Case, Contact } from './contracts.ts'
import { sampleArc, sampleTrack } from '../lib/rotationModel.ts'
import type { BallSegment, Keyframe, Point, Role } from '../lib/rotationTypes.ts'

const role: Record<Case['moments'][number]['athletes'][number]['duty'], Role> = {
  ready: 'start', serve: 'serve', receive: 'receive', set: 'set', attack: 'attack',
  block: 'block', cover: 'help', recover: 'recover', defend: 'defend',
}

export function compile(scenario: Case) {
  const moments = [...scenario.moments].sort((a, b) => a.ms - b.ms)
  const tracks: Record<string, Keyframe[]> = Object.fromEntries(moments[0].athletes.map(a => [a.slot, []]))
  for (const moment of moments) {
    for (const athlete of moment.athletes) {
      tracks[athlete.slot].push({ ...athlete.position, time: moment.ms / 1000, role: role[athlete.duty], via: athlete.route })
    }
  }
  const states = new Map(moments.map(m => [m.id, m]))
  const endpoints = new Map(scenario.contacts.map(c => {
    const at = states.get(c.moment)!
    const actor = c.actor
    const point: Point = actor.kind === 'slot'
      ? { ...at.athletes.find(a => a.slot === actor.slot)!.position, y: actor.y }
      : actor.point
    return [c.id, { time: at.ms / 1000, point, contact: c }]
  }))
  const trajectoryKind: Partial<Record<Contact['kind'], BallSegment['kind']>> = {
    serve: 'serve', pass: 'pass', dig: 'pass', set: 'set', attack: 'attack',
  }
  const ball = scenario.flights.map(f => {
    const a = endpoints.get(f.from)!, b = endpoints.get(f.to)!
    return { kind: trajectoryKind[a.contact.kind] ?? 'return', start: a.time, end: b.time,
      from: a.point, to: b.point, height: Math.max(f.apex, a.point.y, b.point.y) }
  }).sort((a, b) => a.start - b.start)
  const duration = moments.at(-1)!.ms / 1000
  return { moments, tracks, ball, duration }
}

export function playbackAt(compiled: ReturnType<typeof compile>, time: number) {
  const flight = compiled.ball.find(b => b.start <= time && b.end >= time)
  return { positions: Object.fromEntries(Object.entries(compiled.tracks).map(([id, track]) => [id, sampleTrack(track, time)])),
    ball: flight && sampleArc(flight, (time - flight.start) / (flight.end - flight.start)) }
}
