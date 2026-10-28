import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateBundle, parseBundle, exportBundle } from './rotationValidation.ts'
import { selectScenario, showReceiveAreas, readRotationLink, rotationLink, sampleTrack, positionOf, isFront } from './rotationModel.ts'

const original = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const combinations = [['base', 'left', 'normal'], ['right', 'right', 'normal'], ['harry', 'left', 'harry'], ['harryRight', 'right', 'harry']]
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)
const rejects = (mutate, pattern) => {
  const b = structuredClone(original)
  mutate(b.plans.scenarios[0].alternates.harryRight, b)
  assert.match(validateBundle(b).join('\n'), pattern)
}

test('all 48 authored selections retain legal service spots, contacts, blocking and R3 next setter', () => {
  assert.deepEqual(validateBundle(original), [])
  assert.equal(original.team.status, 'DRAFT')
  assert.equal(original.plans.status, 'DRAFT')
  let count = 0
  for (const base of original.plans.scenarios) for (const [key, attack, touch] of combinations) {
    const s = selectScenario(base, attack, touch)
    assert.equal(s, key === 'base' ? base : base.alternates[key])
    assert.equal(s.tactics.opponentAttack, attack)
    assert.equal(s.tactics.firstTouch, touch)
    for (const p of original.team.players) {
      const atServe = sampleTrack(s.tracks[p.id], s.ball[0].start)
      near(atServe.x, base.tracks[p.id][0].x); near(atServe.z, base.tracks[p.id][0].z)
      for (const frame of s.tracks[p.id].filter((k) => k.role === 'block')) assert.equal(isFront(positionOf(original.team, s.rotation, p.id)), true, `${p.id} at ${frame.time}`)
    }
    const pass = s.ball.find((b) => b.kind === 'pass')
    const receiver = sampleTrack(s.tracks[s.firstContact.player], s.firstContact.time)
    const setter = sampleTrack(s.tracks[s.secondContact.player], s.secondContact.time)
    near(pass.from.x, receiver.x); near(pass.from.z, receiver.z)
    near(pass.to.x, setter.x); near(pass.to.z, setter.z)
    if (touch === 'harry') {
      assert.equal(s.firstContact.player, 'harry')
      assert.equal(s.secondContact.player, s.tactics.fallbackSetter)
    }
    if (s.rotation === 3) assert.equal(s.tactics.nextSetter, 'trent')
    count++
  }
  assert.equal(count, 48)
})

test('every base and alternate is validated, including a corrupted final harryRight trajectory', () => {
  for (let i = 0; i < 12; i++) for (const [key] of combinations) {
    const b = structuredClone(original), base = b.plans.scenarios[i]
    const s = key === 'base' ? base : base.alternates[key]
    s.ball.find((b) => b.kind === 'pass').from.x += 1
    const errors = validateBundle(b).join('\n')
    assert.match(errors, new RegExp(`R${base.rotation} / ${base.serve} / ${key}: pass must connect`))
    assert.throws(() => exportBundle(b), /pass must connect/)
  }
})

test('alternate validation rejects service, eligibility, continuity and contact corruption', () => {
  const cases = [
    [(s) => s.tracks.harry[1].x += 0.5, /hold service-contact spots/],
    [(s) => s.tracks.logan[1].x = s.tracks.trent[1].x, /must be left of/],
    [(s) => s.tracks.jaz[1].z = s.tracks.trent[1].z, /must be behind/],
    [(s) => s.tracks.harry[1].z = 9, /inside the court/],
    [(s) => s.tracks.harry[4].role = 'block', /back-row and cannot block/],
    [(s) => Object.assign(s.tracks.harry[4], { role: 'attack', aboveNet: true, takeoffZ: 2 }), /above-net back-row attack/],
    [(s) => s.ball[2].from.x += 1, /share endpoints/],
    [(s) => s.ball[1].end += 0.1, /invalid ball segment/],
    [(s) => s.tracks[s.secondContact.player].find((k) => k.time === s.secondContact.time).x += 1, /must reach setterTarget/],
    [(s) => s.ball[1].to.x += 1, /pass must connect/],
    [(s) => s.tracks.harry.find((k) => k.time === s.firstContact.time).x += 1, /pass must connect/],
    [(s) => s.tactics.nextSetter = 'jaz', /next pass must connect/],
    [(s) => s.tracks.harry[0].x += 0.1, /same starting coordinates/],
    [(s) => s.rotation = 2, /match base rotation/],
    [(s) => s.alternates = {}, /nested alternates/],
  ]
  for (const [mutate, pattern] of cases) rejects(mutate, pattern)
  rejects((s, b) => b.plans.scenarios[1].alternates.right.tracks.harry[1].z = 9, /beyond the 9m endline/)
})

test('optional V2 metadata validates enums, backup IDs, zone IDs, radii and court bounds safely', () => {
  const cases = [
    [(s) => delete s.tactics, /requires tactics/],
    [(s) => s.tactics.opponentAttack = 'up', /opponentAttack/],
    [(s) => s.tactics.opponentAttack = 'left', /opponentAttack/],
    [(s) => s.tactics.firstTouch = 'normal', /firstTouch/],
    [(s) => s.tactics.firstTouch = 'other', /firstTouch/],
    [(s) => s.tactics.fallbackSetter = 'nobody', /fallbackSetter/],
    [(s) => s.tactics.fallbackSetter = 'harry', /local backup/],
    [(s) => s.tactics.nextSetter = 'nobody', /nextSetter/],
    [(s) => s.firstContact.player = 'caleb', /Harry-first contacts/],
    [(s) => s.secondContact.player = 'trent', /Harry-first contacts/],
    [(s) => s.tactics.receiveZones = {}, /receiveZones/],
    [(s) => s.tactics.receiveZones[0].player = 'nobody', /invalid receive zone/],
    [(s) => s.tactics.receiveZones[1].player = s.tactics.receiveZones[0].player, /invalid receive zone/],
    [(s) => s.tactics.receiveZones[0].radiusX = 0, /positive radii/],
    [(s) => s.tactics.receiveZones[0].radiusZ = -1, /positive radii/],
    [(s) => s.tactics.receiveZones[0].radiusX = Infinity, /positive radii/],
    [(s) => s.tactics.receiveZones[0].center.x = 4.6, /bounds/],
    [(s) => s.tactics.receiveZones[0].center.z = 9.1, /bounds/],
    [(s) => s.tactics.receiveZones[0].radiusX = 4.5, /bounds/],
    [(s) => s.tactics.receiveZones[0].radiusZ = 9, /bounds/],
    [(s) => s.tactics.receiveZones[0].duty = 'large', /duty/],
    [(s) => s.tactics.receiveZones[0].label = '', /label/],
    [(s) => s.tactics.receiveZones[0] = null, /invalid receive zone/],
    [(s) => s.tactics.coachNote = '', /coachNote/],
    [(s, b) => delete b.plans.scenarios[0].alternates.right, /full right, harry and harryRight/],
    [(s, b) => b.plans.scenarios[0].alternates = null, /full right, harry and harryRight/],
    [(s, b) => b.plans.scenarios[0].firstContact.player = 'harry', /Normal first contact cannot name Harry/],
  ]
  for (const [mutate, pattern] of cases) rejects(mutate, pattern)
  const bad = { toString: null, valueOf: null }
  for (const field of ['opponentAttack', 'firstTouch', 'fallbackSetter', 'nextSetter']) rejects((s) => s.tactics[field] = bad, /tactics/)
})

test('V2 import export roundtrips all full alternatives below the existing 2MB limit', () => {
  const text = exportBundle(original)
  assert.ok(Buffer.byteLength(text) < 2_000_000)
  assert.deepEqual(parseBundle(text), original)
})

test('frozen legacy demo still accepts optional standalone tactics without needing alternates', () => {
  const demo = { team: JSON.parse(readFileSync(new URL('../../tests/fixtures/demo-team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../tests/fixtures/demo-rotations.json', import.meta.url))) }
  assert.deepEqual(validateBundle(demo), [])
  for (const s of demo.plans.scenarios) {
    s.tactics = { opponentAttack: 'left', firstTouch: 'normal', fallbackSetter: 'caleb', nextSetter: 'harry', receiveZones: [], coachNote: 'Optional metadata on the frozen demo.' }
    assert.equal(selectScenario(s, 'right', 'harry'), s)
    assert.equal(showReceiveAreas(s, 0, true), false)
  }
  assert.deepEqual(parseBundle(exportBundle(demo)), demo)
})

test('selection links roundtrip all four choices for both serve owners and default old or invalid links', () => {
  for (const serve of ['they', 'us']) for (const [, opponentAttack, firstTouch] of combinations) {
    const url = rotationLink('https://example.org/RotationStudio/?draft=secret#old', 3, serve, 7.52, opponentAttack, firstTouch)
    assert.deepEqual(readRotationLink(new URL(url).search), { rotation: 3, serve, time: 7.52, opponentAttack, firstTouch })
    assert.equal(new URL(url).searchParams.has('draft'), false)
  }
  for (const search of ['', '?r=2&serve=us', '?attack=other&first=other']) {
    const state = readRotationLink(search)
    assert.equal(state.opponentAttack, 'left'); assert.equal(state.firstTouch, 'normal')
  }
})

test('receive areas appear only through their early first contact, with R5 overlapping primary and narrow compact lanes', () => {
  for (const base of original.plans.scenarios) for (const [, attack, touch] of combinations) {
    const s = selectScenario(base, attack, touch)
    for (const time of [0, s.ball[0].start, s.firstContact.time]) assert.equal(showReceiveAreas(s, time, true), s.serve === 'they')
    for (const time of [s.firstContact.time + 0.01, s.secondContact.time, s.duration - 1, s.duration]) assert.equal(showReceiveAreas(s, time, true), false)
    assert.equal(showReceiveAreas(s, 0, false), false)
  }
  const zones = original.plans.scenarios.find((s) => s.rotation === 5 && s.serve === 'they').tactics.receiveZones
  const zone = (id) => zones.find((z) => z.player === id)
  const caleb = zone('caleb'), georgia = zone('georgia')
  assert.ok(caleb.center.x - caleb.radiusX < georgia.center.x + georgia.radiusX)
  assert.ok(Math.abs(caleb.center.z - georgia.center.z) < caleb.radiusZ + georgia.radiusZ)
  for (const primary of [caleb, georgia]) for (const compact of [zone('logan'), zone('jaz')]) {
    assert.equal(primary.duty, 'primary'); assert.equal(compact.duty, 'compact')
    assert.ok(primary.radiusX > compact.radiusX * 2); assert.ok(primary.radiusZ > compact.radiusZ * 2)
  }
})
