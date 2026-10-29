import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createStrategy, exportStrategy, parseStrategy, readStrategyLink, strategyLink } from './strategyDraft.ts'
import { createReviewPacket, exportReviewPacket, parseStrategyImport, DRAFT_MARKER } from './strategyShare.ts'
import { createTeamReference } from './teamReference.ts'
import { applyStrategy } from './strategyDraft.ts'
import { positionOf, sampleTrack } from './rotationModel.ts'

const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const selection = { rotation: 3, serve: 'us', attackSide: 'right', firstTouch: 'harry', stage: 'Set', playerId: 'harry' }
export function coveredDraft() {
  const d = createStrategy('Coverage draft', 'Coach')
  const zone = { role: 'tip', radiusX: 1.234, radiusZ: 2.345, offsetX: -.765, offsetZ: .456 }
  d.overrides['3/us'] = { coverage: { Receive: { harry: zone } }, laterDefend: { coverage: { georgia: { ...zone, role: 'deep' } } } }
  d.caseOverrides = { '3/us/right/harry': { coverage: { Receive: { harry: { ...zone, role: 'custom', radiusX: 4.5 } } }, laterDefend: { coverage: { jaz: { ...zone, role: 'attack-cover' } } } } }
  d.notes = { team: { '3/us': { Start: 'Call <script> as plain text', Set: 'Our written call' } }, players: { '3/us': { Set: { harry: { primary: 'My note', ifDifferent: 'Read', fallback: 'Reset', teamCall: 'Mine' } } } } }
  return d
}

test('lossless coverage, exact cases, later coverage and notes survive JSON and V2 fragments; V1 fragments migrate', () => {
  const d = coveredDraft()
  assert.deepEqual(parseStrategy(exportStrategy(d)), d)
  const link = strategyLink('https://example.test/RotationStudio/?s=old', d)
  assert.ok(link); assert.deepEqual(readStrategyLink(new URL(link).hash), d)
  assert.equal(new URL(link).searchParams.has('s'), false)
  const v1 = { ...createStrategy(), schemaVersion: 1 }
  assert.deepEqual(readStrategyLink(new URL(strategyLink('https://example.test/', v1)).hash), { ...v1, schemaVersion: 2 })
  assert.equal(strategyLink('https://example.test/', d, 40), null)
  for (const hash of ['#strategy=%', '#strategy=%E0%A4%A', '#strategy=null', '#strategy=' + 'x'.repeat(300001)]) assert.throws(() => readStrategyLink(hash))
})

test('Review packet is deterministic, explicitly DRAFT, includes current case, source, findings and lossless sparse draft', () => {
  const d = coveredDraft(), before = JSON.stringify(base)
  const packet = createReviewPacket(base, d, selection), json = exportReviewPacket(packet)
  assert.equal(packet.status, DRAFT_MARKER); assert.equal(packet.sourceRevision, d.baseRevision)
  assert.equal(packet.selectedCase, '3/us/right/harry'); assert.deepEqual(packet.selection, selection)
  assert.deepEqual(packet.draft, d); assert.deepEqual(packet.authorNotes, d.notes)
  assert.ok(packet.reviewFindings.length); assert.deepEqual(parseStrategyImport(json), d)
  assert.equal(json, exportReviewPacket(createReviewPacket(base, d, selection)))
  const reverse = v => Array.isArray(v) ? v.map(reverse) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).reverse().map(([k,x])=>[k,reverse(x)])) : v
  assert.equal(exportReviewPacket(createReviewPacket(base, reverse(d), selection)), json)
  assert.equal(JSON.stringify(base), before)
})

test('packet import validates only data; malformed, oversized, unsafe or unsupported inputs fail', () => {
  const packet = createReviewPacket(base, coveredDraft(), selection)
  for (const value of [null, [], { ...packet, schemaVersion: 99 }, { ...packet, status: 'APPROVED' },
    { ...packet, execute: 'alert(1)' }, { ...packet, draft: { ...packet.draft, eventOverrides: {} } },
    { ...packet, selectedCase: '1/they/left/normal' }, { ...packet, selection: { ...selection, rotation: 9 } },
    { ...packet, draft: { ...packet.draft, overrides: { '1/they': { laterDefend: {} } } } }]) {
    assert.throws(() => parseStrategyImport(JSON.stringify(value)))
  }
  assert.throws(() => parseStrategyImport('{'))
  assert.throws(() => parseStrategyImport(' '.repeat(100001)))
  assert.throws(() => parseStrategyImport('"' + 'é'.repeat(50000) + '"'))
  assert.throws(() => parseStrategyImport(JSON.stringify(packet).replace('"reviewFindings":[', '"reviewFindings":[{"__proto__":{}},')))
})

test('Team reference uses actual overlaid source positions, roster P numbers, five stages, bent routes and literal notes', () => {
  const d = coveredDraft()
  d.caseOverrides['3/us/right/harry'].anchors = { Set: { logan: { x: -3.125, z: 3.875 } } }
  d.caseOverrides['3/us/right/harry'].routes = { Set: { logan: [{ x: -2, z: 4.25 }] } }
  const bundle = applyStrategy(base, d).bundle, main = bundle.plans.scenarios.find(s=>s.rotation===3 && s.serve==='us')
  const scenario = main.alternates.harryRight
  const reference = createTeamReference(bundle.team, scenario, d, 'logan')
  assert.equal(reference.status, DRAFT_MARKER); assert.equal(reference.stages.length, 5)
  assert.deepEqual(reference.stages.map(s=>s.stage), ['Start','Defend','Receive','Set','Attack'])
  for (const stage of reference.stages) for (const a of stage.actors) {
    const point = sampleTrack(scenario.tracks[a.id], stage.time)
    assert.deepEqual(a.point, { x: point.x, z: point.z })
    assert.equal(a.number, positionOf(bundle.team, 3, a.id))
    assert.equal(a.name, bundle.team.players.find(p=>p.id===a.id).name)
  }
  const set = reference.stages.find(s=>s.stage==='Set')
  assert.deepEqual(set.actors.find(a=>a.id==='logan').point, { x:-3.125, z:3.875 })
  assert.ok(set.path.some(p=>p.x===-2 && p.z===4.25), 'real incoming bend preserved')
  assert.equal(set.teamNote, 'Our written call')
  assert.equal(set.actors.find(a=>a.id==='harry').notes.primary, 'My note')
  assert.match(reference.stages[0].teamNote, /<script>/)
  assert.equal(reference.caseKey, '3/us/right/harry')
})
