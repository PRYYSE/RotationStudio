import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { applyStrategy, createStrategy, laterDefendTime, parseStrategy, exportStrategy, strategyLink, readStrategyLink, stageTimes } from './strategyDraft.ts'
import { sampleTrack } from './rotationModel.ts'
import { resolveStrategyRotation } from './strategyOverlay.ts'

const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const all = b => b.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])
const point = p => ({ x: p.x, z: p.z })
const own = ({ alternates, ...scenario }) => scenario
const find = (b, serve = 'they', side = 'left', touch = 'normal') => all(b).find(s => s.rotation === 3 && s.serve === serve && s.tactics.opponentAttack === side && s.tactics.firstTouch === touch)
const v2 = () => ({ ...createStrategy(), schemaVersion: 2 })

test('empty V1 and V2 preserve all 48 scenarios exactly; populated legacy geometry has its V4 fingerprint', () => {
  assert.equal(all(base).length, 48)
  for (const version of [1, 2]) assert.deepEqual(applyStrategy(base, { ...v2(), schemaVersion: version }).bundle, base)
  const empty = v2()
  empty.notes = {}; empty.caseOverrides = Object.fromEntries(all(base).map(s=>[`${s.rotation}/${s.serve}/${s.tactics.opponentAttack}/${s.tactics.firstTouch}`, { anchors:{Receive:{}},routes:{Set:{}}, ...(s.serve==='us'?{laterDefend:{anchors:{},routes:{}}}:{}) }]))
  assert.deepEqual(applyStrategy(base, empty).bundle, base)
  const legacy = { ...v2(), schemaVersion: 1 }
  for (const s of base.plans.scenarios) legacy.overrides[`${s.rotation}/${s.serve}`] = {
    anchors: { Start: { caleb: { x: -1, z: 5 } }, Receive: { caleb: { x: .4, z: 6 } }, Set: { logan: { x: -3.2, z: 3.2 } }, Defend: { jaz: { x: -3.1, z: 7 } } },
    routes: { Receive: { caleb: [{ x: 1, z: 5.8 }] } }, setterTarget: { x: 1.7, z: 1.3 }
  }
  const migrated = parseStrategy(JSON.stringify(legacy))
  assert.equal(migrated.schemaVersion, 2)
  assert.deepEqual(migrated.overrides, legacy.overrides)
  for (const draft of [legacy, migrated]) assert.equal(createHash('sha256').update(JSON.stringify(applyStrategy(base, draft).bundle)).digest('hex'), 'd54b27471747c2723c88d1b42af024d2926c170972d32d07d847bfad467b6b7d')
})

test('shared changes reach four cases; exact case merges per athlete, replaces routes including Straight and scalar false', () => {
  const draft = v2(), before = structuredClone(base)
  draft.overrides['3/they'] = { anchors: { Receive: { caleb: { x: .4, z: 6 }, jaz: { x: 2, z: 5 } } }, routes: { Receive: { caleb: [{ x: 3, z: 5 }] } }, setterTarget: { x: 1, z: 1 }, readyOptions: true }
  draft.caseOverrides = { '3/they/right/harry': { anchors: { Receive: { caleb: { x: -.5, z: 6.5 } } }, routes: { Receive: { caleb: [] } }, setterTarget: { x: 2, z: 1.5 }, readyOptions: false } }
  const result = applyStrategy(base, draft).bundle
  const sharedOnly = applyStrategy(base, { ...draft, caseOverrides: {} }).bundle
  let changed = 0
  for (const s of all(result)) {
    if (s.rotation !== 3 || s.serve !== 'they') { assert.deepEqual(own(s), own(all(base).find(v => v.rotation === s.rotation && v.serve === s.serve && v.tactics.opponentAttack === s.tactics.opponentAttack && v.tactics.firstTouch === s.tactics.firstTouch))); continue }
    changed++
    const exact = s.tactics.opponentAttack === 'right' && s.tactics.firstTouch === 'harry'
    assert.deepEqual(point(sampleTrack(s.tracks.caleb, s.firstContact.time)), exact ? { x: -.5, z: 6.5 } : { x: .4, z: 6 })
    assert.deepEqual(point(sampleTrack(s.tracks.jaz, s.firstContact.time)), { x: 2, z: 5 })
    assert.deepEqual(s.setterTarget, exact ? { x: 2, z: 1.5 } : { x: 1, z: 1 })
    if (!exact) assert.deepEqual(own(s), own(find(sharedOnly, 'they', s.tactics.opponentAttack, s.tactics.firstTouch)))
  }
  assert.equal(changed, 4)
  const exact = find(result, 'they', 'right', 'harry'), source = find(base, 'they', 'right', 'harry')
  assert.deepEqual(point(sampleTrack(exact.tracks.logan, stageTimes(exact).Set)), point(sampleTrack(source.tracks.logan, stageTimes(source).Set)), 'false overrides shared readyOptions')
  const start = sampleTrack(exact.tracks.caleb, exact.ball[0].start), end = sampleTrack(exact.tracks.caleb, exact.firstContact.time)
  const mid = sampleTrack(exact.tracks.caleb, (exact.ball[0].start + exact.firstContact.time) / 2)
  assert.ok(Math.abs((mid.x-start.x)*(end.z-start.z)-(mid.z-start.z)*(end.x-start.x)) < 1e-8, 'empty route replaces inherited bends')
  assert.deepEqual(base, before)
})

test('later own-serve anchors and routes use authored Defend again and stop at the next contact', () => {
  const draft = v2()
  draft.overrides['3/us'] = { anchors: { Defend: { georgia: { x: -.8, z: 6.8 } } } }
  const inherited = applyStrategy(base, draft).bundle
  draft.caseOverrides = { '3/us/right/harry': { laterDefend: { anchors: { georgia: { x: -1.5, z: 6 } }, routes: { georgia: [{ x: -2, z: 5 }] } } } }
  const result = applyStrategy(base, draft).bundle, s = find(result, 'us', 'right', 'harry'), old = find(inherited, 'us', 'right', 'harry')
  const later = s.phases.find(p => p.label === 'Defend again').time
  assert.deepEqual(point(sampleTrack(s.tracks.georgia, later)), { x: -1.5, z: 6 })
  for (const [id, track] of Object.entries(s.tracks)) for (const f of track) {
    if (f.time <= stageTimes(s).Attack || f.time >= s.ball.filter(b => b.kind === 'pass')[1].start) assert.deepEqual(f, old.tracks[id].find(k => k.time === f.time))
  }
  assert.deepEqual(s.ball, old.ball)
  assert.deepEqual(s.firstContact, old.firstContact); assert.deepEqual(s.secondContact, old.secondContact)
  assert.deepEqual(s.phases, old.phases)
  for (const other of all(result).filter(v => v !== s)) assert.deepEqual(own(other), own(all(inherited).find(v => v.rotation === other.rotation && v.serve === other.serve && v.tactics.opponentAttack === other.tactics.opponentAttack && v.tactics.firstTouch === other.tactics.firstTouch)))
  const missing = structuredClone(base)
  find(missing, 'us', 'right', 'harry').phases = find(missing, 'us', 'right', 'harry').phases.filter(p => p.label !== 'Defend again')
  assert.match(applyStrategy(missing, draft).warnings.join('\n'), /Defend again.*missing|missing.*Defend again/i)
})

test('V1 files and fragments migrate; V2 notes/cases roundtrip, bounds and unsafe fields are rejected', () => {
  const draft = v2()
  draft.caseOverrides = { '3/us/right/harry': { laterDefend: { routes: { harry: [] } } } }
  draft.notes = { team: { '3/us': { Defend: 'Read the ball 🏐' } }, players: { '3/us': { Set: { trent: { primary: 'Set', ifDifferent: '', fallback: 'Help', teamCall: 'Mine' } } } } }
  assert.deepEqual(parseStrategy(exportStrategy(draft)), draft)
  assert.deepEqual(readStrategyLink(new URL(strategyLink('https://example.test/', draft)).hash), draft)
  const legacy = { ...createStrategy(), schemaVersion: 1 }
  assert.equal(readStrategyLink(new URL(strategyLink('https://example.test/', legacy)).hash).schemaVersion, 2)
  for (const mutate of [
    d => d.caseOverrides = { '7/us/right/harry': {} }, d => d.caseOverrides = { '3/us/harry/right': {} },
    d => d.overrides['3/they'] = { laterDefend: {} }, d => d.caseOverrides = { '3/they/right/normal': { laterDefend: {} } },
    d => d.notes.team['3/us'].Defend = 'x'.repeat(401), d => d.notes.team['3/us'].Defend = '\u007f',
    d => d.notes.players['3/us'].Set.trent.execute = 'bad', d => d.caseOverrides['3/us/right/harry'].laterDefend.routes.harry = Array(9).fill({x:0,z:1})
  ]) { const bad = structuredClone(draft); mutate(bad); assert.throws(() => parseStrategy(JSON.stringify(bad))) }
  assert.throws(() => parseStrategy(JSON.stringify(draft).replace('"team":', '"__proto__":')))
  assert.throws(() => parseStrategy(' '.repeat(100_001)))
  assert.equal(strategyLink('https://example.test/', draft, 20), null)
})

test('case routes replace complete arrays while other players, stages and later-defence fields inherit', () => {
  const draft = v2(), a = { x: 1, z: 4 }, b = { x: 2, z: 5 }
  draft.overrides['3/us'] = { anchors: { Receive: { caleb: a }, Set: { logan: b } }, routes: { Receive: { caleb: [a,b], jaz: [a] } }, laterDefend: { anchors: { harry: a, jaz: b }, routes: { harry: [a,b] } } }
  draft.caseOverrides = { '3/us/right/harry': { routes: { Receive: { caleb: [b] } }, laterDefend: { anchors: { harry: b }, routes: { harry: [] } } } }
  const merged = resolveStrategyRotation(draft, find(base, 'us', 'right', 'harry'))
  assert.deepEqual(merged.routes.Receive, { caleb: [b], jaz: [a] })
  assert.deepEqual(merged.anchors, draft.overrides['3/us'].anchors)
  assert.deepEqual(merged.laterDefend, { anchors: { harry: b, jaz: b }, routes: { harry: [] } })
})

test('notes aggregate and UTF-8 strategy budgets reject pathological input and nonplain objects', () => {
  const draft = v2()
  draft.notes = { team: Object.fromEntries(Array.from({length:6}, (_,i) => ['they','us'].map(serve => [`${i+1}/${serve}`, Object.fromEntries(['Start','Receive','Set','Attack','Defend'].map(stage => [stage,'x'.repeat(400)]))])).flat()) }
  assert.throws(() => parseStrategy(JSON.stringify(draft)), /20,000/)
  const large = v2()
  large.caseOverrides = Object.fromEntries(all(base).map(s => [`${s.rotation}/${s.serve}/${s.tactics.opponentAttack}/${s.tactics.firstTouch}`, { routes: Object.fromEntries(['Start','Receive','Set','Attack','Defend'].map(stage => [stage, Object.fromEntries(base.team.players.map(p => [p.id, Array(8).fill({ x: 1.123456789, z: 5.123456789 })]))])) }]))
  assert.throws(() => exportStrategy(large), /100 KB/)
  const raw = JSON.stringify(v2())
  assert.throws(() => parseStrategy(raw + ' '.repeat(100_000 - raw.length - 1) + '🏐'), /100 KB/, 'UTF-8 bytes, not JS length')
  const hostile = v2(); hostile.overrides = Object.create({ '3/us': {} })
  assert.throws(() => applyStrategy(base, hostile), /overrides/)
})

test('later-defence event is variant-bound across all 24 own-serve cases and retains source metadata/contacts', () => {
  const draft = v2(), before = structuredClone(base)
  for (let rotation=1; rotation<=6; rotation++) draft.overrides[`${rotation}/us`] = { laterDefend: { anchors: { harry: {x:1,z:4} } } }
  const { bundle, warnings } = applyStrategy(base, draft)
  let count=0
  for (const s of all(bundle)) {
    const source = all(base).find(v => v.rotation===s.rotation && v.serve===s.serve && v.tactics.opponentAttack===s.tactics.opponentAttack && v.tactics.firstTouch===s.tactics.firstTouch)
    if (s.serve==='they') { assert.deepEqual(own(s),own(source)); continue }
    count++
    const later = s.phases.find(p=>p.label==='Defend again').time
    assert.deepEqual(point(sampleTrack(s.tracks.harry,later)),{x:1,z:4})
    assert.deepEqual(s.ball,source.ball); assert.deepEqual(s.tactics,source.tactics)
    for(const id of Object.keys(s.tracks)) for(const f of s.tracks[id]) {
      const old=source.tracks[id].find(k=>k.time===f.time)
      assert.equal(f.role,old.role)
      if (f.time<=stageTimes(s).Attack) assert.deepEqual(f,old)
      assert.ok(Math.hypot(sampleTrack(s.tracks[id],f.time-1e-7).x-f.x,sampleTrack(s.tracks[id],f.time-1e-7).z-f.z)<.001)
    }
  }
  assert.equal(count,24); assert.deepEqual(base,before)
  assert.ok(warnings.some(w=>w.includes('movement screen')), 'unrealistic adjustment is retained with a warning')
})

test('later time follows source event changes and requires an own-serve occurrence after our hit', () => {
  const s=structuredClone(find(base,'us'))
  const phase=s.phases.find(p=>p.label==='Defend again')
  phase.time+=.123
  assert.equal(laterDefendTime(s),phase.time)
  phase.time=stageTimes(s).Attack-.1
  assert.equal(laterDefendTime(s),undefined)
  assert.equal(laterDefendTime(find(base)),undefined)
})
