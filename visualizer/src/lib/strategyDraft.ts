import type { Bundle, FirstTouch, OpponentAttack, Scenario, ServeOwner, Spot } from './rotationTypes.ts'
import { applyStrategyOverlay } from './strategyOverlay.ts'
import { isSourceEventId } from './strategyEvents.ts'

export const BASE_REVISION = '8c0fb5d'
export const MAX_STRATEGY_BYTES = 100_000
export const PLAYER_IDS = ['harry', 'caleb', 'trent', 'logan', 'georgia', 'jaz'] as const
export type PlayerId = typeof PLAYER_IDS[number]
export const STAGES = ['Start', 'Receive', 'Set', 'Attack', 'Defend'] as const
export type StrategyStage = typeof STAGES[number]
export type RotationKey = `${1 | 2 | 3 | 4 | 5 | 6}/${ServeOwner}`
export type CaseKey = `${RotationKey}/${OpponentAttack}/${FirstTouch}`
export const COVERAGE_ROLES = ['receive', 'tip', 'block', 'deep', 'attack-cover', 'setter-support', 'custom'] as const
export type CoverageZone = {
  role: typeof COVERAGE_ROLES[number]; radiusX: number; radiusZ: number; offsetX?: number; offsetZ?: number
}
export type LaterDefend = {
  anchors?: Partial<Record<PlayerId, Spot>>
  routes?: Partial<Record<PlayerId, Spot[]>>
  coverage?: Partial<Record<PlayerId, CoverageZone>>
}
export type StrategyRotation = {
  readyOptions?: boolean // Set formation: prepare eligible front hitters, retaining the active setter.
  anchors?: Partial<Record<StrategyStage, Partial<Record<PlayerId, Spot>>>>
  routes?: Partial<Record<StrategyStage, Partial<Record<PlayerId, Spot[]>>>>
  setterTarget?: Spot
  laterDefend?: LaterDefend
  coverage?: Partial<Record<StrategyStage, Partial<Record<PlayerId, CoverageZone>>>>
  eventOverrides?: Record<string, LaterDefend>
}
export type CoachInstruction = { primary?: string; ifDifferent?: string; fallback?: string; teamCall?: string }
export type CoachNotes = {
  team?: Partial<Record<RotationKey, Partial<Record<StrategyStage, string>>>>
  players?: Partial<Record<RotationKey, Partial<Record<StrategyStage, Partial<Record<PlayerId, CoachInstruction>>>>>>
}
type StrategyFields = {
  kind: 'rotation-studio-strategy'
  id: string
  name: string
  author: string
  baseRevision: string
  overrides: Partial<Record<RotationKey, StrategyRotation>>
}
export type StrategyDraftV1 = StrategyFields & { schemaVersion: 1 }
export type StrategyDraftV2 = StrategyFields & {
  schemaVersion: 2
  caseOverrides?: Partial<Record<CaseKey, StrategyRotation>>
  notes?: CoachNotes
}
export type StrategyDraft = StrategyDraftV1 | StrategyDraftV2
export const MAX_NOTES_CHARACTERS = 20_000
export const isCaseKey = (key: string): key is CaseKey => /^[1-6]\/(they|us)\/(left|right)\/(normal|harry)$/.test(key)
export function scenarioCaseKey(s: Scenario): CaseKey | undefined {
  return s.tactics ? `${s.rotation}/${s.serve}/${s.tactics.opponentAttack}/${s.tactics.firstTouch}` as CaseKey : undefined
}
export function laterDefendTime(s: Scenario): number | undefined {
  const time = s.serve === 'us' ? s.phases.find(p => p.label === 'Defend again')?.time : undefined
  return time !== undefined && time > stageTimes(s).Attack ? time : undefined
}
export function stageOrder(serve: ServeOwner): StrategyStage[] {
  return serve === 'us' ? ['Start', 'Defend', 'Receive', 'Set', 'Attack'] : [...STAGES]
}
export function stageTimes(s: Scenario): Record<StrategyStage, number> {
  const event = (label: string) => {
    const p = s.phases.find(p => p.label === label)
    if (!p) throw new Error(`Missing V3 event: ${label}`)
    return p.time
  }
  return { Start: s.phases[0].time, Receive: s.firstContact.time, Set: s.secondContact.time,
    Attack: event('Our attack'), Defend: event('Defence ready') }
}
// Selection represents an event, not the longer tactical transition around it.
export function selectedEvent(s: Scenario, time: number): StrategyStage | undefined {
  const times = stageTimes(s)
  return stageOrder(s.serve).find(stage => Math.abs(time - times[stage]) < .005)
}
export function createStrategy(name = 'My strategy', author = 'Coach', _base?: Bundle): StrategyDraftV2 {
  return { kind: 'rotation-studio-strategy', schemaVersion: 2, id: crypto.randomUUID(), name, author, baseRevision: BASE_REVISION,
    overrides: {} }
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v))
const allowed = (v: Record<string, unknown>, keys: readonly string[]) => {
  if (Reflect.ownKeys(v).some(k => typeof k !== 'string' || !keys.includes(k) || !('value' in Object.getOwnPropertyDescriptor(v, k)!))) throw new Error('Unknown strategy field.')
}
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[\u0000-\u001f]/.test(v)
function checkSpot(v: unknown, target = false): asserts v is Spot {
  if (!record(v)) throw new Error('Expected a coordinate.')
  allowed(v, ['x', 'z'])
  if (typeof v.x !== 'number' || !Number.isFinite(v.x) || Math.abs(v.x) > 4.5 || typeof v.z !== 'number' || !Number.isFinite(v.z) || v.z < 0 || v.z > (target ? 2.99 : 12)) throw new Error('Coordinates must be finite: X −4.5…4.5, Z 0…12; setter target Z < 3.')
}
function checkPlayers(players: unknown, field: string) {
  if (!record(players)) throw new Error('Expected athlete overrides.')
  allowed(players, PLAYER_IDS)
  for (const point of Object.values(players)) {
    if (field === 'anchors') checkSpot(point)
    else if (field === 'coverage') {
      if (!record(point)) throw new Error('Expected a coverage zone.')
      allowed(point, ['role', 'radiusX', 'radiusZ', 'offsetX', 'offsetZ'])
      if (!COVERAGE_ROLES.includes(point.role as CoverageZone['role'])) throw new Error('Unknown coverage responsibility.')
      for (const axis of ['radiusX', 'radiusZ', 'offsetX', 'offsetZ']) {
        const radius = axis.startsWith('radius'), value = point[axis]
        if (!radius && value === undefined) continue
        if (typeof value !== 'number' || !Number.isFinite(value) || value < (radius ? .1 : -4.5) || value > 4.5) throw new Error('Coverage radii must be 0.1–4.5 m; offsets −4.5–4.5 m, all finite.')
      }
    }
    else {
      if (!Array.isArray(point) || point.length > 8) throw new Error('Routes require an array of up to 8 waypoints.')
      for (const p of point) checkSpot(p)
    }
  }
}
function checkRotations(overrides: unknown, version: number, cases = false) {
  if (!record(overrides) || Object.keys(overrides).length > (cases ? 48 : 12)) throw new Error('Expected bounded rotation/serve overrides.')
  for (const [key, value] of Object.entries(overrides)) {
    if (!(cases ? isCaseKey(key) : /^[1-6]\/(they|us)$/.test(key)) || !record(value)) throw new Error('Invalid rotation/serve or case override.')
    allowed(value, ['anchors', 'routes', 'setterTarget', 'readyOptions', ...(version === 2 ? ['laterDefend', 'coverage', 'eventOverrides'] : [])])
    if (value.readyOptions !== undefined && typeof value.readyOptions !== 'boolean') throw new Error('readyOptions must be boolean.')
    if (value.setterTarget !== undefined) checkSpot(value.setterTarget, true)
    for (const field of ['anchors', 'routes', ...(version === 2 ? ['coverage'] : [])]) {
      const stages = value[field]
      if (stages === undefined) continue
      if (!record(stages)) throw new Error('Expected stage overrides.')
      allowed(stages, STAGES)
      for (const players of Object.values(stages)) checkPlayers(players, field)
    }
    if (value.laterDefend !== undefined) {
      if (key.split('/')[1] !== 'us' || !record(value.laterDefend)) throw new Error('laterDefend requires our serve.')
      allowed(value.laterDefend, ['anchors', 'routes', 'coverage'])
      for (const field of ['anchors', 'routes', 'coverage']) if (value.laterDefend[field] !== undefined) checkPlayers(value.laterDefend[field], field)
    }
    if (value.eventOverrides !== undefined) {
      if (!record(value.eventOverrides) || Object.keys(value.eventOverrides).length > 128) throw new Error('Expected at most 128 source event overrides.')
      allowed(value.eventOverrides, Object.keys(value.eventOverrides))
      for (const [id, patch] of Object.entries(value.eventOverrides)) {
        if (!isSourceEventId(id) || !record(patch)) throw new Error('Invalid source event ID or patch.')
        allowed(patch, ['anchors', 'routes', 'coverage'])
        for (const field of ['anchors', 'routes', 'coverage']) if (patch[field] !== undefined) checkPlayers(patch[field], field)
        const points = [...Object.values((patch.anchors ?? {}) as Record<string, Spot>), ...Object.values((patch.routes ?? {}) as Record<string, Spot[]>).flat()]
        if (!/^p[01]:(legal-start|serve-hit)$/.test(id) && points.some(p => p.z > 9)) throw new Error('Event positions and routes must stay on our court: Z 0–9.')
      }
    }
  }
}
function checkNotes(notes: unknown) {
  if (!record(notes)) throw new Error('Expected coach notes.')
  allowed(notes, ['team', 'players'])
  let total = 0
  const note = (v: unknown) => {
    if (typeof v !== 'string' || v.length > 400 || /[\u0000-\u001f\u007f-\u009f]/.test(v)) throw new Error('Notes require plain text, at most 400 characters per field, without controls.')
    total += v.length
    if (total > MAX_NOTES_CHARACTERS) throw new Error('Notes exceed 20,000 characters in total.')
  }
  for (const [scope, rotations] of Object.entries(notes)) {
    if (!record(rotations)) throw new Error('Expected rotation notes.')
    allowed(rotations, Array.from({ length: 6 }, (_, i) => [`${i + 1}/they`, `${i + 1}/us`]).flat())
    for (const stages of Object.values(rotations)) {
      if (!record(stages)) throw new Error('Expected stage notes.')
      allowed(stages, STAGES)
      for (const value of Object.values(stages)) {
        if (scope === 'team') note(value)
        else {
          if (!record(value)) throw new Error('Expected player notes.')
          allowed(value, PLAYER_IDS)
          for (const instruction of Object.values(value)) {
            if (!record(instruction)) throw new Error('Expected coach instruction.')
            allowed(instruction, ['primary', 'ifDifferent', 'fallback', 'teamCall'])
            Object.values(instruction).forEach(note)
          }
        }
      }
    }
  }
}
export function validateStrategy(v: unknown): asserts v is StrategyDraft {
  if (!record(v)) throw new Error('Expected a sparse strategy object.')
  allowed(v, ['kind', 'schemaVersion', 'id', 'name', 'author', 'baseRevision', 'overrides', ...(v.schemaVersion === 2 ? ['caseOverrides', 'notes'] : [])])
  if (v.kind !== 'rotation-studio-strategy' || (v.schemaVersion !== 1 && v.schemaVersion !== 2)) throw new Error('Unsupported strategy format/version.')
  if (typeof v.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(v.id) || v.id === 'team-v3' || !text(v.name, 80) || !text(v.author, 80) || !text(v.baseRevision, 80)) throw new Error('Strategy requires a safe ID, name, author and base revision (1–80 characters).')
  checkRotations(v.overrides, v.schemaVersion)
  if (v.schemaVersion === 2 && v.caseOverrides !== undefined) checkRotations(v.caseOverrides, 2, true)
  if (v.schemaVersion === 2 && v.notes !== undefined) checkNotes(v.notes)
  if (new TextEncoder().encode(JSON.stringify(v)).length > MAX_STRATEGY_BYTES) throw new Error('Strategy file must be at most 100 KB.')
}
export function parseStrategy(json: string): StrategyDraftV2 {
  if (json.length > MAX_STRATEGY_BYTES || new TextEncoder().encode(json).length > MAX_STRATEGY_BYTES) throw new Error('Strategy file must be at most 100 KB.')
  const value: unknown = JSON.parse(json)
  validateStrategy(value)
  return { ...value, schemaVersion: 2 }
}
export function exportStrategy(draft: StrategyDraft): string {
  validateStrategy(draft)
  const json = JSON.stringify(draft, null, 2) + '\n'
  if (new TextEncoder().encode(json).length > MAX_STRATEGY_BYTES) throw new Error('Strategy exceeds 100 KB. Split it into smaller strategies.')
  return json
}
export function strategyLink(base: string, draft: StrategyDraft, maxLength = 8000): string | null {
  validateStrategy(draft)
  const url = new URL(base)
  url.searchParams.set('mode', 'rotations')
  url.searchParams.delete('s')
  url.hash = 'strategy=' + encodeURIComponent(JSON.stringify(draft))
  return url.href.length <= maxLength ? url.href : null
}
export function readStrategyLink(hash: string): StrategyDraft | null {
  if (!hash.startsWith('#strategy=')) return null
  if (hash.length > MAX_STRATEGY_BYTES * 3) throw new Error('Shared strategy is too large.')
  return parseStrategy(decodeURIComponent(hash.slice(10)))
}
export const applyStrategy = applyStrategyOverlay
