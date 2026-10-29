import type { Bundle, Keyframe, Scenario, Spot } from './rotationTypes.ts'
import type { PlayerId, RotationKey, StrategyDraft, StrategyRotation, StrategyStage } from './strategyDraft.ts'
import { BASE_REVISION, stageOrder, stageTimes, validateStrategy } from './strategyDraft.ts'
import { isFront, positionOf, sampleTrack } from './rotationModel.ts'
import { validateBundle } from './rotationValidation.ts'

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
function applyScenario(team: Bundle['team'], s: Scenario, changes: StrategyRotation) {
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
  const bundle = structuredClone(base), warnings = ['Foundation needs tactical review. Authored hitter, timing and alternates remain templates, not optimised choreography.']
  if (draft.baseRevision !== BASE_REVISION) warnings.push(`Different base revision ${draft.baseRevision}; this browser uses ${BASE_REVISION}. Review all mappings before use.`)
  bundle.team.status = bundle.plans.status = 'DRAFT'
  for (const root of bundle.plans.scenarios) for (const s of [root, ...Object.values(root.alternates ?? {})]) {
    const changes = draft.overrides[`${s.rotation}/${s.serve}` as RotationKey] ?? {}
    if (!Object.keys(changes).length) continue
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
    applyScenario(bundle.team, s, changes)
    s.ball.forEach((b, i) => (['from', 'to'] as const).forEach((side, j) => {
      const id = owners[i][j]
      if (id) Object.assign(b[side], xy(sampleTrack(s.tracks[id], side === 'from' ? b.start : b.end)))
    }))
    // V3 supports holds between flights; endpoint links stay exact even then.
    for (let i = 1; i < s.ball.length; i++) s.ball[i].from = { ...s.ball[i - 1].to }
  }
  warnings.push(...validateBundle(bundle))
  return { bundle, warnings: [...new Set(warnings)] }
}

export function strategyPoint(draft: StrategyDraft | null, s: Scenario, stage: StrategyStage, id: string): Spot {
  if (id === 'target') return s.setterTarget
  const override = draft?.overrides[`${s.rotation}/${s.serve}` as RotationKey]?.anchors?.[stage]?.[id as PlayerId]
  return stage === 'Start' && override ? override : sampleTrack(s.tracks[id], stageTimes(s)[stage])
}
