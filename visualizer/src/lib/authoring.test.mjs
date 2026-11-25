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
  const edited = previewProposal(l, { ...p, scope: [{ caseId: old.cases[0].id, momentId: 'set' }],
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
