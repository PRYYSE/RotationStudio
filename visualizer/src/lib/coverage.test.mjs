import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { coverageAreas } from './coverage.ts'
import { applyStrategy, createStrategy, stageTimes, stageOrder } from './strategyDraft.ts'
import { isFront, positionOf, sampleTrack } from './rotationModel.ts'

const read = name => JSON.parse(readFileSync(new URL(`../../public/plans/${name}.json`, import.meta.url)))
const base = { team: read('team'), plans: read('rotations') }
const scenarios = bundle => bundle.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates)])

test('coverage follows actual sampled positions throughout all 48 timelines and switches off', () => {
  for (const s of scenarios(base)) {
    for (const t of [...Object.values(stageTimes(s)), ...Array.from({length: 31}, (_, i) => i / 30 * s.duration)]) {
      assert.deepEqual(coverageAreas(base.team, s, t, false), [])
      const areas = coverageAreas(base.team, s, t, true)
      assert.equal(areas.length, 6)
      for (const area of areas) {
        const p = sampleTrack(s.tracks[area.player], t)
        assert.deepEqual(area.center, { x: p.x, z: p.z })
        assert.ok(area.radiusX > 0 && area.radiusX <= 2.65)
        assert.ok(area.radiusZ > 0 && area.radiusZ <= 2.55)
      }
    }
    for (const zone of s.tactics.receiveZones) {
      const area = coverageAreas(base.team, s, s.firstContact.time, true).find(a => a.player === zone.player)
      assert.equal(area.radiusX, zone.radiusX); assert.equal(area.radiusZ, zone.radiusZ)
      assert.equal(area.duty, zone.duty)
    }
  }
})

test('coverage follows dragged stage anchors for every athlete, stage and serve with immutable source', () => {
  const source = JSON.stringify(base)
  for (const root of base.plans.scenarios) for (const stage of stageOrder(root.serve)) {
    const draft = createStrategy('Dragged', 'Coach', base)
    const key = `${root.rotation}/${root.serve}`
    draft.overrides[key] = { anchors: { [stage]: Object.fromEntries(base.team.players.map((p, i) => [p.id, {x: -3 + i, z: 4 + i * .2}])) } }
    const edited = applyStrategy(base, draft).bundle
    const selected = edited.plans.scenarios.find(s => s.rotation === root.rotation && s.serve === root.serve)
    for (const s of [selected, ...Object.values(selected.alternates)]) {
      const areas = coverageAreas(edited.team, s, stageTimes(s)[stage], true)
      for (const p of base.team.players) assert.deepEqual(areas.find(a => a.player === p.id).center, draft.overrides[key].anchors[stage][p.id])
    }
  }
  assert.equal(JSON.stringify(base), source)
})

test('defence distinguishes compact blocks, short tips and broader back/deep responsibility', () => {
  for (const s of scenarios(base)) {
    const areas = coverageAreas(base.team, s, stageTimes(s).Defend, true)
    const blocks = areas.filter(a => a.responsibility === 'Block lane')
    const short = areas.filter(a => a.responsibility === 'Short / tip')
    const deep = areas.filter(a => a.responsibility === 'Back / deep')
    assert.ok(blocks.length && short.length && deep.length)
    assert.ok(Math.max(...blocks.map(a => a.radiusZ)) < Math.min(...short.map(a => a.radiusZ)))
    assert.ok(Math.max(...short.map(a => a.radiusZ)) < Math.min(...deep.map(a => a.radiusZ)))
    for (const a of blocks) assert.ok(isFront(positionOf(base.team, s.rotation, a.player)))
  }
  const s = structuredClone(base.plans.scenarios[0]), t = stageTimes(s).Attack
  // Same cover role and spot, different ordinal preferences: broad vs compact.
  for (const id of ['caleb', 'jaz']) Object.assign(s.tracks[id].find(k => k.time === t), {x: 0, z: 6, role: 'help'})
  const areas = coverageAreas(base.team, s, t, true)
  assert.ok(areas.find(a => a.player === 'caleb').radiusX > areas.find(a => a.player === 'jaz').radiusX)
})

test('six canonical high contrast identities survive the data-driven generator source', () => {
  assert.deepEqual(Object.fromEntries(base.team.players.map(p => [p.id, p.color])), {
    harry: '#36C6FA', caleb: '#A6E34A', trent: '#FF8640', logan: '#AB87F5', georgia: '#F26FA6', jaz: '#FFD84E'
  })
  assert.equal(new Set(base.team.players.map(p => p.color)).size, 6)
  const generator = readFileSync(new URL('../../scripts/author_tactics_v2.py', import.meta.url), 'utf8')
  assert.match(generator, /TEAM=json.loads\(\(ROOT\/"team.json"\).read_text\(\)\)/)
  assert.doesNotMatch(generator, /athlete\["color"\]\s*=/)
})
