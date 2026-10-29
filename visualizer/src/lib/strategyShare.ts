import type { Bundle } from './rotationTypes.ts'
import type { ReviewContext, GroupedReviewFinding } from './reviewTypes.ts'
import { createReviewModel } from './caseReview.ts'
import { MAX_STRATEGY_BYTES, PLAYER_IDS, STAGES, parseStrategy, scenarioCaseKey } from './strategyDraft.ts'
import type { CoachNotes, StrategyDraft, StrategyDraftV2 } from './strategyDraft.ts'

export const DRAFT_MARKER = 'DRAFT; not match-approved'
const REVIEW_KIND = 'rotation-studio-review-packet'
export type ReviewPacket = {
  kind: typeof REVIEW_KIND; schemaVersion: 1; status: typeof DRAFT_MARKER
  sourceRevision: string; selectedCase: string; selection: ReviewContext
  draft: StrategyDraftV2; authorNotes: CoachNotes; reviewFindings: GroupedReviewFinding[]
}

// Sort objects recursively, preserving arrays and every validated optional draft
// field. No timestamps, random IDs or field-by-field reconstruction of the draft.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => [k, canonical(v)]))
  return value
}
const stable = (value: unknown) => JSON.stringify(canonical(value))
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
function selectionCase(value: unknown) {
  if (!object(value) || Object.keys(value).some(k => !['rotation', 'serve', 'attackSide', 'firstTouch', 'stage', 'playerId'].includes(k)) ||
    ![1, 2, 3, 4, 5, 6].includes(value.rotation as number) || !['they', 'us'].includes(value.serve as string) ||
    !['left', 'right'].includes(value.attackSide as string) || !['normal', 'harry'].includes(value.firstTouch as string) ||
    !STAGES.includes(value.stage as typeof STAGES[number]) || (value.playerId !== null && !PLAYER_IDS.includes(value.playerId as typeof PLAYER_IDS[number]))) throw new Error('Invalid Review packet selection.')
  return `${value.rotation}/${value.serve}/${value.attackSide}/${value.firstTouch}`
}
function bounded(json: string) {
  if (json.length > MAX_STRATEGY_BYTES || new TextEncoder().encode(json).length > MAX_STRATEGY_BYTES) throw new Error('Import/export file must be at most 100 KB. Export a smaller strategy if needed.')
}
// Packet annotations are untrusted JSON evidence, never code, HTML, settings or
// instructions to the app. Only the separately validated draft is imported.
function safeEvidence(value: unknown): boolean {
  if (Array.isArray(value)) return value.every(safeEvidence)
  if (object(value)) return Object.entries(value).every(([k, v]) => !['__proto__', 'prototype', 'constructor'].includes(k) && safeEvidence(v))
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}
export function createReviewPacket(published: Bundle, draft: StrategyDraft, selection: ReviewContext): ReviewPacket {
  const selectedCase = selectionCase(selection), copy = parseStrategy(JSON.stringify(draft))
  const scenario = published.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})]).find(s => scenarioCaseKey(s) === selectedCase)
  if (!scenario || scenario.teachingOnly) throw new Error('Review packet requires an authored case.')
  const projection = createReviewModel(published, copy).project(selection)
  return { kind: REVIEW_KIND, schemaVersion: 1, status: DRAFT_MARKER, sourceRevision: copy.baseRevision,
    selectedCase, selection: structuredClone(selection), draft: copy, authorNotes: structuredClone(copy.notes ?? {}), reviewFindings: projection.reviewFindings }
}
export function exportReviewPacket(packet: ReviewPacket): string {
  const json = stable(packet) + '\n'
  bounded(json)
  return json
}
export function parseStrategyImport(json: string): StrategyDraftV2 {
  bounded(json)
  const value: unknown = JSON.parse(json)
  if (!object(value) || value.kind !== REVIEW_KIND) return parseStrategy(json)
  if (Object.keys(value).some(k => !['kind', 'schemaVersion', 'status', 'sourceRevision', 'selectedCase', 'selection', 'draft', 'authorNotes', 'reviewFindings'].includes(k)) ||
    value.schemaVersion !== 1 || value.status !== DRAFT_MARKER || selectionCase(value.selection) !== value.selectedCase ||
    !Array.isArray(value.reviewFindings) || value.reviewFindings.length > 2000 || !safeEvidence(value.reviewFindings)) throw new Error('Invalid Review packet. Import a supported DRAFT packet or sparse strategy JSON.')
  const draft = parseStrategy(JSON.stringify(value.draft))
  if (value.sourceRevision !== draft.baseRevision || stable(value.authorNotes) !== stable(draft.notes ?? {})) throw new Error('Review packet source or notes do not match its draft.')
  return draft
}
