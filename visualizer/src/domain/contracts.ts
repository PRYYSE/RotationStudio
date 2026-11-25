import { z } from 'zod'

export const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/)
export const label = z.string().trim().min(1).max(100)
const note = z.string().max(600)
const revision = z.int().min(1).max(100_000)
const version = { schemaVersion: z.literal(1), id, revision }
export const ref = z.strictObject({ id, revision })
export const skillKeys = ['receive', 'setting', 'attack', 'serving', 'block', 'defence', 'movement', 'communication'] as const
const observation = z.strictObject({
  rating: z.int().min(1).max(5).nullable(),
  source: note.optional(),
  observedOn: z.iso.date().optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
})
export const player = z.strictObject({
  ...version, name: label, number: z.int().min(0).max(99).optional(), appearance: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  heightCm: z.number().min(60).max(280).optional(), reachCm: z.number().min(60).max(380).optional(),
  gender: label.optional(), handedness: z.enum(['left', 'right', 'either', 'unknown']).optional(),
  assessments: z.partialRecord(z.enum(skillKeys), observation),
  strengths: z.array(label).max(16).optional(), preferences: z.array(label).max(16).optional(), limitations: note.optional(),
})
export const league = z.strictObject({
  ...version, name: label, rules: z.array(z.strictObject({ clause: label, summary: note, source: z.url(), checkedOn: z.iso.date() })).max(30),
})
export const team = z.strictObject({
  ...version, name: label, roster: z.array(ref).min(1).max(40), league: ref, notes: note.optional(),
})
export const roles = ['setter', 'outside', 'middle', 'opposite', 'libero', 'utility'] as const
const slot = z.strictObject({ id, player: ref, role: z.enum(roles), notes: note.optional() })
export const lineup = z.strictObject({
  ...version, name: label, team: ref, parent: ref.optional(), adaptation: z.enum(['original', 'needs-review', 'reviewed']),
  slots: z.array(slot).length(6),
})
const x = z.number().min(-4.5).max(4.5)
const zCourt = z.number().min(0).max(12)
export const spot = z.strictObject({ x, z: zCourt })
const point = z.strictObject({ x: z.number().min(-15).max(15), z: z.number().min(-20).max(20), y: z.number().min(0).max(15) })
const coverage = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('ellipse'), center: spot, radiusX: z.number().gt(0).max(9), radiusZ: z.number().gt(0).max(12) }),
  z.strictObject({ kind: z.literal('polygon'), vertices: z.array(spot).min(3).max(12) }),
])
export const duties = ['ready', 'serve', 'receive', 'set', 'attack', 'block', 'cover', 'recover', 'defend'] as const
const athlete = z.strictObject({
  slot: id, position: spot, duty: z.enum(duties), cue: note.optional(), route: z.array(spot).max(8).optional(),
  coverage: coverage.optional(),
})
const ms = z.int().min(0).max(120_000)
export const moment = z.strictObject({ id, name: label, ms, athletes: z.array(athlete).length(6), cue: note.optional() })
const actor = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('slot'), slot: id, y: z.number().min(0).max(5) }),
  z.strictObject({ kind: z.literal('opponent'), point }),
  z.strictObject({ kind: z.literal('court'), point }),
])
export const contact = z.strictObject({
  id, moment: id, kind: z.enum(['serve', 'pass', 'set', 'attack', 'dig', 'block', 'land', 'unresolved']), actor,
})
export const flight = z.strictObject({
  from: id, to: id, apex: z.number().min(0).max(15),
})
const conditions = z.strictObject({
  attackSide: z.enum(['left', 'right']).optional(),
  firstContactSlot: id.optional(),
})
export const playCase = z.strictObject({
  id, name: label, rotation: z.int().min(1).max(6), serve: z.enum(['us', 'they']), conditions,
  status: z.enum(['draft', 'approved']), moments: z.array(moment).min(1).max(100),
  contacts: z.array(contact).max(60), flights: z.array(flight).max(60),
})
export const strategy = z.strictObject({
  ...version, name: label, lineup: ref, league: ref, status: z.enum(['draft', 'approved']),
  source: z.strictObject({ id, sha256: z.hash('sha256') }).optional(),
  cases: z.array(playCase).max(72),
})
export const scope = z.strictObject({ caseId: id, momentId: id.optional(), slotId: id.optional() })
const caseTarget = { caseId: id }
const momentTarget = { ...caseTarget, momentId: id }
const athleteTarget = { ...momentTarget, slotId: id }
export const operation = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('move'), ...athleteTarget, position: spot }),
  z.strictObject({ type: z.literal('route'), ...athleteTarget, bends: z.array(spot).max(8) }),
  z.strictObject({ type: z.literal('coverage'), ...athleteTarget, area: coverage.nullable() }),
  z.strictObject({ type: z.literal('teach'), ...athleteTarget, duty: z.enum(duties), cue: note.optional() }),
  z.strictObject({ type: z.literal('contact'), ...momentTarget, contactId: id, actor }),
  z.strictObject({ type: z.literal('addMoment'), ...caseTarget, moment }),
  z.strictObject({ type: z.literal('renameMoment'), ...momentTarget, name: label }),
  z.strictObject({ type: z.literal('timing'), ...momentTarget, ms }),
  z.strictObject({ type: z.literal('copyCase'), ...caseTarget, copyId: id, name: label, conditions }),
  z.strictObject({ type: z.literal('addCase'), ...caseTarget, scenario: playCase }),
  z.strictObject({ type: z.literal('useLineup'), lineup: ref }),
])
export const proposal = z.strictObject({
  kind: z.literal('rotation-proposal'), schemaVersion: z.literal(1), proposalId: id, operationId: id,
  plan: ref, lineup: ref, league: ref, assessments: z.array(ref).length(6),
  scope: z.array(scope).max(120), operations: z.array(operation).min(1).max(40),
  rationale: note, assumptions: z.array(note).max(20), questions: z.array(note).max(20),
  sources: z.array(note).max(20), completeness: z.enum(['partial', 'all-base-cases']),
})
const display = z.strictObject({ slot: id, name: label, role: z.enum(roles), number: z.int().min(0).max(99).optional(), appearance: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() })
export const review = z.strictObject({
  kind: z.literal('rotation-review'), schemaVersion: z.literal(1), strategy: ref, caseId: id, momentId: id,
})
export const pack = z.strictObject({
  kind: z.literal('rotation-edit-pack'), schemaVersion: z.literal(1), plan: strategy,
  league, lineup: ref, slots: z.array(display).length(6), assessments: z.array(ref).length(6),
  selectedAssessments: z.array(z.strictObject({ slot: id, skills: z.partialRecord(z.enum(skillKeys), observation.pick({ rating: true, confidence: true })) })).max(6),
  scope, issues: z.array(note).max(100),
})
export const editableShare = z.strictObject({
  kind: z.literal('rotation-editable-copy'), schemaVersion: z.literal(1), name: label,
  league, slots: z.array(display).length(6), cases: z.array(playCase).max(72),
})
const source = z.strictObject({
  id, sha256: z.hash('sha256'), baseSha256: z.hash('sha256'), raw: z.string().max(1_000_000),
  eventMap: z.array(z.strictObject({ caseId: id, old: id, moment: id })).max(4800),
  issues: z.array(note).max(100),
})
const receipt = z.strictObject({ operationId: id, fingerprint: z.string().max(64), result: ref, previous: ref })
export const library = z.strictObject({
  kind: z.literal('rotation-library'), schemaVersion: z.literal(1),
  players: z.array(player).max(240), teams: z.array(team).max(100), leagues: z.array(league).max(40),
  lineups: z.array(lineup).max(100), plans: z.array(strategy).max(150),
  sources: z.array(source).max(20), receipts: z.array(receipt).max(150),
})
export type Ref = z.infer<typeof ref>
export type Player = z.infer<typeof player>
export type Team = z.infer<typeof team>
export type League = z.infer<typeof league>
export type Lineup = z.infer<typeof lineup>
export type Strategy = z.infer<typeof strategy>
export type Case = z.infer<typeof playCase>
export type Moment = z.infer<typeof moment>
export type Contact = z.infer<typeof contact>
export type Spot = z.infer<typeof spot>
export type Proposal = z.infer<typeof proposal>
export type Operation = z.infer<typeof operation>
export type Scope = z.infer<typeof scope>
export type Library = z.infer<typeof library>
export type Pack = z.infer<typeof pack>
export const MAX_LIBRARY_BYTES = 1_750_000
export const MAX_PROPOSAL_BYTES = 150_000
export const MAX_SHARE_BYTES = 1_000_000
export const bytes = (text: string) => new TextEncoder().encode(text).length
export function parseJSON(text: string, limit: number): unknown {
  if (bytes(text) > limit) throw new Error('File exceeds the size limit.')
  try { return JSON.parse(text) } catch { throw new Error('Invalid JSON file.') }
}
