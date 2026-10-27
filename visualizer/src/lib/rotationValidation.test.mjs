import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateBundle, parseBundle, exportBundle, loadBundle } from './rotationValidation.ts'
import { rotationOrder } from './rotationModel.ts'
const original = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const fixture = () => structuredClone(original)
const rejects = (mutate, pattern) => { const b = fixture(); mutate(b); assert.match(validateBundle(b).join('\n'), pattern) }

test('published JSON validates all 12 unique rotation and serve combinations', () => {
  assert.deepEqual(validateBundle(original), [])
  assert.deepEqual(original.team.players.map((p) => p.name), ['Harry', 'Caleb', 'Trent', 'Logan', 'Georgia', 'Jaz'])
  assert.equal(original.team.players.find((p) => p.setter).id, 'harry')
  assert.equal(new Set(original.plans.scenarios.map((s) => `${s.rotation}/${s.serve}`)).size, 12)
})
for (const serve of ['they', 'us']) test(`service contact catches x order and z pair violations when ${serve} serve`, () => {
  const index = serve === 'they' ? 0 : 1
  rejects((b) => { const s = b.plans.scenarios[index]; s.tracks.logan[1].x = s.tracks.trent[1].x }, /Logan \(P4\) must be left of Trent \(P3\)/)
  rejects((b) => { const s = b.plans.scenarios[index]; s.tracks.georgia[1].z = s.tracks.logan[1].z }, /Georgia \(P5\) must be behind Logan \(P4\)/)
  // Both adjacent pairs in each row and all three corresponding front/back pairs.
  for (const [left, right] of [[4, 3], [3, 2], [5, 6], [6, 1]]) rejects((b) => {
    const s = b.plans.scenarios[index], order = rotationOrder(b.team.initialOrder, 0)
    s.tracks[order[left - 1]][1].x = s.tracks[order[right - 1]][1].x
  }, /must be left of/)
  for (const [back, front] of [[5, 4], [6, 3], [1, 2]]) rejects((b) => {
    const s = b.plans.scenarios[index], order = b.team.initialOrder
    s.tracks[order[back - 1]][1].z = s.tracks[order[front - 1]][1].z
  }, /must be behind/)
})
test('service contact accepts front players deeper than 3m and enforces endlines and held spots', () => {
  const b = fixture()
  const s = b.plans.scenarios[0]
  for (const id of ['caleb', 'trent', 'logan']) for (const k of s.tracks[id].filter((k) => k.time <= 2)) k.z = 4
  assert.deepEqual(validateBundle(b), [])
  rejects((b) => b.plans.scenarios[1].tracks.harry[1].z = 9, /beyond the 9m endline/)
  rejects((b) => b.plans.scenarios[0].tracks.harry[1].z = 9, /inside the court/)
  rejects((b) => b.plans.scenarios[0].tracks.harry[1].x = 2, /hold service-contact spots/)
  rejects((b) => b.plans.scenarios[1].ball[0].from.x = 1, /originate from the P1 server/)
})
test('back-row Harry may set inside 3m but cannot block or complete front-zone above-net attack', () => {
  const b = fixture(), s = b.plans.scenarios[0]
  assert.equal(s.tracks.harry.find((k) => k.time === s.secondContact.time).z, 1.2)
  assert.deepEqual(validateBundle(b), [])
  rejects((b) => b.plans.scenarios[0].tracks.harry[4].role = 'block', /harry is back-row and cannot block/)
  rejects((b) => Object.assign(b.plans.scenarios[0].tracks.harry[4], { role: 'attack', aboveNet: true, takeoffZ: 2.99 }), /above-net back-row attack/)
  for (const [aboveNet, takeoffZ] of [[true, 3], [false, 1]]) {
    const b = fixture(); Object.assign(b.plans.scenarios[0].tracks.harry[4], { role: 'attack', aboveNet, takeoffZ })
    assert.deepEqual(validateBundle(b), [])
  }
  rejects((b) => Object.assign(b.plans.scenarios[0].tracks.harry[4], { role: 'attack' }), /attack requires aboveNet and takeoffZ/)
})
test('front-row eligibility survives retreat to defensive middle-back', () => {
  const b = fixture(), s = b.plans.scenarios.find((s) => s.rotation === 3 && s.serve === 'they')
  const frame = s.tracks.jaz.find((k) => k.role === 'block')
  Object.assign(frame, { x: 0, z: 7 })
  assert.deepEqual(validateBundle(b), [])
})
test('contacts require an authored fallback setter, matching pass target, timing and continuous flight', () => {
  rejects((b) => b.plans.scenarios[0].firstContact.player = 'harry', /different athletes; author a fallback setter/)
  rejects((b) => b.plans.scenarios[0].secondContact.time = 3, /second contact must follow/)
  rejects((b) => b.plans.scenarios[0].ball[1].to.x = 2, /pass must connect/)
  rejects((b) => b.plans.scenarios[0].ball[1].start = 3, /invalid ball segment/)
  rejects((b) => b.plans.scenarios[0].ball[1].from.x = 0, /pass must connect/)
  rejects((b) => b.plans.scenarios[0].ball[2].from.z = 2, /share endpoints/)
  rejects((b) => b.plans.scenarios[0].ball[0].from.z = 10, /correct endline/)
  rejects((b) => b.plans.scenarios[0].tracks.harry.find((k) => k.time === 8).x = 3, /must reach setterTarget/)
})
test('load and export roundtrip preserves a JSON-only authored change without application edits', async () => {
  const b = fixture(); b.plans.scenarios[0].tracks.jaz.at(-1).x = 1.4
  const calls = []
  const loaded = await loadBundle('/studio/', async (url, options) => {
    calls.push([url, options.cache]); return { ok: true, json: async () => url.endsWith('team.json') ? b.team : b.plans }
  })
  assert.deepEqual(calls, [['/studio/plans/team.json', 'no-cache'], ['/studio/plans/rotations.json', 'no-cache']])
  assert.equal(loaded.plans.scenarios[0].tracks.jaz.at(-1).x, 1.4)
  assert.deepEqual(parseBundle(exportBundle(loaded)), b)
})
test('loading failures and invalid imports produce readable errors', async () => {
  await assert.rejects(loadBundle('/', async () => ({ ok: false, status: 404 })), /Cannot load team.json \(404\)/)
  await assert.rejects(loadBundle('/', async () => ({ ok: true, json: async () => null })), /Expected an object/)
  assert.throws(() => parseBundle('{'), SyntaxError)
  assert.throws(() => parseBundle('{"team":{},"plans":{}}'), /exactly six athletes/)
})
test('unknown JSON is rejected safely for versions, identities, fields, enums and numeric bounds', () => {
  for (const v of [null, [], 1, 'text', {}, { team: null, plans: {} }]) assert.match(validateBundle(v).join(), /Expected an object/)
  const cases = [
    [(b) => b.team.schemaVersion = 2, /Unsupported schemaVersion/],
    [(b) => b.plans.status = 'APPROVED', /matching status/],
    [(b) => b.team.players[0] = null, /stable id/],
    [(b) => b.team.players[0].id = 'caleb', /unique/],
    [(b) => b.team.initialOrder[0] = 'unknown', /initialOrder/],
    [(b) => b.plans.netHeight = 0, /netHeight/],
    [(b) => b.plans.scenarios.pop(), /all 12/],
    [(b) => b.plans.scenarios[1] = b.plans.scenarios[0], /duplicate/],
    [(b) => b.plans.scenarios[0].duration = Infinity, /duration/],
    [(b) => b.plans.scenarios[0].setterTarget.z = 3, /setterTarget/],
    [(b) => b.plans.scenarios[0].phases[0].time = 1, /first phase/],
    [(b) => b.plans.scenarios[0].phases[1].time = 0, /increasing times/],
    [(b) => b.plans.scenarios[0].phases[0] = null, /phases need/],
    [(b) => delete b.plans.scenarios[0].tracks.jaz, /six athlete IDs/],
    [(b) => b.plans.scenarios[0].tracks.harry[1].time = 0, /non-increasing/],
    [(b) => b.plans.scenarios[0].tracks.harry[0].x = NaN, /invalid coordinate/],
    [(b) => b.plans.scenarios[0].tracks.harry[0].x = 5, /invalid coordinate/],
    [(b) => b.plans.scenarios[0].tracks.harry[0].role = 'blocker', /role/],
    [(b) => b.plans.scenarios[0].tracks.harry[0].via = [null], /waypoint/],
    [(b) => b.plans.scenarios[0].tracks.harry[0] = null, /invalid coordinate/],
    [(b) => b.plans.scenarios[0].firstContact.player = 'nobody', /named athlete/],
    [(b) => b.plans.scenarios[0].ball[0].height = 0, /apex/],
  ]
  for (const [mutate, pattern] of cases) rejects(mutate, pattern)
})

test('Harry first touch is allowed with an explicitly authored Caleb fallback setter', () => {
  const b = fixture(), s = b.plans.scenarios[0]
  s.firstContact.player = 'harry'; s.secondContact.player = 'caleb'
  const harry = s.tracks.harry.find((k) => k.time === s.firstContact.time)
  const from = { x: harry.x, y: 1, z: harry.z }
  s.ball[0].to = { ...from }; s.ball[1].from = { ...from }
  Object.assign(s.tracks.caleb.find((k) => k.time === s.secondContact.time), { ...s.setterTarget, role: 'set' })
  assert.deepEqual(validateBundle(b), [])
  assert.equal(parseBundle(exportBundle(b)).plans.scenarios[0].secondContact.player, 'caleb')
})
test('export rejects invalid drafts instead of producing a misleading valid-looking download', () => {
  const b = fixture(); b.plans.scenarios[0].tracks.harry[4].role = 'block'
  assert.throws(() => exportBundle(b), /harry is back-row and cannot block/)
})

test('malformed nested JSON never executes object coercions or crashes the validator', () => {
  const bad = { toString: null, valueOf: null }
  for (const mutate of [
    (b) => b.plans.scenarios[0].rotation = bad,
    (b) => b.plans.scenarios[0].serve = bad,
    (b) => b.plans.scenarios[0].phases[0].section = bad,
    (b) => b.plans.scenarios[0].tracks.harry[0].role = bad,
    (b) => b.plans.scenarios[0].firstContact.player = bad,
    (b) => b.plans.scenarios[0].ball[0].kind = bad,
  ]) {
    const b = fixture(); mutate(b)
    const errors = validateBundle(b)
    assert.ok(errors.length > 0)
    assert.equal(typeof errors[0], 'string')
  }
})

test('service ordering samples actual contact and rejects interpolated pre-service movement', () => {
  const b = fixture(), s = b.plans.scenarios[0]
  // No moved keyframe before contact: interpolation toward a later frame already moves Logan.
  s.tracks.logan = s.tracks.logan.filter((k) => k.time !== s.ball[0].start)
  s.tracks.logan[1].x = 4
  assert.match(validateBundle(b).join('\n'), /hold service-contact spots/)
  assert.match(validateBundle(b).join('\n'), /Logan \(P4\) must be left/)
})
test('pre-service waypoint excursions are rejected even when contact returns to start', () => {
  rejects((b) => { const s = b.plans.scenarios[0]; s.tracks.logan[1].via = [{ x: 0, z: 3 }] }, /hold service-contact spots/)
})
test('JSON-only draft and approved publication still requires structural validation', async () => {
  for (const status of ['DRAFT', 'APPROVED']) {
    const b = fixture(); b.team.status = status; b.plans.status = status
    assert.deepEqual(parseBundle(exportBundle(b)), b)
    const loaded = await loadBundle('/', async (url) => ({ ok: true, json: async () => url.endsWith('team.json') ? b.team : b.plans }))
    assert.equal(loaded.plans.status, status)
    b.plans.scenarios[0].ball[1].from.x = 0
    assert.throws(() => exportBundle(b), /pass must connect/)
  }
})
