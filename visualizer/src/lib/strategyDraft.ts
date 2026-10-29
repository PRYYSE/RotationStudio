import type { Bundle, Scenario, ServeOwner, Spot } from './rotationTypes.ts'
import { applyStrategyOverlay } from './strategyOverlay.ts'

export const BASE_REVISION = '8c0fb5d'
export const MAX_STRATEGY_BYTES = 100_000
export const PLAYER_IDS = ['harry', 'caleb', 'trent', 'logan', 'georgia', 'jaz'] as const
export type PlayerId = typeof PLAYER_IDS[number]
export const STAGES = ['Start', 'Receive', 'Set', 'Attack', 'Defend'] as const
export type StrategyStage = typeof STAGES[number]
export type RotationKey = `${1 | 2 | 3 | 4 | 5 | 6}/${ServeOwner}`
export type StrategyRotation = {
  readyOptions?: boolean // Set formation: prepare eligible front hitters, retaining the active setter.
  anchors?: Partial<Record<StrategyStage, Partial<Record<PlayerId, Spot>>>>
  routes?: Partial<Record<StrategyStage, Partial<Record<PlayerId, Spot[]>>>>
  setterTarget?: Spot
}
export type StrategyDraft = {
  kind: 'rotation-studio-strategy'
  schemaVersion: 1
  id: string
  name: string
  author: string
  baseRevision: string
  overrides: Partial<Record<RotationKey, StrategyRotation>>
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
export function createStrategy(name = 'My strategy', author = 'Coach', _base?: Bundle): StrategyDraft {
  return { kind: 'rotation-studio-strategy', schemaVersion: 1, id: crypto.randomUUID(), name, author, baseRevision: BASE_REVISION,
    overrides: {} }
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype, null].includes(Object.getPrototypeOf(v))
const allowed = (v: Record<string, unknown>, keys: readonly string[]) => {
  if (Object.keys(v).some(k => !keys.includes(k))) throw new Error('Unknown strategy field.')
}
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[\u0000-\u001f]/.test(v)
function checkSpot(v: unknown, target = false): asserts v is Spot {
  if (!record(v)) throw new Error('Expected a coordinate.')
  allowed(v, ['x', 'z'])
  if (typeof v.x !== 'number' || !Number.isFinite(v.x) || Math.abs(v.x) > 4.5 || typeof v.z !== 'number' || !Number.isFinite(v.z) || v.z < 0 || v.z > (target ? 2.99 : 12)) throw new Error('Coordinates must be finite: X −4.5…4.5, Z 0…12; setter target Z < 3.')
}
export function validateStrategy(v: unknown): asserts v is StrategyDraft {
  if (!record(v)) throw new Error('Expected a sparse strategy object.')
  allowed(v, ['kind', 'schemaVersion', 'id', 'name', 'author', 'baseRevision', 'overrides'])
  if (v.kind !== 'rotation-studio-strategy' || v.schemaVersion !== 1) throw new Error('Unsupported strategy format/version.')
  if (typeof v.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(v.id) || v.id === 'team-v3' || !text(v.name, 80) || !text(v.author, 80) || !text(v.baseRevision, 80)) throw new Error('Strategy requires a safe ID, name, author and base revision (1–80 characters).')
  if (!record(v.overrides) || Object.keys(v.overrides).length > 12) throw new Error('Expected up to 12 rotation/serve overrides.')
  for (const [key, value] of Object.entries(v.overrides)) {
    if (!/^[1-6]\/(they|us)$/.test(key) || !record(value)) throw new Error('Invalid rotation/serve override.')
    allowed(value, ['anchors', 'routes', 'setterTarget', 'readyOptions'])
    if (value.readyOptions !== undefined && typeof value.readyOptions !== 'boolean') throw new Error('readyOptions must be boolean.')
    if (value.setterTarget !== undefined) checkSpot(value.setterTarget, true)
    for (const field of ['anchors', 'routes']) {
      const stages = value[field]
      if (stages === undefined) continue
      if (!record(stages)) throw new Error('Expected stage overrides.')
      allowed(stages, STAGES)
      for (const players of Object.values(stages)) {
        if (!record(players)) throw new Error('Expected athlete overrides.')
        allowed(players, PLAYER_IDS)
        for (const point of Object.values(players)) {
          if (field === 'anchors') checkSpot(point)
          else {
            if (!Array.isArray(point) || point.length > 8) throw new Error('Routes require an array of up to 8 waypoints.')
            point.forEach(p => checkSpot(p))
          }
        }
      }
    }
  }
}
export function parseStrategy(json: string): StrategyDraft {
  if (json.length > MAX_STRATEGY_BYTES || new TextEncoder().encode(json).length > MAX_STRATEGY_BYTES) throw new Error('Strategy file must be at most 100 KB.')
  const value: unknown = JSON.parse(json)
  validateStrategy(value)
  return value
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
