import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyStrategy, createStrategy, parseStrategy, exportStrategy, stageTimes, stageOrder, strategyLink, readStrategyLink } from './strategyDraft.ts'
import { sampleTrack, isFront, positionOf } from './rotationModel.ts'
import { serviceDiagnostics, validateBundle } from './rotationValidation.ts'

const original = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const variants = s => [s, ...Object.values(s.alternates ?? {})]
const spot = p => ({ x: p.x, z: p.z })
test('five stages resolve actual contacts and ready event, including variant-specific event changes', () => {
  for (const base of original.plans.scenarios) for (const s of variants(base)) {
    const times = stageTimes(s)
    assert.equal(times.Start, 0); assert.equal(times.Receive, s.firstContact.time)
    assert.equal(times.Set, s.secondContact.time)
    assert.equal(times.Attack, s.phases.find(p => p.label === 'Our attack').time)
    assert.equal(times.Defend, s.phases.find(p => p.label === 'Defence ready').time)
    assert.deepEqual(stageOrder(s.serve), s.serve === 'us' ? ['Start','Defend','Receive','Set','Attack'] : ['Start','Receive','Set','Attack','Defend'])
    const shifted = structuredClone(s); shifted.firstContact.time += .123
    shifted.phases.find(p => p.label === 'Defence ready').time += .321
    assert.equal(stageTimes(shifted).Receive, shifted.firstContact.time)
    assert.equal(stageTimes(shifted).Defend, times.Defend + .321)
  }
})
test('all rotations propagate sparse edits across four variants, preserve service and source, link contacts', () => {
  const before = JSON.stringify(original), draft = createStrategy('Test', 'Coach')
  for (const base of original.plans.scenarios) draft.overrides[`${base.rotation}/${base.serve}`] = {
    anchors: { Start: { harry: { x: 0, z: 5 } }, Receive: { caleb: { x: .4, z: 6 } }, Set: { harry: { x: 1.6, z: 1.2 }, logan: { x: -3.2, z: 3.2 } }, Attack: { logan: { x: -2.9, z: 2 } }, Defend: { jaz: { x: -3.1, z: 7 } } },
    routes: { Receive: { caleb: [{ x: 1, z: 5.8 }] } }, setterTarget: { x: 1.7, z: 1.3 }
  }
  const result = applyStrategy(original, draft)
  assert.match(result.warnings.join('\n'), /Foundation needs tactical review/)
  assert.match(result.warnings.join('\n'), /Start.*preview/)
  for (const base of result.bundle.plans.scenarios) for (const s of variants(base)) {
    const source = variants(original.plans.scenarios.find(v => v.rotation === s.rotation && v.serve === s.serve))[variants(base).indexOf(s)]
    const times = stageTimes(s)
    assert.deepEqual(spot(sampleTrack(s.tracks.caleb, times.Receive)), { x: .4, z: 6 })
    assert.deepEqual(spot(sampleTrack(s.tracks.logan, times.Set)), { x: -3.2, z: 3.2 })
    assert.deepEqual(serviceDiagnostics(original.team, s), [])
    assert.deepEqual(s.ball[0].from, source.ball[0].from)
    for (const p of original.team.players) for (const t of [0, s.ball[0].start / 2, s.ball[0].start]) assert.deepEqual(spot(sampleTrack(s.tracks[p.id], t)), spot(source.tracks[p.id][0]))
    const pass = s.ball.find(b => b.kind === 'pass')
    assert.deepEqual(spot(pass.from), spot(sampleTrack(s.tracks[s.firstContact.player], times.Receive)))
    assert.deepEqual(spot(pass.to), s.setterTarget)
    assert.deepEqual(spot(sampleTrack(s.tracks[s.secondContact.player], times.Set)), s.setterTarget)
    for (let i=1;i<s.ball.length;i++) assert.deepEqual(s.ball[i-1].to,s.ball[i].from)
    for (const track of Object.values(s.tracks)) for (const frame of track.slice(1)) {
      const a = sampleTrack(track, frame.time - 1e-7), b = sampleTrack(track, frame.time)
      assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.001)
    }
  }
  assert.equal(JSON.stringify(original), before)
})
test('new foundations give all eligible front hitters ready options at Set without moving the active setter', () => {
  const draft = createStrategy('Ready', 'Coach', original)
  const { bundle } = applyStrategy(original, draft)
  for (const base of bundle.plans.scenarios) for (const s of variants(base)) for (const p of original.team.players) {
    if (!isFront(positionOf(original.team, s.rotation, p.id)) || p.id === s.secondContact.player) continue
    const ready = sampleTrack(s.tracks[p.id], stageTimes(s).Set)
    assert.ok(ready.z >= 3 && ready.z <= 4.5, `${p.id} R${s.rotation} ${s.serve}`)
    assert.notEqual(ready.role, 'attack')
  }
  assert.deepEqual(validateBundle(bundle), [])
})
test('sparse export and fragment roundtrip unicode; hostile values are bounded and rejected', () => {
  const draft = createStrategy('Équipe 🏐', 'Caleb')
  draft.overrides['1/they'] = { anchors: { Receive: { caleb: {x: 1,z: 6} } }, routes: {} }
  assert.deepEqual(parseStrategy(exportStrategy(draft)), draft)
  assert.deepEqual(readStrategyLink(new URL(strategyLink('https://example.test/?mode=rotations',draft)).hash),draft)
  for (const mutate of [d=>d.schemaVersion=9,d=>d.id='team-v3',d=>d.overrides['9/us']={},d=>d.overrides['1/they'].anchors.Receive.unknown={x:0,z:1},d=>d.overrides['1/they'].anchors.Receive.caleb.x=null,d=>d.overrides['1/they'].routes.Set={harry:[{x:0,z:-1}]},d=>d.overrides['1/they'].setterTarget={x:0,z:9},d=>d.overrides['1/they'].anchors.Nope={}]) {
    const bad=structuredClone(draft); mutate(bad); assert.throws(()=>parseStrategy(JSON.stringify(bad)))
  }
  assert.throws(()=>parseStrategy('{"__proto__":{},"schemaVersion":1}'))
  assert.throws(()=>parseStrategy(' '.repeat(100001)))
  assert.equal(strategyLink('https://example.test/',{...draft,name:'x'.repeat(80)},100),null)
  const other=structuredClone(draft); other.baseRevision='other-v3'
  assert.match(applyStrategy(original,other).warnings.join('\n'),/base revision/)
})
