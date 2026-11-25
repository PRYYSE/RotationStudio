import {
  decodeLibrary, serializeLibrary, proposal as proposalSchema, pack as packSchema, editableShare, review as reviewSchema, MAX_LIBRARY_BYTES, bytes,
  type Library, type Ref, type Strategy, type Proposal, type Case, type Operation, type Scope, type Lineup,
} from './contracts.ts'
import { rotationOrder } from '../lib/rotationModel.ts'
import { coveragePolygonError } from '../lib/coveragePolygon.ts'

export const reference = (v: Ref): Ref => ({ id: v.id, revision: v.revision })
export const sameRef = (a: Ref, b: Ref) => a.id === b.id && a.revision === b.revision
export function requireRef<T extends Ref>(all: readonly T[], ref: Ref, what: string): T {
  const item = all.find(x => sameRef(x, ref))
  if (!item) throw new Error('Missing ' + what + ' revision.')
  return item
}
export function currentPlan(library: Library, id: string) {
  const plan = [...library.plans].reverse().find(x => x.id === id)
  if (!plan) throw new Error('Plan is unavailable.')
  return plan
}
export function emptyLibrary(): Library {
  return { kind: 'rotation-library', schemaVersion: 1, players: [], teams: [], leagues: [], lineups: [], plans: [], sources: [], receipts: [] }
}
export function newId() { return crypto.randomUUID() }
const supports = (set: Set<string>, list: string[]) => list.length === set.size && new Set(list).size === set.size && list.every(id => set.has(id))
function unique(ids: string[], description: string) {
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate ' + description + '.')
}

export function validateCase(scenario: Case, lineup: Lineup) {
  const slots = new Set(lineup.slots.map(a => a.id))
  const checkSlot = (id: string) => { if (!slots.has(id)) throw new Error('Unrecognised court slot: ' + id) }
  if (scenario.conditions.firstContactSlot) checkSlot(scenario.conditions.firstContactSlot)
  unique(scenario.moments.map(m => m.id), 'moment ID')
  unique(scenario.moments.map(m => String(m.ms)), 'moment time')
  const times = new Map(scenario.moments.map(m => [m.id, m.ms]))
  if (![...times.values()].includes(0)) throw new Error('A case must begin at 0 seconds.')
  for (const m of scenario.moments) {
    if (!supports(slots, m.athletes.map(a => a.slot))) throw new Error('Every moment must identify each lineup slot once.')
    for (const athlete of m.athletes) {
      if (athlete.route?.length && m.ms === 0) throw new Error('The first moment has no incoming route.')
      if (athlete.coverage?.kind === 'polygon') {
        const issue = coveragePolygonError(athlete.coverage.vertices)
        if (issue) throw new Error(issue)
      }
    }
  }
  unique(scenario.contacts.map(c => c.id), 'contact ID')
  const contacts = new Map(scenario.contacts.map(c => [c.id, c]))
  for (const c of scenario.contacts) {
    if (!times.has(c.moment)) throw new Error('Contact has no matching moment.')
    if (c.actor.kind === 'slot') checkSlot(c.actor.slot)
    if (c.kind === 'unresolved' && c.actor.kind !== 'court') throw new Error('An unresolved endpoint must retain its court coordinate.')
  }
  const occupied = scenario.flights.map(f => {
    const from = contacts.get(f.from), to = contacts.get(f.to)
    if (!from || !to) throw new Error('Flight has no matching contact.')
    const start = times.get(from.moment)!, end = times.get(to.moment)!
    if (start >= end) throw new Error('Ball flights must move forward in time.')
    if (from.actor.kind === 'slot' && to.actor.kind === 'slot' && from.actor.slot === to.actor.slot &&
      (from.kind === 'pass' || from.kind === 'dig') && to.kind === 'set') throw new Error('A dig and its following set require separate players.')
    return { start, end, from: f.from, to: f.to }
  }).sort((a, b) => a.start - b.start)
  if (occupied.some((f, i) => i > 0 && (occupied[i - 1].end > f.start ||
    (occupied[i - 1].end === f.start && occupied[i - 1].to !== f.from)))) throw new Error('Ball flights overlap or disconnect at a contact.')
}

export function planIssues(plan: Strategy): string[] {
  const missing = []
  for (let r = 1; r <= 6; r++) for (const serve of ['us', 'they'] as const) {
    if (!plan.cases.some(c => c.rotation === r && c.serve === serve &&
      c.conditions.firstContactSlot === undefined && c.conditions.attackSide !== 'right')) {
      missing.push('Missing base case: R' + r + ', ' + (serve === 'us' ? 'our serve.' : 'their serve.'))
    }
  }
  for (const c of plan.cases) {
    const contacts = new Map(c.contacts.map(contact => [contact.id, contact]))
    const moments = new Map(c.moments.map(m => [m.id, m]))
    const flights = [...c.flights].sort((a, b) => (moments.get(contacts.get(a.from)?.moment ?? '')?.ms ?? 0) -
      (moments.get(contacts.get(b.from)?.moment ?? '')?.ms ?? 0))
    const start = contacts.get(flights[0]?.from), finish = contacts.get(flights.at(-1)?.to ?? '')
    if (c.moments.length < 2 || start?.kind !== 'serve' || finish?.kind !== 'land' ||
      flights.some((flight, i) => i > 0 && flights[i - 1].to !== flight.from) ||
      flights.length + 1 !== c.contacts.length) missing.push(c.name + ': connect service through the end of the rally.')
    if (c.contacts.some(contact => contact.kind === 'unresolved')) missing.push(c.name + ': inspect unresolved ball endpoints.')
    if (c.conditions.firstContactSlot) {
      const first = c.contacts.filter(contact => ['pass', 'dig', 'block'].includes(contact.kind) && contact.actor.kind === 'slot')
        .sort((a, b) => moments.get(a.moment)!.ms - moments.get(b.moment)!.ms)[0]
      if (first?.actor.kind !== 'slot' || first.actor.slot !== c.conditions.firstContactSlot) {
        missing.push(c.name + ': first-contact slot does not match the authored reception.')
      }
    }
  }
  return missing
}

export function contactIssues(l: Library, plan: Strategy): string[] {
  const lineup = requireRef(l.lineups, plan.lineup, 'lineup')
  const issues: string[] = []
  const duty = { serve: 'serve', pass: 'receive', dig: 'receive', set: 'set', attack: 'attack', block: 'block' } as const
  for (const c of plan.cases) for (const contact of c.contacts) {
    if (contact.actor.kind !== 'slot' || !Object.hasOwn(duty, contact.kind)) continue
    const actor = contact.actor.slot, moment = c.moments.find(m => m.id === contact.moment)!
    const player = requireRef(l.players, lineup.slots.find(s => s.id === actor)!.player, 'player').name
    const expected = duty[contact.kind as keyof typeof duty]
    if (moment.athletes.find(a => a.slot === actor)?.duty !== expected) {
      issues.push(c.name + ' · ' + moment.name + ': ' + player + ' owns the ' + contact.kind +
        ' contact. Review their teaching role and the former actor’s cue.')
    }
  }
  return issues
}

export function leagueIssues(l: Library, plan: Strategy): string[] {
  if (plan.league.id !== 'ttgva-c-2025-03' || plan.league.revision !== 1) return []
  const lineup = requireRef(l.lineups, plan.lineup, 'lineup')
  const issues: string[] = []
  if (lineup.slots.some(slot => slot.role === 'libero')) issues.push('TTGVA 3.4.6: C Grade has no libero.')
  for (const c of plan.cases) {
    const serve = c.contacts.find(contact => contact.kind === 'serve')
    const at = c.moments.find(moment => moment.id === serve?.moment)
    if (!at) continue
    const order = rotationOrder(lineup.slots.map(s => s.id), c.rotation - 1)
    const slot = (position: number) => at.athletes.find(a => a.slot === order[position - 1])!.position
    const xOrder = ([4, 3, 2].every((n, i, row) => !i || slot(row[i - 1]).x < slot(n).x)) &&
      ([5, 6, 1].every((n, i, row) => !i || slot(row[i - 1]).x < slot(n).x))
    const zOrder = [[5, 4], [6, 3], [1, 2]].every(([back, front]) => slot(back).z > slot(front).z)
    if (!xOrder || !zOrder) issues.push(c.name + ': TTGVA 3.4.7 service order needs review (avatar centres).')
  }
  return issues
}

export function validateLibrary(input: unknown): Library {
  const l = decodeLibrary(input)
  if (bytes(serializeLibrary(l)) > MAX_LIBRARY_BYTES) throw new Error('Library exceeds the save limit. Keep a separate backup.')
  for (const entries of [l.players, l.teams, l.leagues, l.lineups, l.plans]) {
    const versions = new Map<string, number>()
    for (const item of entries) {
      if (item.revision !== (versions.get(item.id) ?? 0) + 1) throw new Error('Revisions must be consecutive and immutable.')
      versions.set(item.id, item.revision)
    }
  }
  unique(l.sources.map(s => s.id), 'source ID')
  unique(l.receipts.map(s => s.operationId), 'operation ID')
  unique(l.receipts.map(s => s.result.id + '/' + s.result.revision), 'operation result')
  for (const t of l.teams) {
    unique(t.roster.map(r => r.id), 'roster player')
    for (const r of t.roster) requireRef(l.players, r, 'player')
    requireRef(l.leagues, t.league, 'league')
  }
  for (const entry of l.lineups) {
    const team = requireRef(l.teams, entry.team, 'team')
    unique(entry.slots.map(s => s.id), 'lineup slot')
    unique(entry.slots.map(s => s.player.id), 'active player')
    if (entry.slots.filter(s => s.role === 'setter').length !== 1) throw new Error('Choose one designated setter.')
    for (const s of entry.slots) if (!team.roster.some(p => sameRef(p, s.player))) throw new Error('Lineup player must match a roster revision.')
    if (entry.parent) {
      const parent = requireRef(l.lineups, entry.parent, 'parent lineup')
      if (parent.id === entry.id || parent.team.id !== team.id || parent.slots.some((s, index) => s.id !== entry.slots[index].id)) throw new Error('A fill-in must preserve the parent team and slot order.')
      if (entry.adaptation === 'original') throw new Error('A fill-in requires an explicit adaptation state.')
      const seen = new Set([entry.id])
      let ancestor: Lineup | undefined = parent
      while (ancestor) {
        if (seen.has(ancestor.id)) throw new Error('Lineup variants cannot form a cycle.')
        seen.add(ancestor.id)
        ancestor = ancestor.parent ? requireRef(l.lineups, ancestor.parent, 'parent lineup') : undefined
      }
    } else if (entry.adaptation !== 'original') throw new Error('A variant requires its parent lineup.')
  }
  for (const plan of l.plans) {
    const lineup = requireRef(l.lineups, plan.lineup, 'lineup')
    const team = requireRef(l.teams, lineup.team, 'team')
    if (!sameRef(plan.league, team.league)) throw new Error('Plan requires the exact league for its lineup.')
    if (plan.source && !l.sources.some(s => s.id === plan.source?.id && s.sha256 === plan.source?.sha256)) throw new Error('Missing pinned legacy source.')
    unique(plan.cases.map(c => c.id), 'case ID')
    unique(plan.cases.map(c => [c.rotation, c.serve, c.conditions.attackSide ?? 'left', c.conditions.firstContactSlot ?? ''].join('/')), 'case conditions')
    for (const c of plan.cases) validateCase(c, lineup)
    if (plan.status === 'approved' && (planIssues(plan).length || plan.cases.some(c => c.status !== 'approved'))) throw new Error('Incomplete plans cannot be approved.')
  }
  for (const r of l.receipts) {
    requireRef(l.plans, r.result, 'operation result')
    requireRef(l.plans, r.previous, 'operation base')
    if (r.result.id !== r.previous.id || r.result.revision !== r.previous.revision + 1) throw new Error('Invalid operation receipt.')
    if (!!r.restoredFrom === !!r.proposal) throw new Error('Receipt requires one typed proposal or Undo target.')
    if (r.proposal && (!sameRef(r.proposal.plan, r.previous) || r.proposal.operationId !== r.operationId)) {
      throw new Error('Proposal receipt does not match its expected revision.')
    }
    if (r.restoredFrom) {
      const target = requireRef(l.plans, r.restoredFrom, 'restored revision')
      const restored = requireRef(l.plans, r.result, 'Undo result')
      if (target.id !== r.result.id || target.revision >= r.previous.revision ||
        stableJson({ ...target, revision: restored.revision }) !== stableJson(restored)) throw new Error('Invalid Undo receipt.')
    }
  }
  return l
}

export async function validateAppend(before: Library, after: Library) {
  for (const key of ['players', 'teams', 'lineups', 'leagues', 'plans', 'sources', 'receipts'] as const) {
    if (after[key].length < before[key].length ||
      before[key].some((item, index) => stableJson(item) !== stableJson(after[key][index]))) {
      throw new Error('Saved revisions cannot be changed or removed.')
    }
  }
  const appended = after.plans.slice(before.plans.length)
  for (const [index, next] of appended.entries()) {
    if (next.revision === 1) continue
    const history = after.plans.slice(0, before.plans.length + index)
    const previous = history.find(p => p.id === next.id && p.revision === next.revision - 1)
    const receipt = after.receipts.find(r => sameRef(r.result, next))
    if (!previous || !receipt || previous.status === 'approved' ||
      previous.cases.some(c => c.status === 'approved' &&
        stableJson(next.cases.find(newCase => newCase.id === c.id)) !== stableJson(c))) {
      throw new Error('Plan revisions require a typed receipt; approved cases must remain exact.')
    }
    const prefix = { ...after, plans: history, receipts: after.receipts.filter(r => history.some(p => sameRef(p, r.result))) }
    if (receipt.proposal) {
      if (await sha256(stableJson(receipt.proposal)) !== receipt.fingerprint ||
        stableJson(previewProposal(prefix, receipt.proposal).plan) !== stableJson(next)) {
        throw new Error('Saved plan does not match its typed proposal.')
      }
    } else {
      const target = undoTarget(prefix, previous)
      if (!target || !receipt.restoredFrom || !sameRef(target, receipt.restoredFrom) ||
        await sha256(stableJson({ type: 'undo', id: next.id, revision: previous.revision })) !== receipt.fingerprint) {
        throw new Error('Saved Undo does not resolve to the prior edit.')
      }
    }
  }
}

export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(Object.entries(v).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
    }
    return v
  })
}
export async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('')
}

function edit(plan: Strategy, op: Operation, l: Library): string {
  if (op.type === 'useLineup') {
    const next = requireRef(l.lineups, op.lineup, 'lineup')
    if (!next.parent || !sameRef(next.parent, plan.lineup)) throw new Error('Choose a derivation of this exact lineup.')
    if (plan.cases.some(c => c.status === 'approved')) throw new Error('Copy approved cases before adapting the lineup.')
    plan.lineup = op.lineup
    return 'Lineup → ' + next.name + ' (tactics need review)'
  }
  const scenario = plan.cases.find(c => c.id === op.caseId)
  if (op.type === 'addCase') {
    if (op.scenario.id !== op.caseId || scenario || op.scenario.status !== 'draft') throw new Error('Provide a new draft case with the scoped ID.')
    plan.cases.push(op.scenario)
    return 'Add case ' + op.scenario.name
  }
  if (!scenario) throw new Error('Case is unavailable.')
  if (op.type === 'copyCase') {
    plan.cases.push({ ...structuredClone(scenario), id: op.copyId, name: op.name, conditions: op.conditions, status: 'draft' })
    return scenario.name + ' → new draft ' + op.name
  }
  if (scenario.status === 'approved') throw new Error('Copy the approved case before editing.')
  if (op.type === 'addMoment') {
    scenario.moments.push(op.moment)
    return scenario.name + ' · add ' + op.moment.name
  }
  if (op.type === 'connectFlight') {
    scenario.flights.push(op.flight)
    return scenario.name + ' · connect ' + op.flight.from + ' → ' + op.flight.to
  }
  const moment = scenario.moments.find(m => m.id === op.momentId)
  if (!moment) throw new Error('Moment is unavailable.')
  const where = scenario.name + ' · ' + moment.name
  const activeLineup = requireRef(l.lineups, plan.lineup, 'lineup')
  const playerName = (id: string) => {
    const slot = activeLineup.slots.find(s => s.id === id)
    return slot ? requireRef(l.players, slot.player, 'player').name : id
  }
  const spotLabel = (s: { x: number; z: number }) => '(' + s.x + ', ' + s.z + ') m'
  const shape = (area: typeof moment.athletes[number]['coverage']) => !area ? 'none' : area.kind === 'ellipse'
    ? 'ellipse at ' + spotLabel(area.center) + ', radii ' + area.radiusX + ' × ' + area.radiusZ + ' m'
    : 'polygon ' + area.vertices.map(spotLabel).join(', ')
  if (op.type === 'timing') { const from = moment.ms; moment.ms = op.ms; return where + ': ' + from + ' → ' + op.ms + ' ms' }
  if (op.type === 'renameMoment') { moment.name = op.name; return where + ' → ' + op.name }
  if (op.type === 'addContact') {
    if (op.contact.moment !== moment.id) throw new Error('Contact must belong to the scoped moment.')
    scenario.contacts.push(op.contact)
    return where + ' · add ' + op.contact.kind + ' contact'
  }
  if (op.type === 'contact') {
    const target = scenario.contacts.find(c => c.id === op.contactId && c.moment === moment.id)
    if (!target) throw new Error('Contact does not belong to the selected moment.')
    const actorLabel = (actor: typeof target.actor) => actor.kind === 'slot' ? playerName(actor.slot) + ', contact height ' + actor.y + ' m'
      : actor.kind + ' at ' + spotLabel(actor.point) + ', height ' + actor.point.y + ' m'
    const original = target.kind + ' · ' + actorLabel(target.actor)
    target.actor = op.actor
    if (op.kind) target.kind = op.kind
    if (target.kind === 'unresolved' && op.actor.kind !== 'court') throw new Error('Set the resolved contact kind explicitly.')
    return where + ': ' + original + ' → ' + target.kind + ' · ' + actorLabel(target.actor) + '. Review both teaching responsibilities.'
  }
  const a = moment.athletes.find(a => a.slot === op.slotId)
  if (!a) throw new Error('Player slot is unavailable.')
  const name = where + ' · ' + playerName(a.slot)
  switch (op.type) {
    case 'move': {
      const before = a.position
      a.position = op.position
      return name + ': (' + before.x + ', ' + before.z + ') → (' + op.position.x + ', ' + op.position.z + ') m'
    }
    case 'route': {
      const route = (bends: typeof a.route) => bends?.length ? bends.map(spotLabel).join(', ') : 'straight'
      const before = route(a.route)
      a.route = op.bends
      return name + ' · incoming route: ' + before + ' → ' + route(op.bends)
    }
    case 'coverage': {
      const before = shape(a.coverage)
      if (op.area) a.coverage = op.area
      else delete a.coverage
      return name + ' · coverage: ' + before + ' → ' + shape(a.coverage)
    }
    case 'teach':
      a.duty = op.duty
      if (op.cue !== undefined) a.cue = op.cue
      return name + ': ' + op.duty + (op.cue ? ' · ' + op.cue : '')
  }
}

export function makeProposal(l: Library, plan: Strategy, operations: Operation[], scope: Scope[], rationale: string): Proposal {
  const lineup = requireRef(l.lineups, plan.lineup, 'lineup')
  return { kind: 'rotation-proposal', schemaVersion: 1, proposalId: newId(), operationId: newId(), plan: reference(plan),
    lineup: plan.lineup, league: plan.league, assessments: lineup.slots.map(s => s.player), scope, operations, rationale,
    questions: [], assumptions: [], sources: [], completeness: 'partial' }
}

export function previewProposal(l: Library, input: unknown) {
  const proposal = proposalSchema.parse(input)
  const old = currentPlan(l, proposal.plan.id)
  if (!sameRef(old, proposal.plan) || !sameRef(old.lineup, proposal.lineup) || !sameRef(old.league, proposal.league)) {
    throw new Error('The proposal base revision changed. Reopen the current plan and export a fresh pack.')
  }
  if (old.status === 'approved') throw new Error('Copy the approved plan before editing.')
  const lineup = requireRef(l.lineups, old.lineup, 'lineup')
  if (lineup.slots.some((s, index) => !sameRef(s.player, proposal.assessments[index]))) throw new Error('Assessment revisions changed.')
  if (proposal.operations.some(op => op.type === 'useLineup') && proposal.operations.length !== 1) throw new Error('Preview a lineup change as a separate transaction.')
  const plan = { ...structuredClone(old), revision: old.revision + 1 }
  const diff = proposal.operations.map(op => {
    if (op.type !== 'useLineup' && !proposal.scope.some(s => s.caseId === op.caseId &&
      (!s.momentId || ('momentId' in op && s.momentId === op.momentId)) &&
      (!s.slotId || ('slotId' in op && s.slotId === op.slotId)))) throw new Error('Operation leaves the declared case, moment or slot scope.')
    return edit(plan, op, l)
  })
  const validated = validateLibrary({ ...l, plans: [...l.plans, plan] }).plans.at(-1)!
  const issues = planIssues(validated)
  const contactWarnings = contactIssues(l, validated)
  if (proposal.completeness === 'all-base-cases' && (issues.length || contactWarnings.length)) throw new Error('Proposal claims completeness with unfinished cases.')
  return { plan: validated, diff, issues: [...issues, ...contactWarnings, ...leagueIssues(l, validated)] }
}

// Bind the operation ID to the canonical request across reloads and retries.
export async function applyProposal(l: Library, input: unknown): Promise<Library> {
  const p = proposalSchema.parse(input)
  const fingerprint = await sha256(stableJson(p))
  const previous = l.receipts.find(r => r.operationId === p.operationId)
  if (previous) {
    if (previous.fingerprint !== fingerprint) throw new Error('Operation ID is already used by a different request.')
    return l
  }
  const { plan } = previewProposal(l, p)
  return validateLibrary({ ...l, plans: [...l.plans, plan], receipts: [...l.receipts, {
    operationId: p.operationId, fingerprint, result: reference(plan), previous: p.plan, proposal: p,
  }] })
}

export function undoTarget(l: Library, current: Ref) {
  let receipt = l.receipts.find(r => sameRef(r.result, current))
  while (receipt?.restoredFrom) {
    const target = receipt.restoredFrom
    receipt = l.receipts.find(r => sameRef(r.result, target))
  }
  return receipt?.previous
}

export async function undo(l: Library, id: string, revision: number, operationId: string): Promise<Library> {
  const fingerprint = await sha256(stableJson({ type: 'undo', id, revision }))
  const repeated = l.receipts.find(r => r.operationId === operationId)
  if (repeated) {
    if (repeated.fingerprint !== fingerprint) throw new Error('Operation ID is already used by a different request.')
    return l
  }
  const active = currentPlan(l, id)
  if (active.revision !== revision) throw new Error('Undo requires the current revision.')
  const targetRef = undoTarget(l, active)
  if (!targetRef) throw new Error('This revision has no edit to undo.')
  const target = requireRef(l.plans, targetRef, 'Undo base')
  const restored = { ...structuredClone(target), revision: revision + 1 }
  return validateLibrary({ ...l, plans: [...l.plans, restored], receipts: [...l.receipts, {
    fingerprint, operationId, result: reference(restored), previous: reference(active), restoredFrom: targetRef,
  }] })
}

function display(l: Library, lineup: Lineup) {
  return lineup.slots.map(s => {
    const p = requireRef(l.players, s.player, 'player')
    return { slot: s.id, name: p.name, role: s.role, number: p.number, appearance: p.appearance }
  })
}
export function exportPack(l: Library, plan: Strategy, scope: Scope, includeSkills = false) {
  const lineup = requireRef(l.lineups, plan.lineup, 'lineup')
  const scenario = plan.cases.find(c => c.id === scope.caseId)
  if (!scenario || (scope.momentId && !scenario.moments.some(m => m.id === scope.momentId)) ||
    (scope.slotId && !lineup.slots.some(s => s.id === scope.slotId))) throw new Error('Choose a valid case, moment and slot.')
  const selectedAssessments = includeSkills ? lineup.slots.map(s => ({
    slot: s.id, skills: Object.fromEntries(Object.entries(requireRef(l.players, s.player, 'player').assessments)
      .map(([key, a]) => [key, { rating: a.rating, confidence: a.confidence }])),
  })) : []
  const { source: _source, ...copy } = plan
  return packSchema.parse({ kind: 'rotation-edit-pack', schemaVersion: 1, plan: { ...copy, cases: [scenario] },
    league: requireRef(l.leagues, plan.league, 'league'), lineup: plan.lineup, slots: display(l, lineup),
    assessments: lineup.slots.map(s => s.player), selectedAssessments, scope, issues: [...planIssues(plan), ...contactIssues(l, plan), ...leagueIssues(l, plan)].slice(0, 100) })
}

export function sharePlan(l: Library, plan: Strategy) {
  const lineup = requireRef(l.lineups, plan.lineup, 'lineup')
  const cases = plan.cases.map(c => ({ ...c, status: 'draft' as const,
    moments: c.moments.map(m => ({ ...m, cue: undefined, athletes: m.athletes.map(a => ({ ...a, cue: undefined })) })) }))
  return editableShare.parse({ kind: 'rotation-editable-copy', schemaVersion: 1, name: plan.name,
    slots: display(l, lineup), league: requireRef(l.leagues, plan.league, 'league'), cases })
}

export function addSharedCopy(l: Library, input: unknown) {
  const copy = editableShare.parse(input)
  const league = l.leagues.find(x => stableJson(x) === stableJson(copy.league)) ?? { ...copy.league, id: newId(), revision: 1 }
  const players = copy.slots.map(s => ({ schemaVersion: 1 as const, id: newId(), revision: 1, name: s.name, number: s.number, appearance: s.appearance, assessments: {} }))
  const team = { schemaVersion: 1 as const, id: newId(), revision: 1, name: copy.name, league: reference(league), roster: players.map(reference) }
  const lineup = { schemaVersion: 1 as const, id: newId(), revision: 1, name: 'Imported six', team: reference(team),
    adaptation: 'original' as const, slots: copy.slots.map((s, i) => ({ id: s.slot, role: s.role, player: reference(players[i]) })) }
  const plan = { schemaVersion: 1 as const, id: newId(), revision: 1, name: copy.name, league: reference(league), lineup: reference(lineup),
    status: 'draft' as const, cases: copy.cases.map(c => ({ ...c, status: 'draft' as const })) }
  return { library: validateLibrary({ ...l, players: [...l.players, ...players], teams: [...l.teams, team], lineups: [...l.lineups, lineup],
    leagues: l.leagues.includes(league) ? l.leagues : [...l.leagues, league], plans: [...l.plans, plan] }), plan }
}

export function addFillIn(l: Library, parent: Lineup, slotId: string, player: Ref, name: string) {
  if (!parent.slots.some(s => s.id === slotId)) throw new Error('Choose a slot to replace.')
  const variant = { ...parent, id: newId(), revision: 1, name, parent: reference(parent), adaptation: 'needs-review' as const,
    slots: parent.slots.map(s => s.id === slotId ? { ...s, player } : s) }
  return { library: validateLibrary({ ...l, lineups: [...l.lineups, variant] }), variant }
}

export async function makeReview(l: Library, plan: Strategy, caseId: string, momentId: string) {
  const editable = sharePlan(l, plan)
  const scenario = editable.cases.find(c => c.id === caseId)
  if (!scenario?.moments.some(m => m.id === momentId)) throw new Error('Review requires an exact case and moment.')
  const body = { kind: 'rotation-review' as const, schemaVersion: 1 as const, strategy: reference(plan), caseId, momentId,
    snapshot: { ...editable, cases: [scenario] } }
  return reviewSchema.parse({ ...body, digest: await sha256(stableJson(body)) })
}

export async function openReview(input: unknown) {
  const { digest, ...body } = reviewSchema.parse(input)
  if (digest !== await sha256(stableJson(body))) throw new Error('Review digest does not match its snapshot.')
  const source = body.snapshot.cases[0]
  if (body.snapshot.cases.length !== 1 || source.id !== body.caseId ||
    !source.moments.some(m => m.id === body.momentId)) throw new Error('Exact reviewed case or moment is missing.')
  addSharedCopy(emptyLibrary(), body.snapshot)
  return { ...body, digest }
}
