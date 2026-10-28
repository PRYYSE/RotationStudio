import type { Bundle, Team, Scenario, Keyframe, Point, Spot } from './rotationTypes.ts'
import { isFront, positionOf, rotationOrder, sampleTrack } from './rotationModel.ts'

const DEMO = 'TRAINING DEMO / UNAPPROVED'
const roles = ['start', 'serve', 'receive', 'pass', 'set', 'attack', 'block', 'help', 'defend', 'recover']
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const spot = (v: unknown): v is Spot & Record<string, unknown> => object(v) && finite(v.x) && Math.abs(v.x) <= 4.5 && finite(v.z) && v.z >= 0 && v.z <= 12
const point = (v: unknown): v is Point & Record<string, unknown> => object(v) && finite(v.x) && Math.abs(v.x) <= 6 && finite(v.z) && Math.abs(v.z) <= 12 && finite(v.y) && v.y >= 0 && v.y <= 10
const oneOf = (v: unknown, values: string[]): v is string => typeof v === 'string' && values.includes(v)
const at = (v: unknown, duration: number): v is number => finite(v) && v >= 0 && v <= duration

export function serviceDiagnostics(team: Team, scenario: Scenario): string[] {
  const order = rotationOrder(team.initialOrder, scenario.rotation - 1)
  // Conservative avatar-centre model, not a referee's foot-contact ruling.
  // Apply ordering for our modelled team under BOTH serve owners (TTGVA).
  const p = (n: number) => sampleTrack(scenario.tracks[order[n - 1]], scenario.ball[0].start)
  const name = (n: number) => team.players.find((v) => v.id === order[n - 1])!.name
  const errors: string[] = []
  for (const row of [[4, 3, 2], [5, 6, 1]]) {
    for (let i = 0; i < 2; i++) if (p(row[i]).x >= p(row[i + 1]).x) {
      errors.push(`${name(row[i])} (P${row[i]}) must be left of ${name(row[i + 1])} (P${row[i + 1]}) at service contact.`)
    }
  }
  for (const [back, front] of [[5, 4], [6, 3], [1, 2]]) {
    if (p(back).z <= p(front).z) errors.push(`${name(back)} (P${back}) must be behind ${name(front)} (P${front}) at service contact.`)
  }
  for (let n = 1; n <= 6; n++) {
    const server = n === 1 && scenario.serve === 'us'
    if (server ? p(n).z <= 9 : p(n).z >= 9) errors.push(`${name(n)} (P${n}) must be ${server ? 'beyond the 9m endline to serve' : 'inside the court'} at service contact.`)
  }
  return errors
}

// Check unknown JSON before touching nested values; never trust an import cast.
export function validateBundle(value: unknown): string[] {
  const errors: string[] = []
  if (!object(value) || !object(value.team) || !object(value.plans)) return ['Expected an object with team and plans.']
  const { team, plans } = value
  if (team.schemaVersion !== 1 || plans.schemaVersion !== 1) errors.push('Unsupported schemaVersion. Both files require version 1.')
  if (!oneOf(team.status, [DEMO, 'DRAFT', 'APPROVED']) || team.status !== plans.status) errors.push(`Both files require matching status: "${DEMO}", "DRAFT" or "APPROVED".`)
  if (!Array.isArray(team.players) || team.players.length !== 6) return [...errors, 'team.players must contain exactly six athletes.']
  const ids: string[] = []
  for (const p of team.players) {
    if (!object(p) || typeof p.id !== 'string' || !/^[a-z][a-z0-9-]{0,31}$/.test(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 40 || typeof p.setter !== 'boolean' || typeof p.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(p.color)) {
      errors.push('Each athlete needs a stable id, name (1–40 characters), setter boolean and #rrggbb color.')
    } else ids.push(p.id)
  }
  if (new Set(ids).size !== 6) errors.push('Athlete IDs must be unique.')
  if (team.players.filter((p) => object(p) && p.setter === true).length !== 1) errors.push('Tag exactly one primary setter.')
  if (!Array.isArray(team.initialOrder) || team.initialOrder.length !== 6 || new Set(team.initialOrder).size !== 6 || team.initialOrder.some((id) => !ids.includes(id))) errors.push('initialOrder must list each athlete once, in P1..P6 order.')
  if (!finite(plans.netHeight) || plans.netHeight < 2 || plans.netHeight > 2.6) errors.push('netHeight must be 2.0–2.6 metres.')
  if (!Array.isArray(plans.scenarios) || plans.scenarios.length !== 12) return [...errors, 'plans.scenarios must contain all 12 rotation / serve combinations.']
  if (errors.length) return errors
  const typedTeam = team as unknown as Team
  const seen = new Set<string>()
  const entries: { raw: unknown; variant: string; base?: Record<string, unknown> }[] = []
  for (const base of plans.scenarios) {
    entries.push({ raw: base, variant: 'base' })
    if (!object(base) || base.alternates === undefined) continue
    const tag = `R${finite(base.rotation) ? base.rotation : '?'} / ${oneOf(base.serve, ['they', 'us']) ? base.serve : '?'}: alternates`
    if (!object(base.alternates) || Object.keys(base.alternates).length !== 3 ||
      ['right', 'harry', 'harryRight'].some((key) => !object((base.alternates as Record<string, unknown>)[key]))) {
      errors.push(`${tag} must contain full right, harry and harryRight scenarios.`)
    }
    if (!object(base.tactics)) errors.push(`${tag} require base tactics metadata.`)
    if (object(base.alternates)) for (const [variant, raw] of Object.entries(base.alternates)) {
      entries.push({ raw, variant, base })
    }
  }
  for (const { raw, variant, base } of entries) {
    const before = errors.length
    if (!object(raw)) { errors.push('Each scenario must be an object.'); continue }
    if (!finite(raw.rotation) || !Number.isInteger(raw.rotation) || raw.rotation < 1 || raw.rotation > 6 || !oneOf(raw.serve, ['they', 'us'])) {
      errors.push('Scenario: invalid rotation or serve owner.'); continue
    }
    const tag = `R${raw.rotation} / ${raw.serve} / ${variant}`
    const error = (message: string) => errors.push(`${tag}: ${message}`)
    const key = `${raw.rotation}/${raw.serve}`
    if (!base) {
      if (seen.has(key)) error('duplicate scenario.')
      seen.add(key)
    } else {
      if (raw.rotation !== base.rotation || raw.serve !== base.serve) error('alternate must match base rotation and serve owner.')
      if (raw.alternates !== undefined) error('alternate cannot contain nested alternates.')
      if (!object(raw.tactics)) error('alternate requires tactics metadata.')
    }
    if (raw.tactics !== undefined) {
      const t = raw.tactics
      if (!object(t)) error('tactics must be an object.')
      else {
        const expectedAttack = variant === 'right' || variant === 'harryRight' ? 'right' : 'left'
        const expectedTouch = variant === 'harry' || variant === 'harryRight' ? 'harry' : 'normal'
        if (!oneOf(t.opponentAttack, ['left', 'right']) || t.opponentAttack !== expectedAttack) error('tactics.opponentAttack must match the authored variant (left/right).')
        if (!oneOf(t.firstTouch, ['normal', 'harry']) || t.firstTouch !== expectedTouch) error('tactics.firstTouch must match the authored variant (normal/harry).')
        for (const id of ['fallbackSetter', 'nextSetter']) {
          if (typeof t[id] !== 'string' || !ids.includes(t[id] as string)) error(`tactics.${id} must name an athlete.`)
        }
        if (t.fallbackSetter === typedTeam.players.find((p) => p.setter)?.id) error('fallbackSetter must be a local backup, not the primary setter.')
        if (typeof t.coachNote !== 'string' || !t.coachNote.trim() || t.coachNote.length > 500) error('tactics.coachNote needs 1–500 characters.')
        if (!Array.isArray(t.receiveZones) || t.receiveZones.length > 6) error('tactics.receiveZones must be an array of up to six areas.')
        else {
          const zonePlayers = new Set<string>()
          for (const z of t.receiveZones) {
            // Authored area edges may overhang a sideline by 5cm. Keep that
            // small visual tolerance; centres must remain inside the court.
            if (!object(z) || typeof z.player !== 'string' || !ids.includes(z.player) || zonePlayers.has(z.player) ||
              !spot(z.center) || z.center.z > 9 || !finite(z.radiusX) || z.radiusX <= 0 || z.radiusX > 4.5 ||
              !finite(z.radiusZ) || z.radiusZ <= 0 || z.radiusZ > 9 ||
              Math.abs(z.center.x) + z.radiusX > 4.55 + 1e-9 || z.center.z - z.radiusZ < -0.01 || z.center.z + z.radiusZ > 9.01 ||
              !oneOf(z.duty, ['primary', 'assist', 'compact']) || typeof z.label !== 'string' || !z.label.trim() || z.label.length > 80) {
              error('invalid receive zone: athlete, center/bounds, positive radii, duty or label.'); continue
            }
            zonePlayers.add(z.player)
          }
        }
        if (t.firstTouch === 'harry' && object(raw.firstContact) && object(raw.secondContact) &&
          (raw.firstContact.player !== 'harry' || raw.secondContact.player !== t.fallbackSetter)) error('Harry-first contacts must name Harry then the authored fallbackSetter.')
        if (t.firstTouch === 'normal' && object(raw.firstContact) && raw.firstContact.player === 'harry') error('Normal first contact cannot name Harry; use an authored Harry-first alternate.')
      }
    }
    if (!finite(raw.duration) || raw.duration < 1 || raw.duration > 120) { error('duration must be 1–120 seconds.'); continue }
    const duration = raw.duration
    if (!spot(raw.setterTarget) || Number((raw.setterTarget as Record<string, unknown>)?.z) >= 3) error('setterTarget must be on our court, within 3m of net.')
    if (!Array.isArray(raw.phases) || raw.phases.length < 7 || raw.phases.length > 30) error('provide 7–30 named phases.')
    else {
      let prev = -1
      for (const p of raw.phases) {
        if (!object(p) || !at(p.time, duration) || p.time <= prev || typeof p.label !== 'string' || !p.label.trim() || typeof p.cue !== 'string' || !p.cue.trim() || !oneOf(p.section, ['Receive', 'Attack', 'Defend'])) { error('phases need increasing times, labels, cues and Receive/Attack/Defend sections.'); break }
        prev = p.time
      }
      if ((raw.phases[0] as Record<string, unknown>)?.time !== 0) error('first phase must start at 0.')
    }
    if (!object(raw.tracks) || Object.keys(raw.tracks).length !== 6 || ids.some((id) => !Array.isArray((raw.tracks as Record<string, unknown>)[id]))) { error('tracks must name exactly the six athlete IDs.'); continue }
    for (const id of ids) {
      const track = raw.tracks[id] as unknown[]
      if (track.length < 2 || track.length > 200) { error(`${id}: provide 2–200 keyframes.`); continue }
      let prev = -1
      for (const k of track) {
        if (!object(k) || !spot(k) || !at(k.time, duration) || k.time <= prev || !oneOf(k.role, roles) || (k.facing !== undefined && !finite(k.facing)) || (k.via !== undefined && (!Array.isArray(k.via) || k.via.length > 20 || !k.via.every(spot)))) { error(`${id}: invalid coordinate, role, waypoint or non-increasing keyframe time.`); break }
        prev = k.time
        const front = isFront(positionOf(typedTeam, Number(raw.rotation), id))
        if (k.role === 'block' && !front) error(`${id} is back-row and cannot block (rotation identity is fixed).`)
        if (k.aboveNet !== undefined && typeof k.aboveNet !== 'boolean') error(`${id}: aboveNet must be boolean.`)
        if (k.role === 'attack') {
          if (typeof k.aboveNet !== 'boolean' || !finite(k.takeoffZ) || k.takeoffZ < 0 || k.takeoffZ > 9) error(`${id}: attack requires aboveNet and takeoffZ metadata.`)
          else if (!front && k.aboveNet && k.takeoffZ < 3) error(`${id}: above-net back-row attack takes off inside 3m.`)
        }
      }
      if ((track[0] as Keyframe)?.time !== 0 || (track[track.length - 1] as Keyframe)?.time !== duration) error(`${id}: track must span 0..duration.`)
      if (base && object(base.tracks) && Array.isArray(base.tracks[id])) {
        const start = (base.tracks[id] as unknown[])[0], alternate = track[0]
        if (!object(start) || !object(alternate) || start.x !== alternate.x || start.z !== alternate.z) error(`${id}: alternate must share the same starting coordinates as base.`)
      }
    }
    for (const key of ['firstContact', 'secondContact']) {
      const contact = raw[key]
      if (!object(contact) || typeof contact.player !== 'string' || !ids.includes(contact.player) || !at(contact.time, duration)) error(`${key} needs a named athlete and valid time.`)
    }
    if (errors.length > before) continue
    const s = raw as unknown as Scenario
    if (s.secondContact.time <= s.firstContact.time) error('second contact must follow first contact.')
    if (s.firstContact.player === s.secondContact.player) error('First and second contacts need different athletes; author a fallback setter.')
    const contact = sampleTrack(s.tracks[s.secondContact.player], s.secondContact.time)
    if (Math.hypot(contact.x - s.setterTarget.x, contact.z - s.setterTarget.z) > 0.4) error('second-contact athlete must reach setterTarget in time.')
    if (!Array.isArray(raw.ball) || raw.ball.length < 2 || raw.ball.length > 30) { error('provide 2–30 ball segments.'); continue }
    let lastEnd = -1
    for (const b of raw.ball) {
      if (!object(b) || !oneOf(b.kind, ['serve', 'return', 'pass', 'set', 'attack']) || !point(b.from) || !point(b.to) || !at(b.start, duration) || !at(b.end, duration) || b.end <= b.start || b.start < lastEnd || !finite(b.height) || b.height < Math.max(Number(b.from.y), Number(b.to.y)) || b.height > 10) { error('invalid ball segment endpoints, times, apex or ordering.'); break }
      lastEnd = b.end
    }
    if (errors.length > before) continue
    const pass = s.ball.find((b) => b.kind === 'pass')
    const serve = s.ball[0]
    if (serve.kind !== 'serve' || serve.start < 1) error('Start must hold at least 1s before service flight.')
    if (serve.from.z * (s.serve === 'us' ? 1 : -1) <= 9 || serve.to.z * (s.serve === 'us' ? -1 : 1) <= 0) error('serve must travel from behind the correct endline to the opposite half.')
    for (const [id, track] of Object.entries(s.tracks)) {
      const start = track[0]
      // Easing starts in the preceding interval, even if its arrival frame is after service.
      // Inspect the entire incoming path to catch an excursion that returns to its start.
      if (track.some((k, i) => i > 0 && track[i - 1].time < serve.start && [k, ...(k.via ?? [])].some((v) => Math.hypot(v.x - start.x, v.z - start.z) > 0.01))) error(id + ': hold service-contact spots until service flight begins.')
    }
    if (s.serve === 'us') {
      const server = sampleTrack(s.tracks[rotationOrder(typedTeam.initialOrder, s.rotation - 1)[0]], serve.start)
      if (Math.hypot(serve.from.x - server.x, serve.from.z - server.z) > 0.5) error('our serve must originate from the P1 server.')
    }
    const first = sampleTrack(s.tracks[s.firstContact.player], s.firstContact.time)
    if (!pass || Math.abs(pass.start - s.firstContact.time) > 0.01 || Math.abs(pass.end - s.secondContact.time) > 0.01 || Math.hypot(pass.from.x - first.x, pass.from.z - first.z) > 0.4 || Math.hypot(pass.to.x - s.setterTarget.x, pass.to.z - s.setterTarget.z) > 0.01) error('pass must connect the first-contact athlete/time to setterTarget/second-contact time.')
    for (let i = 1; i < s.ball.length; i++) {
      const a = s.ball[i - 1].to, b = s.ball[i].from
      if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) > 0.01) error('consecutive ball segments must share endpoints (no teleports).')
    }
    if (s.tactics) for (const later of s.ball.filter((b) => b.kind === 'pass').slice(1)) {
      const receiver = Object.values(s.tracks).some((track) => {
        const p = sampleTrack(track, later.start)
        return Math.hypot(p.x - later.from.x, p.z - later.from.z) <= 0.4
      })
      const setter = sampleTrack(s.tracks[s.tactics.nextSetter], later.end)
      if (!receiver || Math.hypot(setter.x - later.to.x, setter.z - later.to.z) > 0.4) error('next pass must connect an authored receiver to nextSetter at contact times.')
    }
    errors.push(...serviceDiagnostics(typedTeam, s).map((e) => `${tag}: ${e}`))
  }
  return errors
}
export function parseBundle(text: string): Bundle {
  const value: unknown = JSON.parse(text)
  const errors = validateBundle(value)
  if (errors.length) throw new Error(errors.join('\n'))
  return value as Bundle
}
export function exportBundle(bundle: Bundle): string {
  const errors = validateBundle(bundle)
  if (errors.length) throw new Error(errors.join('\n'))
  return JSON.stringify(bundle, null, 2) + '\n'
}
export async function loadBundle(base: string, fetcher: typeof fetch = fetch): Promise<Bundle> {
  const [team, plans] = await Promise.all(['team', 'rotations'].map(async (name) => {
    const response = await fetcher(`${base}plans/${name}.json`, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`Cannot load ${name}.json (${response.status}).`)
    return response.json() as Promise<unknown>
  }))
  const value = { team, plans }
  const errors = validateBundle(value)
  if (errors.length) throw new Error(errors.join('\n'))
  return value as Bundle
}
