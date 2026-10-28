import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { receiveExample, SAMPLE_X, SAMPLE_Z, EXAMPLE_SCREEN } from './receiveExample.ts'
import { selectScenario, sampleTrack, sampleArc, positionOf, isFront, readRotationLink, rotationLink } from './rotationModel.ts'
import { validateBundle, serviceDiagnostics, exportBundle, parseBundle } from './rotationValidation.ts'

const bundle = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const variants = [['left', 'normal', null], ['right', 'normal', 'right'], ['left', 'harry', 'harry'], ['right', 'harry', 'harryRight']]
const d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)
const near = (a, b) => assert.ok(d(a, b) < 1e-8, `${JSON.stringify(a)} != ${JSON.stringify(b)}`)
const authored = (rotation, serve = 'they', side = 'left', touch = 'normal') => selectScenario(bundle.plans.scenarios.find((s) => s.rotation === rotation && s.serve === serve), side, touch)
const insert = (scenario, key = null) => {
  const b = structuredClone(bundle), index = b.plans.scenarios.findIndex((s) => s.rotation === scenario.rotation && s.serve === scenario.serve)
  if (key) b.plans.scenarios[index].alternates[key] = scenario
  else b.plans.scenarios[index] = { ...scenario, alternates: b.plans.scenarios[index].alternates }
  return b
}

// One matrix exercises all nine landing locations against all 48 selections.
// Every successful result also goes through the unchanged structural checks.
const results = []
for (const base of bundle.plans.scenarios) for (const [side, touch, key] of variants) {
  const source = selectScenario(base, side, touch)
  for (const z of SAMPLE_Z) for (const x of SAMPLE_X) results.push({ source, side, touch, key, sample: { x, z, receiver: 'auto' }, result: receiveExample(bundle.team, source, { x, z, receiver: 'auto' }) })
}

test('nine samples across all 48 variants retain structural legality and reachable contacts', () => {
  assert.equal(results.length, 432)
  for (const base of bundle.plans.scenarios) for (const side of ['left', 'right']) {
    assert.ok(results.some((r) => r.source.rotation === base.rotation && r.source.serve === base.serve && r.side === side && r.touch === 'normal' && r.result.ok), `no reachable normal example R${base.rotation}/${base.serve}/${side}`)
  }
  const harryRotations = new Set()
  for (const { source, touch, key, sample, result } of results) {
    if (!result.ok) { assert.equal('scenario' in result, false); assert.match(result.message, /^No feasible first touch at this sample\./); continue }
    const s = result.scenario
    assert.deepEqual(validateBundle(insert(s, key)), [])
    assert.deepEqual(serviceDiagnostics(bundle.team, s), [])
    assert.equal(s.teachingOnly, true)
    assert.equal(s.alternates, undefined)
    assert.deepEqual(s.secondContact, source.secondContact)
    assert.deepEqual(s.setterTarget, source.setterTarget)
    assert.equal(result.setter, source.secondContact.player)
    assert.notEqual(result.hitter, result.receiver)
    near(sampleTrack(s.tracks[result.receiver], s.firstContact.time), sample)
    near(sampleTrack(s.tracks[result.setter], s.secondContact.time), s.setterTarget)
    const passIndex = s.ball.findIndex((b) => b.kind === 'pass'), hit = s.ball[passIndex + 2]
    near(sampleTrack(s.tracks[result.hitter], hit.start), hit.from)
    assert.ok(isFront(positionOf(bundle.team, s.rotation, result.hitter)))
    const afterPass = sampleTrack(s.tracks[result.receiver], s.secondContact.time)
    assert.ok(d(afterPass, sample) <= 0.65 + 1e-8)
    assert.notEqual(sampleTrack(s.tracks[result.receiver], hit.start).role, 'attack')
    if (touch === 'harry') {
      harryRotations.add(s.rotation)
      assert.equal(result.receiver, 'harry')
      assert.equal(result.setter, source.tactics.fallbackSetter)
    } else { assert.notEqual(result.receiver, 'harry'); assert.equal(result.setter, 'harry') }
  }
  assert.ok(harryRotations.size >= 3)
})

test('derived keyframes and ball endpoints are continuous, chronological and clear the net', () => {
  for (const { result } of results.filter((r) => r.result.ok)) {
    const s = result.scenario
    for (const track of Object.values(s.tracks)) {
      assert.equal(track[0].time, 0); assert.equal(track.at(-1).time, s.duration)
      for (let i = 1; i < track.length; i++) {
        assert.ok(track[i].time > track[i - 1].time)
        // Seeking either side of a frame cannot jump position.
        assert.ok(d(sampleTrack(track, track[i].time - 1e-5), track[i]) < 0.001)
        assert.ok(d(sampleTrack(track, track[i].time + 1e-5), track[i]) < 0.001)
      }
    }
    for (let i = 0; i < s.ball.length; i++) {
      const b = s.ball[i]
      assert.ok(b.end > b.start)
      if (i) { assert.ok(b.start >= s.ball[i - 1].end); assert.deepEqual(b.from, s.ball[i - 1].to) }
      if (b.from.z * b.to.z < 0) {
        let lo = 0, hi = 1
        for (let n = 0; n < 40; n++) { const mid = (lo + hi) / 2; if (sampleArc(b, mid).z * b.from.z > 0) lo = mid; else hi = mid }
        assert.ok(sampleArc(b, (lo + hi) / 2).y >= bundle.plans.netHeight, `below net R${s.rotation}/${s.serve}`)
      }
    }
    for (let i = 1; i < s.phases.length; i++) assert.ok(s.phases[i].time > s.phases[i - 1].time)
    for (const player of bundle.team.players) for (const k of s.tracks[player.id]) {
      const front = isFront(positionOf(bundle.team, s.rotation, player.id))
      if (k.role === 'block') assert.equal(front, true)
      if (k.role === 'attack' && !front && k.aboveNet) assert.ok(k.takeoffZ >= 3)
    }
  }
})

test('exact service-hit identity and held starts survive; own serve samples the later attack from defensive ready', () => {
  for (const { source, sample, result } of results.filter((r) => r.result.ok)) {
    const s = result.scenario, serve = s.ball[0]
    assert.equal(serve.start, source.ball[0].start)
    assert.deepEqual(serve.from, source.ball[0].from)
    for (const id of bundle.team.initialOrder) {
      for (let t = 0; t <= serve.start; t += 0.05) near(sampleTrack(s.tracks[id], t), source.tracks[id][0])
      assert.deepEqual(s.tracks[id].filter((k) => k.time <= serve.start), source.tracks[id].filter((k) => k.time <= serve.start))
      if (id !== result.receiver && id !== source.firstContact.player) assert.deepEqual(s.tracks[id], source.tracks[id])
    }
    if (s.serve === 'they') {
      for (const offset of [0, 0.09, 0.18]) near(sampleTrack(s.tracks[result.receiver], serve.start + offset), source.tracks[result.receiver][0])
    }
    if (s.serve === 'us') {
      assert.deepEqual(serve, source.ball[0])
      const incomingIndex = s.ball.findIndex((b) => b.kind === 'pass') - 1
      assert.equal(s.ball[incomingIndex].kind, 'attack')
      assert.deepEqual(s.ball.slice(0, incomingIndex), source.ball.slice(0, incomingIndex))
      const ready = source.phases.find((p) => p.label === 'Defence ready').time
      for (let t = 0; t <= ready; t += 0.05) near(sampleTrack(s.tracks[result.receiver], t), sampleTrack(source.tracks[result.receiver], t))
      assert.ok(d(sampleTrack(source.tracks[result.receiver], ready), sample) <= EXAMPLE_SCREEN.reach)
    }
  }
})

test('all accepted continuations screen below 4m/s with at least .56m centre spacing and no teleports', () => {
  for (const { result } of results.filter((r) => r.result.ok)) {
    const s = result.scenario, ids = bundle.team.initialOrder
    let previous = ids.map((id) => sampleTrack(s.tracks[id], 0))
    const step = 0.02
    for (let t = step; t <= s.duration; t += step) {
      const spots = ids.map((id) => sampleTrack(s.tracks[id], t))
      for (let i = 0; i < spots.length; i++) {
        assert.ok(d(spots[i], previous[i]) / step <= 4 + 1e-6, `${ids[i]} moves too fast`)
        for (let j = i + 1; j < spots.length; j++) assert.ok(d(spots[i], spots[j]) >= 0.56, `${ids[i]}/${ids[j]} too close`)
      }
      previous = spots
    }
  }
})

test('forced unreachable, uncovered auto and forbidden Harry overrides return no animation', () => {
  for (const sample of [{ x: 3, z: 8, receiver: 'logan' }, { x: 3, z: 3.5, receiver: 'auto' }, { x: 0, z: 5.8, receiver: 'harry' }, { x: 0, z: 5.8, receiver: 'unknown' }, { x: 1, z: 5.8, receiver: 'auto' }]) {
    const result = receiveExample(bundle.team, authored(1), sample)
    assert.equal(result.ok, false); assert.equal('scenario' in result, false)
    assert.match(result.message, /^No feasible first touch at this sample\./)
  }
  const denied = receiveExample(bundle.team, authored(2, 'they', 'left', 'harry'), { x: 0, z: 3.5, receiver: 'caleb' })
  assert.equal(denied.ok, false); assert.match(denied.message, /Harry-first allows only Harry/)
  const crowding = receiveExample(bundle.team, authored(4, 'they', 'left', 'harry'), { x: 0, z: 3.5, receiver: 'harry' })
  assert.equal(crowding.ok, false); assert.match(crowding.message, /Local paths are too close/)
})

test('Harry-first retains the authored fallback setter for both serve modes', () => {
  for (const serve of ['they', 'us']) for (const side of ['left', 'right']) for (const receiver of ['auto', 'harry']) {
    const source = authored(2, serve, side, 'harry')
    const result = receiveExample(bundle.team, source, { x: 0, z: 3.5, receiver })
    assert.equal(result.ok, true)
    assert.equal(result.receiver, 'harry'); assert.equal(result.setter, source.tactics.fallbackSetter)
    assert.deepEqual(result.scenario.secondContact, source.secondContact)
  }
})

test('R5 Georgia receives and Caleb becomes the different eligible front hitter without swapping lanes', () => {
  for (const serve of ['they', 'us']) for (const side of ['left', 'right']) {
    const source = authored(5, serve, side), snapshot = structuredClone(source)
    const result = receiveExample(bundle.team, source, { x: -3, z: 3.5, receiver: 'georgia' })
    assert.equal(result.ok, true); assert.equal(result.receiver, 'georgia'); assert.equal(result.hitter, 'caleb')
    assert.equal(result.setter, 'harry')
    for (const id of ['trent', 'logan', 'jaz', 'harry']) assert.deepEqual(result.scenario.tracks[id], source.tracks[id])
    assert.match(result.message, /Georgia receives · Harry sets · Caleb sample hitter/)
    assert.equal(result.scenario.phases.find((p) => p.time === source.secondContact.time).cue, 'Harry sets to Caleb. Georgia recovers; other athletes keep their lanes.')
    assert.deepEqual(source, snapshot)
  }
})

test('named receivers stay named and coaching preferences rank close feasible choices without creating reach', () => {
  for (const [rotation, x, z, receiver] of [[1, 0, 5.8, 'caleb'], [1, -3, 5.8, 'jaz'], [2, 3, 5.8, 'georgia'], [3, 3, 5.8, 'logan'], [5, 0, 5.8, 'trent']]) {
    const result = receiveExample(bundle.team, authored(rotation), { x, z, receiver })
    assert.equal(result.ok, true); assert.equal(result.receiver, receiver)
  }
  const source = authored(5), original = structuredClone(source), team = structuredClone(bundle.team)
  // At this seam Caleb and Jaz are both reachable. Ordinal preferences break
  // close choices; they never change the common reach/speed screen.
  const sample = { x: 3, z: 5.8, receiver: 'auto' }
  assert.equal(receiveExample(team, source, sample).receiver, 'caleb')
  Object.assign(team.players.find((p) => p.id === 'caleb').skills, { receive: 1, mobility: 1 })
  Object.assign(team.players.find((p) => p.id === 'jaz').skills, { receive: 5, mobility: 5 })
  assert.equal(receiveExample(team, source, sample).receiver, 'jaz')
  assert.deepEqual(source, original)
  for (const p of team.players) Object.assign(p.skills, { receive: 5, mobility: 5 })
  assert.equal(receiveExample(team, authored(1), { x: -3, z: 8, receiver: 'logan' }).ok, false)
})

test('teaching examples cannot be exported or imported as plans, even with approved status', () => {
  const result = receiveExample(bundle.team, authored(5), { x: -3, z: 3.5, receiver: 'georgia' })
  assert.equal(result.ok, true)
  const b = insert(result.scenario)
  assert.deepEqual(validateBundle(b), [])
  for (const status of ['DRAFT', 'APPROVED']) {
    b.team.status = b.plans.status = status
    assert.throws(() => exportBundle(b), /Teaching examples cannot be exported/)
    assert.throws(() => parseBundle(JSON.stringify(b)), /Teaching examples cannot be imported/)
  }
  assert.deepEqual(parseBundle(exportBundle(bundle)), bundle)
})

test('sample links roundtrip variations; legacy and malformed queries fall back to authored', () => {
  for (const serve of ['they', 'us']) for (const [side, first] of variants) for (const receiver of ['auto', 'georgia', 'harry']) {
    const example = { x: -3, z: 3.5, receiver }
    const url = new URL(rotationLink('https://example.org/?draft=private#old', 5, serve, 5.3, side, first, example))
    assert.deepEqual(readRotationLink(url.search), { rotation: 5, serve, time: 5.3, opponentAttack: side, firstTouch: first, example })
    assert.equal(url.searchParams.has('draft'), false); assert.equal(url.hash, '')
  }
  for (const query of ['', '?r=5&serve=us', '?sample=nope', '?sample=1,5.8', '?sample=0,9', '?sample=0,3.5,8', '?sample=,3.5', '?sample=0,3.5&receiver=%3Cscript%3E']) assert.equal(readRotationLink(query).example, undefined, query)
})

test('ordinal skills validate and legacy plans without preferences fail samples explicitly', () => {
  for (const value of [0, 6, 1.5, '5', null]) {
    const b = structuredClone(bundle); b.team.players[0].skills.mobility = value
    assert.match(validateBundle(b).join('\n'), /ordinal preferences/)
  }
  const team = structuredClone(bundle.team)
  delete team.players[0].skills
  assert.equal(receiveExample(team, authored(1), { x: 0, z: 5.8, receiver: 'auto' }).ok, false)
})
