import type { Bundle, Keyframe, Scenario, Spot } from './rotationTypes.ts'
import type { PlayerId, RotationKey, StrategyDraft, StrategyRotation, StrategyStage } from './strategyDraft.ts'
import { BASE_REVISION, laterDefendTime, scenarioCaseKey, STAGES, stageOrder, stageTimes, validateStrategy } from './strategyDraft.ts'
import { isFront, positionOf, sampleTrack } from './rotationModel.ts'
import { validateBundle } from './rotationValidation.ts'
import { EXAMPLE_SCREEN } from './receiveExample.ts'
import { applyEventOverrides, sourceEndpointOwners, validateStrategyEvents } from './strategyEvents.ts'

// Merge sparse player maps, replacing each route as a whole (including []).
// Resolve once against source, then apply once: a shared route must never leave
// intermediate geometry behind when a case replaces its destination or bends.
export function resolveStrategyRotation(draft: StrategyDraft, s: Scenario): StrategyRotation {
  const shared = draft.overrides[`${s.rotation}/${s.serve}` as RotationKey] ?? {}
  const key = scenarioCaseKey(s), exact = draft.schemaVersion === 2 && key ? draft.caseOverrides?.[key] : undefined
  if (!exact) return shared
  const merged = { ...shared, ...exact }
  for (const field of ['anchors', 'routes', 'coverage'] as const) {
    if (!shared[field] && !exact[field]) continue
    // Each map has identical stage/player keys; route values remain arrays.
    const stages = {} as NonNullable<StrategyRotation[typeof field]>
    for (const stage of STAGES) if (shared[field]?.[stage] || exact[field]?.[stage]) {
      Object.assign(stages, { [stage]: { ...shared[field]?.[stage], ...exact[field]?.[stage] } })
    }
    Object.assign(merged, { [field]: stages })
  }
  if (shared.laterDefend || exact.laterDefend) merged.laterDefend = {
    anchors: { ...shared.laterDefend?.anchors, ...exact.laterDefend?.anchors },
    routes: { ...shared.laterDefend?.routes, ...exact.laterDefend?.routes },
    ...((shared.laterDefend?.coverage || exact.laterDefend?.coverage) ? { coverage: { ...shared.laterDefend?.coverage, ...exact.laterDefend?.coverage } } : {})
  }
  if (shared.eventOverrides || exact.eventOverrides) {
    merged.eventOverrides = { ...shared.eventOverrides }
    for (const [id, patch] of Object.entries(exact.eventOverrides ?? {})) {
      const inherited = shared.eventOverrides?.[id]
      merged.eventOverrides[id] = {}
      for (const field of ['anchors', 'routes', 'coverage'] as const) if (inherited?.[field] || patch[field]) {
        Object.assign(merged.eventOverrides[id], { [field]: { ...inherited?.[field], ...patch[field] } })
      }
    }
  }
  return merged
}

const xy = (p: Spot): Spot => ({ x: p.x, z: p.z })
function frameAt(track: Keyframe[], time: number) {
  let frame = track.find(k => k.time === time)
  if (!frame) {
    frame = { ...sampleTrack(track, time), time }
    delete frame.via
    track.push(frame); track.sort((a, b) => a.time - b.time)
  }
  return frame
}
// Partition a coach's incoming polyline at the existing event frames. Retain
// their role/eligibility metadata and preserve continuous position at every join.
function route(track: Keyframe[], start: number, end: number, bends: Spot[]) {
  const a = frameAt(track, start), b = frameAt(track, end)
  const path = [xy(a), ...bends, xy(b)]
  const lengths = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.z - path[i].z))
  const total = lengths.reduce((v, n) => v + n, 0)
  const fractions = [0]
  lengths.forEach(n => fractions.push(fractions.at(-1)! + (total ? n / total : 0)))
  const source: Keyframe[] = [{ ...a, time: start }, { ...b, time: end, via: bends }]
  const frames = track.filter(k => k.time > start && k.time <= end)
  let previous = 0
  for (const k of frames) {
    const t = (k.time - start) / (end - start), fraction = t * t * (3 - 2 * t)
    const p = sampleTrack(source, k.time)
    Object.assign(k, xy(p))
    k.via = path.filter((_, i) => i > 0 && i < path.length - 1 && fractions[i] > previous && fractions[i] < fraction).map(xy)
    previous = fraction
  }
}
function applyScenario(team: Bundle['team'], s: Scenario, changes: StrategyRotation, warnings: string[]) {
  const times = stageTimes(s), order = stageOrder(s.serve), serveTime = s.ball[0].start
  // Set assistance is an explicit user action, never a default on a new copy.
  // Retain V3 attack identity; prepare every eligible front-row option, not a
  // replacement hitter selected by an optimisation heuristic.
  const front = team.players.filter(p => isFront(positionOf(team, s.rotation, p.id)) && p.id !== s.secondContact.player)
    .sort((a, b) => sampleTrack(s.tracks[a.id], times.Set).x - sampleTrack(s.tracks[b.id], times.Set).x)
  if (changes.readyOptions) front.forEach((p, i) => Object.assign(frameAt(s.tracks[p.id], times.Set), { x: front.length === 1 ? 0 : -3.1 + i * 6.2 / (front.length - 1), z: 3.4, role: 'help' }))
  for (const stage of order) {
    if (stage === 'Start') {
      for (const [id, point] of Object.entries(changes.anchors?.Start ?? {})) {
        frameAt(s.tracks[id], serveTime)
        for (const frame of s.tracks[id].filter(k => k.time <= serveTime)) {
          Object.assign(frame, point)
          delete frame.via
        }
        if (s.serve === 'us' && positionOf(team, s.rotation, id) === 1) Object.assign(s.ball[0].from, point)
      }
      continue
    }
    const time = times[stage]
    for (const [id, point] of Object.entries(changes.anchors?.[stage] ?? {})) {
      Object.assign(frameAt(s.tracks[id], time), point)
      // One Defend tab also controls the later defensive ready formation.
      if (stage === 'Defend' && s.serve === 'us') for (const frame of s.tracks[id]) {
        if (frame.time > times.Attack && ['defend', 'block'].includes(frame.role)) Object.assign(frame, point)
      }
    }
  }
  const setterPoint = changes.setterTarget ?? changes.anchors?.Set?.[s.secondContact.player as PlayerId] ?? s.setterTarget
  s.setterTarget = xy(setterPoint)
  Object.assign(frameAt(s.tracks[s.secondContact.player], times.Set), setterPoint)
  for (const stage of order.filter(v => v !== 'Start')) {
    const previous = order[order.indexOf(stage) - 1]
    for (const [id, bends] of Object.entries(changes.routes?.[stage] ?? {})) {
      route(s.tracks[id], Math.max(serveTime, times[previous]), times[stage], bends)
    }
  }
  if (changes.laterDefend && Object.values(changes.laterDefend).some(v => v && Object.keys(v).length)) {
    const time = laterDefendTime(s), tag = scenarioCaseKey(s)
    if (time === undefined) warnings.push(`${tag}: Defend again event missing; later defence was not applied.`)
    else {
      // Preserve the next named reception and every following contact/recovery.
      // Incoming motion starts at our hit; no change to the first defence or
      // earlier contacts, and no invented contact identity at the new anchor.
      const nextContact = Math.min(s.duration, ...s.ball.flatMap(b => [
        ...(b.start > time && b.from.z >= 0 ? [b.start] : []),
        ...(b.end > time && b.to.z >= 0 ? [b.end] : [])
      ]))
      for (const [id, point] of Object.entries(changes.laterDefend.anchors ?? {})) {
        Object.assign(frameAt(s.tracks[id], time), point)
        for (const frame of s.tracks[id]) if (frame.time > time && frame.time < nextContact && ['defend', 'block', 'recover'].includes(frame.role)) Object.assign(frame, point)
      }
      for (const [id, bends] of Object.entries(changes.laterDefend.routes ?? {})) route(s.tracks[id], times.Attack, time, bends)
      for (const id of new Set([...Object.keys(changes.laterDefend.anchors ?? {}), ...Object.keys(changes.laterDefend.routes ?? {})])) {
        const track = s.tracks[id]
        if (track.some((b, i) => {
          if (!i || b.time <= times.Attack || track[i - 1].time >= nextContact) return false
          const a = track[i - 1], path = [a, ...(b.via ?? []), b]
          const length = path.slice(1).reduce((sum, p, j) => sum + Math.hypot(p.x - path[j].x, p.z - path[j].z), 0)
          return 1.5 * length / (b.time - a.time) > EXAMPLE_SCREEN.peakSpeed
        })) warnings.push(`${tag}: ${id} later defence exceeds the teaching movement screen; check the authored time before the next contact.`)
      }
    }
  }
  // Contacts are linked by original athlete + event identity, including later
  // digs and next-set contacts affected by reusing the Defend formation.
  for (let i = 0; i < s.ball.length; i++) {
    const b = s.ball[i]
    for (const side of ['from', 'to'] as const) {
      const time = side === 'from' ? b.start : b.end
      let id: string | undefined
      if (time === s.firstContact.time) id = s.firstContact.player
      else if (time === s.secondContact.time) id = s.secondContact.player
      else if (time === times.Attack) id = Object.keys(s.tracks).find(id => {
        const old = sampleTrack(s.tracks[id], time)
        return old.role === 'attack' && Math.hypot(old.x - b[side].x, old.z - b[side].z) < .4
      })
      // Later passes have stable nextSetter semantics; infer their receiver
      // from the original contacts before positions were overridden (below).
      if (id && time > serveTime) Object.assign(b[side], xy(sampleTrack(s.tracks[id], time)))
    }
  }
}
export function applyStrategyOverlay(base: Bundle, draft: StrategyDraft): { bundle: Bundle; warnings: string[] } {
  validateStrategy(draft)
  validateStrategyEvents(base, draft)
  const bundle = structuredClone(base), warnings = ['Foundation needs tactical review. Authored hitter, timing and alternates remain templates, not optimised choreography.']
  if (draft.baseRevision !== BASE_REVISION) warnings.push(`Different base revision ${draft.baseRevision}; this browser uses ${BASE_REVISION}. Review all mappings before use.`)
  bundle.team.status = bundle.plans.status = 'DRAFT'
  for (const root of bundle.plans.scenarios) for (const s of [root, ...Object.values(root.alternates ?? {})]) {
    const changes = resolveStrategyRotation(draft, s)
    if (!Object.keys(changes).length) continue
    const tag = scenarioCaseKey(s) ?? `${s.rotation}/${s.serve}`
    for (const [stage, players] of [...Object.entries(changes.coverage ?? {}), ['Later Defend', changes.laterDefend?.coverage] as const,
      ...Object.entries(changes.eventOverrides ?? {}).map(([id, patch]) => [id, patch.coverage] as const)]) {
      for (const [id, zone] of Object.entries(players ?? {})) if (zone.role === 'block' && !isFront(positionOf(bundle.team, s.rotation, id))) {
        warnings.push(`${tag}: ${id} is back-row; assigned block coverage at ${stage} needs review. Coverage does not change contact or track roles.`)
      }
    }
    // Coverage is display-only. Do not run geometric/contact reconstruction for
    // a zone-only strategy: even source frame serialization must stay identical.
    if (!changes.anchors && !changes.routes && changes.setterTarget === undefined && changes.readyOptions === undefined
      && !Object.keys(changes.laterDefend?.anchors ?? {}).length && !Object.keys(changes.laterDefend?.routes ?? {}).length
      && !Object.values(changes.eventOverrides ?? {}).some(p => Object.keys(p.anchors ?? {}).length || Object.keys(p.routes ?? {}).length)) continue
    const source = structuredClone(s)
    const times = stageTimes(s)
    // Record endpoint owners from immutable authored geometry BEFORE edits.
    const owners = s.ball.map(b => (['from', 'to'] as const).map(side => {
      const time = side === 'from' ? b.start : b.end
      if (time <= s.ball[0].start || b[side].z < 0) return undefined
      if (time === s.firstContact.time) return s.firstContact.player
      if (time === s.secondContact.time) return s.secondContact.player
      if (b.kind === 'pass' && side === 'to') return s.tactics?.nextSetter
      return Object.keys(s.tracks).find(id => {
        const p = sampleTrack(s.tracks[id], time)
        return Math.hypot(p.x - b[side].x, p.z - b[side].z) < .4 && (time !== times.Attack || p.role === 'attack')
      })
    }))
    const stageGeometry = changes.anchors || changes.routes || changes.setterTarget !== undefined || changes.readyOptions !== undefined
      || Object.keys(changes.laterDefend?.anchors ?? {}).length || Object.keys(changes.laterDefend?.routes ?? {}).length
    if (stageGeometry) applyScenario(bundle.team, s, changes, warnings)
    const eventGeometry = Object.values(changes.eventOverrides ?? {}).some(p => Object.keys(p.anchors ?? {}).length || Object.keys(p.routes ?? {}).length)
    if (eventGeometry) applyEventOverrides(source, s, changes, warnings)
    const sourceOwners = eventGeometry ? sourceEndpointOwners(source) : owners
    s.ball.forEach((b, i) => (['from', 'to'] as const).forEach((side, j) => {
      const id = sourceOwners[i][j]
      if (id) Object.assign(b[side], xy(sampleTrack(s.tracks[id], side === 'from' ? b.start : b.end)))
    }))
    // V3 supports holds between flights; endpoint links stay exact even then.
    for (let i = 1; i < s.ball.length; i++) s.ball[i].from = { ...s.ball[i - 1].to }
    if (eventGeometry) s.ball.forEach((b, i) => (['from', 'to'] as const).forEach((side, j) => {
      const id = sourceOwners[i][j], time = side === 'from' ? b.start : b.end
      if (!id) return
      const p = sampleTrack(s.tracks[id], time)
      if (Math.hypot(p.x - b[side].x, p.z - b[side].z) > 1e-6) warnings.push(`${tag}: source contact ${id} at ${time.toFixed(2)} s cannot be re-linked safely; timing and touch ownership remain read-only. Reset or review the event placement.`)
    }))
  }
  warnings.push(...validateBundle(bundle))
  return { bundle, warnings: [...new Set(warnings)] }
}

export function strategyPoint(draft: StrategyDraft | null, s: Scenario, stage: StrategyStage, id: string): Spot {
  if (id === 'target') return s.setterTarget
  const override = draft ? resolveStrategyRotation(draft, s).anchors?.[stage]?.[id as PlayerId] : undefined
  return stage === 'Start' && override ? override : sampleTrack(s.tracks[id], stageTimes(s)[stage])
}
