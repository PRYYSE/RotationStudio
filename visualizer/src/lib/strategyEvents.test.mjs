import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyStrategy, createStrategy, exportStrategy, parseStrategy, scenarioCaseKey, stageTimes } from './strategyDraft.ts'
import * as events from './strategyEvents.ts'
import { resolveStrategyRotation } from './strategyOverlay.ts'
import { coverageAreas, coverageZoneAt } from './coverage.ts'
import { sampleTrack } from './rotationModel.ts'
import { createReviewModel } from './caseReview.ts'
import { receiveExample } from './receiveExample.ts'

const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const all = b => b.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])
const find = (b = base, key = '1/us/left/normal') => all(b).find(s => scenarioCaseKey(s) === key)
const own = ({ alternates, ...s }) => s
const xy = p => ({ x: p.x, z: p.z })
const named = (s, label) => events.sourceEvents(s).find(e => e.label === label)
const zone = { role: 'tip', radiusX: .7, radiusZ: 1.2, offsetX: -.2 }

test('All events are unique source identities, merging actual boundaries/frames and retaining distinct dig occurrences', () => {
  for (const s of all(base)) {
    const list = events.sourceEvents(s)
    assert.equal(new Set(list.map(e => e.id)).size, list.length)
    assert.equal(new Set(list.map(e => e.time)).size, list.length)
    assert.ok(list.every((e, i) => !i || list[i - 1].time < e.time))
    for (const p of s.phases) assert.equal(list.filter(e => e.time === p.time && e.label === p.label).length, 1)
    for (const b of s.ball) for (const time of [b.start, b.end]) assert.ok(list.some(e => e.time === time))
    for (const track of Object.values(s.tracks)) for (const f of track) assert.ok(list.some(e => e.time === f.time))
  }
  const s = find(), first = named(s, 'Our dig'), next = named(s, 'Next dig')
  assert.equal(first.id, 'p3:our-dig'); assert.equal(first.time, 5.4)
  assert.equal(next.id, 'p8:next-dig'); assert.equal(next.time, 12.29)
  assert.equal(first.occurrence, 1); assert.equal(next.occurrence, 2)
  assert.deepEqual(next.actors, ['caleb']); assert.equal(next.caseKey, '1/us/left/normal')
  assert.equal(named(s, 'Next set ready').time, 14.71)
})

test('R1 first and next dig anchors/routes edit only their source frames and relink owned contacts', () => {
  const before = structuredClone(base), s = find(), draft = createStrategy()
  draft.caseOverrides = { '1/us/left/normal': { eventOverrides: {
    'p3:our-dig': { anchors: { caleb: { x: .2, z: 6.2 } } },
    'p8:next-dig': { anchors: { caleb: { x: -1, z: 5.8 } }, routes: { caleb: [{ x: -.4, z: 6.4 }] } }
  } } }
  const result = applyStrategy(base, draft), edited = find(result.bundle)
  assert.deepEqual(xy(sampleTrack(edited.tracks.caleb, 5.4)), { x: .2, z: 6.2 })
  assert.deepEqual(xy(sampleTrack(edited.tracks.caleb, 12.29)), { x: -1, z: 5.8 })
  for (const [id, track] of Object.entries(s.tracks)) for (const f of track) {
    const actual = edited.tracks[id].find(k => k.time === f.time)
    if (id === 'caleb' && [5.4, 12.29].includes(f.time)) {
      const { x, z, via, ...metadata } = f, { x: a, z: b, via: c, ...retained } = actual
      assert.deepEqual(retained, metadata)
    } else assert.deepEqual(actual, f, `${id} @ ${f.time} retained`)
  }
  edited.ball.forEach((b, i) => {
    const original = s.ball[i]
    assert.deepEqual({ ...b, from: undefined, to: undefined }, { ...original, from: undefined, to: undefined })
    for (const side of ['from', 'to']) {
      const time = side === 'from' ? b.start : b.end
      assert.equal(b[side].y, original[side].y)
      assert.deepEqual(xy(b[side]), time === 5.4 ? { x: .2, z: 6.2 } : time === 12.29 ? { x: -1, z: 5.8 } : xy(original[side]))
    }
  })
  assert.deepEqual(edited.phases, s.phases); assert.deepEqual(edited.firstContact, s.firstContact); assert.deepEqual(edited.secondContact, s.secondContact)
  for (const other of all(base).filter(v => v !== s)) assert.deepEqual(own(find(result.bundle, scenarioCaseKey(other))), own(other))
  assert.deepEqual(base, before)
  assert.deepEqual(applyStrategy(base, draft), result, 'same source and patches deterministic')
  assert.deepEqual(applyStrategy(result.bundle, draft).bundle, result.bundle, 'reapplication idempotent')
})

test('sparse event coverage is occurrence-specific and exact case wins over shared event and stage fields', () => {
  const s = find(), draft = createStrategy()
  draft.overrides['1/us'] = { coverage: { Receive: { caleb: { ...zone, role: 'receive', radiusX: 2 } } },
    anchors: { Receive: { caleb: { x: 1, z: 7 } } }, eventOverrides: {
      'p3:our-dig': { coverage: { caleb: zone } },
      'p8:next-dig': { anchors: { caleb: { x: -1, z: 6 } }, routes: { caleb: [{ x: 0, z: 6 }] }, coverage: { caleb: { ...zone, role: 'deep', radiusX: 2.5 } } }
    } }
  draft.caseOverrides = { '1/us/right/harry': { anchors: { Receive: { caleb: { x: 2, z: 7 } } }, eventOverrides: {
    'p8:next-dig': { anchors: { caleb: { x: 3, z: 6 } }, routes: { caleb: [] }, coverage: { caleb: { ...zone, radiusX: 1.5 } } }
  } } }
  const result = applyStrategy(base, draft).bundle
  for (const v of all(result).filter(v => v.rotation === 1 && v.serve === 'us')) {
    const exact = scenarioCaseKey(v) === '1/us/right/harry', changes = resolveStrategyRotation(draft, v)
    assert.deepEqual(xy(sampleTrack(v.tracks.caleb, 12.29)), { x: exact ? 3 : -1, z: 6 })
    assert.deepEqual(changes.eventOverrides['p8:next-dig'].routes.caleb, exact ? [] : [{ x: 0, z: 6 }])
    assert.equal(coverageZoneAt(changes, v, 5.4, 'caleb').radiusX, .7)
    assert.equal(coverageZoneAt(changes, v, 12.29, 'caleb').radiusX, exact ? 1.5 : 2.5)
    assert.notDeepEqual(coverageAreas(base.team, v, 5.4, true, changes).find(a => a.player === 'caleb'), coverageAreas(base.team, v, 12.29, true, changes).find(a => a.player === 'caleb'))
    assert.equal(coverageZoneAt(changes, v, 7.77, 'caleb'), undefined, 'event assignment does not leak into next event')
  }
  delete draft.overrides['1/us'].eventOverrides['p8:next-dig'].coverage
  assert.equal(coverageZoneAt(resolveStrategyRotation(draft, s), s, 12.29, 'caleb').radiusX, 2, 'fallback Receive stage coverage')
  assert.deepEqual(parseStrategy(exportStrategy(draft)), draft)
})

test('zero event overrides keep all 48 and populated old V1/V2 output exact; later Defend stays independent', () => {
  for (const version of [1, 2]) {
    const draft = { ...createStrategy(), schemaVersion: version }
    assert.deepEqual(applyStrategy(base, draft).bundle, base)
    if (version === 2) for (const s of base.plans.scenarios) draft.overrides[`${s.rotation}/${s.serve}`] = { eventOverrides: {} }
    assert.deepEqual(applyStrategy(base, draft).bundle, base)
    const parsed = parseStrategy(exportStrategy(draft))
    assert.deepEqual(parsed, { ...draft, schemaVersion: 2 })
  }
  const draft = createStrategy()
  draft.overrides['1/us'] = { laterDefend: { anchors: { caleb: { x: -.2, z: 6 } } } }
  const previous = find(applyStrategy(base, draft).bundle)
  draft.overrides['1/us'].eventOverrides = { 'p8:next-dig': { anchors: { caleb: { x: 1, z: 6.4 } } } }
  const result = find(applyStrategy(base, draft).bundle)
  for (const track of Object.keys(previous.tracks)) for (const f of previous.tracks[track].filter(f => f.time < 12.29)) assert.deepEqual(result.tracks[track].find(k => k.time === f.time), f)
  assert.deepEqual(result.tracks.harry, previous.tracks.harry)
  assert.equal(stageTimes(result).Receive, 5.4)
})

test('invalid event IDs, unsupported fields, impossible positions and pathological maps are rejected in both scopes', () => {
  for (const exact of [false, true]) {
    const draft = createStrategy(), map = exact ? draft.caseOverrides = {} : draft.overrides, key = exact ? '1/us/left/normal' : '1/us'
    map[key] = { eventOverrides: { 'p8:next-dig': { anchors: { caleb: { x: 0, z: 6 } }, coverage: { caleb: zone } } } }
    for (const mutate of [
      d => d.eventOverrides = { bogus: {} }, d => d.eventOverrides = { 'p99:next-dig': {} },
      d => d.eventOverrides['p8:next-dig'].time = 11,
      d => d.eventOverrides['p8:next-dig'].anchors.caleb.x = Infinity,
      d => d.eventOverrides['p8:next-dig'].anchors.caleb.z = 10,
      d => d.eventOverrides['p8:next-dig'].coverage.caleb.radiusX = 0,
      d => d.eventOverrides['p8:next-dig'].routes = { caleb: Array(9).fill({ x: 0, z: 3 }) },
      d => d.eventOverrides = { 'p8:next-dig': { role: 'pass' } },
    ]) { const bad = structuredClone(draft); mutate((exact ? bad.caseOverrides : bad.overrides)[key]); assert.throws(() => applyStrategy(base, bad)) }
    const missing = structuredClone(draft); (exact ? missing.caseOverrides : missing.overrides)[key].eventOverrides = { 'p7:invented-dig': {} }
    assert.throws(() => applyStrategy(base, missing), /event/i)
    assert.throws(() => parseStrategy(JSON.stringify({ ...draft, name: 'x'.repeat(100001) })))
  }
})

test('event comparison samples the selected occurrence and its adjacent source route interval', () => {
  const draft = createStrategy()
  draft.overrides['1/us'] = { eventOverrides: { 'p8:next-dig': { anchors: { caleb: { x: -1, z: 6 } } } } }
  const review = createReviewModel(base, draft).project({ rotation: 1, serve: 'us', attackSide: 'left', firstTouch: 'normal', stage: 'Receive', playerId: 'caleb' }, { eventId: 'p8:next-dig' })
  assert.equal(review.eventTime, 12.29); assert.equal(review.eventLabel, 'Next dig')
  assert.deepEqual(review.comparison.current.point, { x: -1, z: 6 })
  assert.deepEqual(review.comparison.baseline.point, { x: .77, z: 6.75 })
  assert.equal(review.comparison.current.incoming.from.time, 11.17)
  assert.equal(review.comparison.current.incoming.to.time, 12.29)
  assert.equal(review.nextEvent.time, 14.71)
  assert.equal(review.comparison.caseChanges.filter(c => c.pointChanged).length, 4)
})

test('service events preserve both-owner contact holds; existing intermediate frames and future geometry remain bounded', () => {
  for (const serve of ['us', 'they']) {
    const s = find(base, `1/${serve}/left/normal`), draft = createStrategy()
    const id = named(s, 'Serve hit').id
    draft.overrides[`1/${serve}`] = { eventOverrides: { [id]: { anchors: { caleb: { x: .5, z: 6.4 } } } } }
    const result = find(applyStrategy(base, draft).bundle, `1/${serve}/left/normal`)
    for (const time of [0, .5, s.ball[0].start]) assert.deepEqual(xy(sampleTrack(result.tracks.caleb, time)), { x: .5, z: 6.4 })
    for (const f of s.tracks.caleb.filter(f => f.time > s.ball[0].start)) assert.deepEqual(result.tracks.caleb.find(k => k.time === f.time), f)
  }
  const s = find(), draft = createStrategy()
  const intermediate = events.sourceEvents(s).find(e => e.time === 11.17)
  draft.overrides['1/us'] = { eventOverrides: { [intermediate.id]: { anchors: { georgia: { x: 2.8, z: 3.5 } }, routes: { georgia: [{ x: 3, z: 3.4 }] } } } }
  const result = find(applyStrategy(base, draft).bundle)
  for (const time of [0, 5.4, 8.63, 9.5, 12.29, 13, 14.71]) assert.deepEqual(sampleTrack(result.tracks.georgia, time), sampleTrack(s.tracks.georgia, time))
  assert.deepEqual(result.ball, s.ball)
})

test('both event layers enforce UTF-8 cap, bounded keys, canonical source references and numeric coverage/route guards', () => {
  for (const exact of [false, true]) {
    const draft = createStrategy(), map = exact ? draft.caseOverrides = {} : draft.overrides
    for (const s of exact ? all(base) : base.plans.scenarios) {
      map[exact ? scenarioCaseKey(s) : `${s.rotation}/${s.serve}`] = { eventOverrides: Object.fromEntries(events.sourceEvents(s).map(e => [e.id, {
        routes: Object.fromEntries(Object.keys(s.tracks).map(id => [id, Array.from({ length: 8 }, () => ({ x: 1.23456789, z: 5.12345678 }))])),
        coverage: Object.fromEntries(Object.keys(s.tracks).map(id => [id, { ...zone, offsetX: 1.23456789 }]))
      }])) }
    }
    assert.ok(Buffer.byteLength(JSON.stringify(draft)) > 100000)
    assert.throws(() => exportStrategy(draft), /100 KB/); assert.throws(() => parseStrategy(JSON.stringify(draft)), /100 KB/)
    const small = createStrategy(), value = { eventOverrides: { 'p8:next-dig': { coverage: { caleb: { ...zone, offsetZ: NaN } } } } }
    if (exact) small.caseOverrides = { '1/us/left/normal': value }; else small.overrides['1/us'] = value
    assert.throws(() => applyStrategy(base, small))
    value.eventOverrides = Object.fromEntries(Array.from({ length: 129 }, (_, i) => [`p8:next-dig:t${100 + i}`, {}]))
    assert.throws(() => exportStrategy(small), /128/)
  }
  const s = find(), malformed = structuredClone(s)
  malformed.phases[8].time = malformed.phases[7].time
  assert.throws(() => events.sourceEvents(malformed), /duplicate|ambiguous/i)
  const draft = createStrategy()
  draft.overrides['1/us'] = { eventOverrides: { 'p8:next-dig:t1229': {} } }
  assert.throws(() => applyStrategy(base, draft), /event/i, 'alternate ID for same time is not an authored identity')
})

test('existing ball-boundary edits preserve original frames/roles and remain idempotent without adding flights', () => {
  const s = find(), event = events.sourceEvents(s).find(e => e.time === 10.25), draft = createStrategy()
  draft.overrides['1/us'] = { eventOverrides: { [event.id]: { anchors: { georgia: { x: 2.7, z: 3.3 } }, routes: { georgia: [{ x: 2.8, z: 3 }] } } } }
  const result = applyStrategy(base, draft).bundle, edited = find(result)
  assert.deepEqual(xy(sampleTrack(edited.tracks.georgia, event.time)), { x: 2.7, z: 3.3 })
  for (const f of s.tracks.georgia) assert.deepEqual(edited.tracks.georgia.find(k => k.time === f.time), f)
  assert.deepEqual(edited.ball, s.ball)
  assert.deepEqual(applyStrategy(result, draft).bundle, result)
  const identities = v => events.sourceEvents(v).map(e => [e.id, e.label, e.time, e.actors])
  assert.deepEqual(identities(edited), identities(s), 'runtime insertion does not add source identities')
})

test('event maps reject accessors and symbol keys before executing untrusted values', () => {
  let calls = 0
  const draft = createStrategy()
  draft.overrides['1/us'] = { eventOverrides: Object.defineProperty({}, 'p8:next-dig', { enumerable: true, get() { calls++; return {} } }) }
  assert.throws(() => exportStrategy(draft)); assert.equal(calls, 0)
  draft.overrides['1/us'].eventOverrides = { [Symbol('hidden')]: {} }
  assert.throws(() => exportStrategy(draft))
})

test('authored event coverage does not crash or apply to read-only teaching samples', () => {
  const draft = createStrategy()
  draft.overrides['1/us'] = { eventOverrides: { 'p8:next-dig': { coverage: { caleb: zone } } } }
  const bundle = applyStrategy(base, draft).bundle, s = find(bundle)
  const sample = receiveExample(bundle.team, s, { x: 0, z: 5.8, receiver: 'auto' })
  assert.equal(sample.ok, true)
  const changes = resolveStrategyRotation(draft, sample.scenario)
  const areas = coverageAreas(bundle.team, sample.scenario, sample.scenario.firstContact.time, true, changes)
  assert.equal(areas.length, 6)
  assert.equal(areas.find(a => a.player === 'caleb').assigned, undefined)
  assert.equal(coverageZoneAt(changes, sample.scenario, 12.29, 'caleb'), undefined)
})

test('event block coverage and impossible movement are visible findings without mislabelling every event as later Defend', () => {
  const draft = createStrategy()
  draft.overrides['1/us'] = { eventOverrides: { 'p8:next-dig': {
    anchors: { caleb: { x: -4.5, z: 0 } }, coverage: { harry: { ...zone, role: 'block' } }
  } } }
  const review = createReviewModel(base, draft).project({ rotation: 1, serve: 'us', attackSide: 'left', firstTouch: 'normal', stage: 'Receive', playerId: 'caleb' }, { eventId: 'p8:next-dig' })
  const coverage = review.reviewFindings.find(f => /assigned block coverage at p8:next-dig/.test(f.summary))
  assert.equal(coverage.category, 'COVERAGE'); assert.equal(coverage.playerId, 'harry')
  assert.notEqual(coverage.affectedStage, 'Defend')
  const movement = review.reviewFindings.find(f => /caleb at Next dig.*exceeds/.test(f.summary))
  assert.equal(movement.category, 'GEOMETRY_TIME'); assert.notEqual(movement.affectedStage, 'Defend')
})
