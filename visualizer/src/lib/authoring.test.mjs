import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fixture, sampleProposal } from '../domain/fixture.ts'
import { applyProposal, previewProposal, undo, validateLibrary, currentPlan } from '../domain/authoring.ts'
import { compile } from '../domain/playback.ts'

test('a named reserve lineup retains the original and a person can play on two teams', async () => {
  const l = validateLibrary(fixture())
  assert.equal(l.teams[0].roster.length, 7)
  assert(l.teams[1].roster.some(ref => ref.id === l.teams[0].roster[0].id))
  assert.equal(l.lineups[1].parent.id, l.lineups[0].id)
  assert.notEqual(l.lineups[1].slots[0].player.id, l.lineups[0].slots[0].player.id)
  assert.equal(l.lineups[1].slots[0].id, l.lineups[0].slots[0].id)
})

test('exact court preview uses the same operation as apply, without moving ownership or mutating base', async () => {
  const l = fixture(), p = sampleProposal(l), old = currentPlan(l, p.plan.id)
  const preview = previewProposal(l, p)
  assert.equal(old.revision, 1)
  assert.deepEqual(preview.plan.cases[0].contacts, old.cases[0].contacts)
  assert.notDeepEqual(compile(preview.plan.cases[0]), compile(old.cases[0]))
  assert.deepEqual(preview.plan.cases.slice(1), old.cases.slice(1))
  const updated = await applyProposal(l, p)
  assert.deepEqual(currentPlan(updated, p.plan.id), preview.plan)
  assert.deepEqual(await applyProposal(updated, p), updated)
  await assert.rejects(() => applyProposal(updated, { ...p, operationId: 'another' }), /revision/i)
  await assert.rejects(() => applyProposal(updated, { ...p, rationale: 'Different request' }), /operation/i)
  const restored = currentPlan(await undo(updated, p.plan.id, 2, 'restore'), p.plan.id)
  assert.equal(restored.revision, 3)
  assert.deepEqual(restored.cases, old.cases)
  await assert.rejects(() => undo(updated, p.plan.id, 1, 'stale'), /revision/i)
})

test('ball playback samples in flight-relative time and an explicit contact edit redirects linked flights', async () => {
  const { playbackAt } = await import('../domain/playback.ts')
  const l = fixture(), p = sampleProposal(l), old = currentPlan(l, p.plan.id)
  const before = compile(old.cases[0]), f = before.ball[1]
  assert.notDeepEqual(playbackAt(before, (f.start + f.end) / 2).ball, f.to)
  const from = old.cases[0].contacts.find(c => c.id === 'ball-set')
  const slot = l.lineups[0].slots[1].id
  const edited = previewProposal(l, { ...p, completeness: 'partial', scope: [{ caseId: old.cases[0].id, momentId: 'set' }],
    operations: [{ type: 'contact', caseId: old.cases[0].id, momentId: 'set', contactId: from.id, actor: { kind: 'slot', slot, y: 2 } }] })
  const after = compile(edited.plan.cases[0])
  assert.deepEqual(after.ball[1].to, after.ball[2].from)
  assert.notDeepEqual(after.ball[1].to, f.to)
})

test('legacy imports create a separate pinned copy and preserve raw notes and every authored case', async () => {
  const { readFile } = await import('node:fs/promises')
  const { importLegacy } = await import('../domain/legacy.ts')
  const team = JSON.parse(await readFile(new URL('../../public/plans/team.json', import.meta.url), 'utf8'))
  const plans = JSON.parse(await readFile(new URL('../../public/plans/rotations.json', import.meta.url), 'utf8'))
  const raw = JSON.stringify({ kind: 'rotation-studio-strategy', schemaVersion: 2, id: 'fixture-v2', name: 'Legacy fixture', author: 'Fixture',
    baseRevision: '8c0fb5d', overrides: {}, notes: { team: { '1/they': { Start: 'Preserved note' } } } })
  const result = await importLegacy(fixture(), { team, plans }, raw)
  assert.equal(result.plan.cases.length, 48)
  assert.equal(result.library.sources[0].raw, raw)
  assert.equal(result.library.sources[0].eventMap[0].caseId, result.plan.cases[0].id)
  assert.notEqual(result.plan.id, 'fixture-v2')
  assert(result.plan.cases[0].moments.some(m => m.cue?.includes('Preserved note')))
})

test('read-only review pins a redacted case and rejects altered bytes', async () => {
  const { makeReview, openReview } = await import('../domain/authoring.ts')
  const l = fixture(), plan = l.plans[0], scenario = plan.cases[0]
  scenario.moments[0].cue = 'Private coaching note'
  const copy = await makeReview(l, plan, scenario.id, 'receive')
  const opened = await openReview(copy)
  assert.equal(opened.caseId, scenario.id)
  assert(!JSON.stringify(copy).includes('Private coaching note'))
  assert(!JSON.stringify(copy).includes('assessments'))
  const altered = structuredClone(copy)
  altered.snapshot.cases[0].moments[0].athletes[0].position.x = 2.4
  await assert.rejects(() => openReview(altered), /digest/)
})

test('player renames are versioned and old lineups keep their exact original name', () => {
  const l = fixture()
  l.players.push({ ...l.players[0], revision: 2, name: 'Ari revised' })
  const checked = validateLibrary(l)
  const ref = checked.lineups[0].slots[0].player
  assert.equal(checked.players.find(p => p.id === ref.id && p.revision === ref.revision).name, 'Ari')
  assert.equal(checked.players.at(-1).name, 'Ari revised')
  assert.equal(checked.players.at(-1).assessments.receive.rating, null)
})

test('TTGVA service order is checked on either serve without assigning its rules to an unknown league', async () => {
  const { leagueIssues } = await import('../domain/authoring.ts')
  const l = fixture(), base = l.plans[0]
  const plan = { ...base, league: { id: 'ttgva-c-2025-03', revision: 1 } }
  const receive = plan.cases[0], serving = plan.cases[1]
  for (const c of [receive, serving]) {
    const at = c.moments[0]
    at.athletes[0].position.x = -4
  }
  const found = leagueIssues(l, plan)
  assert(found.some(s => s.includes(receive.name)))
  assert(found.some(s => s.includes(serving.name)))
  assert.deepEqual(leagueIssues(l, base), [])
})

test('after undo, another undo goes back through applied edits instead of redoing the undone proposal', async () => {
  let l = fixture()
  const p = sampleProposal(l)
  l = await applyProposal(l, p)
  l = await undo(l, p.plan.id, 2, 'undo-only-edit')
  await assert.rejects(() => undo(l, p.plan.id, 3, 'unexpected-redo'), /no edit/)
})

test('legacy case history remains editable and recoverable within bounded backups', async () => {
  const { readFile } = await import('node:fs/promises')
  const { importLegacy } = await import('../domain/legacy.ts')
  const { emptyLibrary, makeProposal, stableJson } = await import('../domain/authoring.ts')
  const { encodeLibrary } = await import('../domain/contracts.ts')
  async function read(path) { return readFile(new URL('../../public/' + path, import.meta.url), 'utf8') }
  const raw = await read('strategies/pryyse-team-tactics-2026-v1.json')
  const base = { team: JSON.parse(await read('plans/team.json')), plans: JSON.parse(await read('plans/rotations.json')) }
  const imported = await importLegacy(emptyLibrary(), base, raw)
  assert(imported.plan)
  const planId = imported.plan.id
  let l = imported.library
  for (let i = 0; i < 5; i++) {
    const plan = currentPlan(l, planId), c = plan.cases[0], m = c.moments[1]
    const scope = { caseId: c.id, momentId: m.id, slotId: m.athletes[0].slot }
    l = await applyProposal(l, makeProposal(l, plan, [{ type: 'move', ...scope, position: { x: i / 10, z: 4 } }], [scope], 'Test placement.'))
  }
  l = await undo(l, planId, 6, 'restore-on-import')
  const saved = JSON.parse(JSON.stringify(encodeLibrary(l)))
  const reopened = validateLibrary(saved)
  assert(stableJson(currentPlan(reopened, planId)) === stableJson(currentPlan(l, planId)), 'Archived plan differs after reopen')
  assert.equal(reopened.sources[0].raw, raw)
  saved.plans[0].caseRefs[0] = saved.casePool.length
  assert.throws(() => validateLibrary(saved), /case reference/)
})

test('legacy bends survive imported intermediate moments in their incoming route order', async () => {
  const { readFile } = await import('node:fs/promises')
  const { importLegacy } = await import('../domain/legacy.ts')
  const team = JSON.parse(await readFile(new URL('../../public/plans/team.json', import.meta.url)))
  const plans = JSON.parse(await readFile(new URL('../../public/plans/rotations.json', import.meta.url)))
  const bends = [{ x: 4.1, z: 8.9 }, { x: -4.1, z: 8.9 }]
  const raw = JSON.stringify({ kind: 'rotation-studio-strategy', schemaVersion: 2, id: 'bent-v2', name: 'Bent route',
    author: 'Fixture', baseRevision: '8c0fb5d', overrides: { '1/they': { routes: { Defend: { harry: bends } } } } })
  const imported = await importLegacy(fixture(), { team, plans }, raw)
  assert(imported.plan)
  const slot = imported.library.lineups.at(-1).slots[team.initialOrder.indexOf('harry')].id
  const route = imported.plan.cases[0].moments.flatMap(m => m.athletes.find(a => a.slot === slot).route ?? [])
  const retained = route.filter(p => bends.some(b => b.x === p.x && b.z === p.z))
  assert.deepEqual(retained, bends)
  assert(imported.issues.some(issue => issue.includes('retime easing')))
})

test('partial flights and mismatched first-contact conditions are visible and cannot claim completeness', async () => {
  const { planIssues } = await import('../domain/authoring.ts')
  const l = fixture(), p = sampleProposal(l), c = l.plans[0].cases[0]
  c.flights = c.flights.slice(-1)
  c.conditions.firstContactSlot = 'aurora-slot-1'
  assert(planIssues(l.plans[0]).some(x => x.includes('connect service')))
  assert(planIssues(l.plans[0]).some(x => x.includes('first-contact slot')))
  assert.throws(() => previewProposal(l, p), /claims completeness/)
})

test('divergent recovery keeps private cues and the newest saved plan under separate IDs', async () => {
  const { recoverPlan } = await import('../domain/recovery.ts')
  const latest = fixture(), base = fixture()
  const p = sampleProposal(base)
  base.players[0].assessments.receive = { rating: 4, confidence: 'high', source: 'Observed at a private session' }
  base.plans[0].cases[0].moments[0].cue = 'Private coaching cue'
  const draft = await applyProposal(base, p)
  const recovered = recoverPlan(latest, draft, currentPlan(draft, p.plan.id))
  assert.notEqual(recovered.plan.id, p.plan.id)
  assert.equal(recovered.plan.cases[0].moments[0].cue, 'Private coaching cue')
  const lineup = recovered.library.lineups.find(x => x.id === recovered.plan.lineup.id)
  const owner = recovered.library.players.find(x => x.id === lineup.slots[0].player.id)
  assert.equal(owner.assessments.receive.source, 'Observed at a private session')
  assert.equal(recovered.library.players[0].assessments.receive.rating, null)
  assert.deepEqual(currentPlan(recovered.library, p.plan.id), latest.plans[0])
})
