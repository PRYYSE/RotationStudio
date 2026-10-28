import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { rotationOrder, positionOf, isFront, sampleTrack, sampleArc, ballAt, phaseAt, readRotationLink, rotationLink } from './rotationModel.ts'
import { curvePoints, pointAt, makeCurve } from './arc.ts'
const team = JSON.parse(readFileSync(new URL('../../tests/fixtures/demo-team.json', import.meta.url)))
const plans = JSON.parse(readFileSync(new URL('../../tests/fixtures/demo-rotations.json', import.meta.url)))
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`)

test('rotationOrder rotates clockwise through all six and returns to the initial identities', () => {
  assert.deepEqual(rotationOrder(team.initialOrder, 1), ['caleb', 'trent', 'logan', 'georgia', 'jaz', 'harry'])
  assert.deepEqual(rotationOrder(team.initialOrder, 6), team.initialOrder)
  assert.deepEqual(rotationOrder(team.initialOrder, -1), ['jaz', 'harry', 'caleb', 'trent', 'logan', 'georgia'])
  let order = team.initialOrder
  for (let i = 0; i < 6; i++) order = rotationOrder(order, 1)
  assert.deepEqual(order, team.initialOrder)
  for (let r = 1; r <= 6; r++) {
    assert.equal(new Set(rotationOrder(team.initialOrder, r - 1)).size, 6)
    assert.equal(positionOf(team, r, 'harry'), [1, 6, 5, 4, 3, 2][r - 1])
    assert.equal(isFront(positionOf(team, r, 'harry')), r >= 4)
  }
})
test('sampleTrack clamps boundaries, eases interiors and reverses without stale roles', () => {
  const track = [{ time: 0, x: 0, z: 6, role: 'start' }, { time: 4, x: 4, z: 2, role: 'set' }, { time: 8, x: -4, z: 4, role: 'recover' }]
  assert.deepEqual(sampleTrack(track, -2), track[0])
  assert.deepEqual(sampleTrack(track, 20), track[2])
  assert.equal(sampleTrack(track, 1).x, 0.625)
  assert.equal(sampleTrack(track, 2).z, 4)
  assert.equal(sampleTrack(track, 4).role, 'set')
  assert.equal(sampleTrack(track, 6).x, 0)
  assert.equal(sampleTrack(track, 2).role, 'start')
  assert.equal(sampleTrack(track, 2).x, 2)
  assert.equal(sampleTrack(track, 3.999).role, 'start')
})
test('sampleTrack uses independent distance-weighted waypoints including stationary segments', () => {
  const track = [{ time: 0, x: 0, z: 0, role: 'help' }, { time: 2, x: 3, z: 4, via: [{ x: 0, z: 0 }, { x: 3, z: 0 }], role: 'set' }]
  near(sampleTrack(track, 1).x, 3); near(sampleTrack(track, 1).z, 0.5)
  const still = [{ time: 0, x: 2, z: 2, role: 'start' }, { time: 1, x: 2, z: 2, role: 'help' }]
  assert.equal(sampleTrack(still, 0.5).x, 2)
  const turn = [{ time: 0, x: 0, z: 0, role: 'start', facing: 3 }, { time: 2, x: 1, z: 1, role: 'help', facing: -3 }]
  near(sampleTrack(turn, 1).facing, Math.PI)
})
test('sampleArc shares the original Set arcs quadratic midpoint and endpoint math', () => {
  const set = { setter: { x: 1, z: 1 }, dest: { x: -3, y: 3, z: 2 }, peak: { x: -1, y: 5, z: 1.5 }, speed: 1 }
  const segment = { from: { ...set.setter, y: 2.2 }, to: set.dest, height: 5 }
  assert.deepEqual(sampleArc(segment, -1), segment.from)
  assert.deepEqual(sampleArc(segment, 2), segment.to)
  near(sampleArc(segment, 0.5).y, 5)
  for (const t of [0, 0.1, 0.5, 0.9, 1]) {
    const original = pointAt(set, t), current = sampleArc(segment, t)
    near(current.x, original.x); near(current.y, original.y); near(current.z, original.z)
  }
  assert.equal(curvePoints(set).length, 65)
  near(makeCurve(set).getPoint(0.5).y, 5)
  near(sampleArc({ ...segment, height: 1 }, 0.5).y, 3)
})
test('ballAt holds at start and after flight, phaseAt seeks at exact event boundaries', () => {
  const s = plans.scenarios[0]
  assert.deepEqual(ballAt(s, 0), s.ball[0].from)
  assert.deepEqual(ballAt(s, 1.9), s.ball[0].from)
  assert.deepEqual(ballAt(s, s.duration), s.ball.at(-1).to)
  assert.equal(phaseAt(s, 3.99).label, 'Serve')
  assert.equal(phaseAt(s, 4).label, 'Pass')
  assert.equal(phaseAt(s, 0).label, 'Start')
  assert.equal(phaseAt(s, 9).label, 'Attack')
  assert.equal(phaseAt(s, 0).label, 'Start')
})
test('all authored scenarios show a held start, first contact, setter run and fixed eligibility', () => {
  for (const s of plans.scenarios) {
    for (const p of team.players) {
      const a = sampleTrack(s.tracks[p.id], 0), b = sampleTrack(s.tracks[p.id], 1)
      assert.deepEqual([a.x, a.z], [b.x, b.z])
      assert.equal(positionOf(team, s.rotation, p.id), rotationOrder(team.initialOrder, s.rotation - 1).indexOf(p.id) + 1)
    }
    const atContact = sampleTrack(s.tracks.harry, s.firstContact.time)
    const atTarget = sampleTrack(s.tracks.harry, s.secondContact.time)
    assert.deepEqual([atTarget.x, atTarget.z], [s.setterTarget.x, s.setterTarget.z])
    assert.notDeepEqual([atContact.x, atContact.z], [atTarget.x, atTarget.z])
    if (s.serve === 'us') {
      const beforeContact = sampleTrack(s.tracks.harry, s.firstContact.time - 0.1)
      assert.equal(beforeContact.role, 'defend')
    }
  }
})
test('rotation links clamp malformed inputs and contain only the published view', () => {
  assert.deepEqual(readRotationLink('?r=6&serve=us&t=4.2'), { rotation: 6, serve: 'us', time: 4.2 })
  for (const query of ['?r=20&t=NaN', '?r=1.5&t=-2', '?r=Infinity&t=Infinity']) assert.deepEqual(readRotationLink(query), { rotation: 1, serve: 'they', time: 0 })
  const url = rotationLink('https://example.org/studio/?s=old&draft=secret#old', 3, 'us', 4.234)
  assert.equal(url, 'https://example.org/studio/?mode=rotations&r=3&serve=us&t=4.23')
})
