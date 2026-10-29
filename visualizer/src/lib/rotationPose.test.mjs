import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPoseCues, playerPose, motionBudget } from './rotationPose.ts'
import { sampleTrack, isFront, positionOf } from './rotationModel.ts'
import { authoredHitter } from './reviewFindings.ts'
import { stageTimes } from './strategyDraft.ts'

const team = JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url)))
const plans = JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url)))
const cases = plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])
const pose = (s, id, time, reduced = false) => playerPose(s.tracks[id], createPoseCues(s, team, id), time, reduced)
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`)
const freeze = o => { Object.freeze(o); Object.values(o).forEach(v => { if (v && typeof v === 'object') freeze(v) }); return o }
freeze(team); freeze(plans)

test('R1/R3/R5 both serve owners and all variants cue named contacts only near their true times', () => {
  for (const s of cases.filter(s => [1, 3, 5].includes(s.rotation))) {
    const { player: first, time: firstTime } = s.firstContact
    const { player: second, time: secondTime } = s.secondContact
    assert.equal(pose(s, first, firstTime).cue, 'receive')
    assert.equal(pose(s, second, secondTime).cue, 'set')
    assert.notEqual(pose(s, first, firstTime - .6).cue, 'receive')
    assert.notEqual(pose(s, first, firstTime + .6).cue, 'receive')
    assert.notEqual(pose(s, second, firstTime + .2).cue, 'set')
    assert.notEqual(pose(s, second, secondTime + .6).cue, 'set')
    for (const id of Object.keys(s.tracks)) {
      if (id !== first) assert.notEqual(pose(s, id, firstTime).cue, 'receive')
      if (id !== second) assert.notEqual(pose(s, id, secondTime).cue, 'set')
    }
    if (s.tactics.firstTouch === 'harry') {
      assert.equal(first, 'harry'); assert.notEqual(second, 'harry')
      assert.equal(pose(s, second, secondTime).cue, 'set')
      assert.notEqual(pose(s, 'harry', secondTime).cue, 'set')
    }
  }
})

test('only the actual ball-linked hitter approaches and jumps; other attack-role athletes stay ready', () => {
  for (const s of cases) {
    const time = stageTimes(s).Attack, hitter = authoredHitter(s)
    assert.ok(hitter)
    assert.equal(pose(s, hitter, time - .4).cue, 'approach')
    assert.equal(pose(s, hitter, time).cue, 'attack')
    assert.ok(pose(s, hitter, time).lift > 0 && pose(s, hitter, time).lift <= .18)
    assert.equal(pose(s, hitter, time + .5).lift, 0)
    for (const id of Object.keys(s.tracks).filter(id => id !== hitter)) {
      assert.notEqual(pose(s, id, time).cue, 'attack')
      assert.notEqual(pose(s, id, time - .4).cue, 'approach')
      assert.equal(pose(s, id, time).lift, 0)
    }
  }
})

test('later digs and backup sets follow each authored pass endpoint, including a terminal pass without a set flight', () => {
  for (const s of cases) for (const b of s.ball.filter(b => b.kind === 'pass')) {
    for (const [time, point, role, cue] of [[b.start, b.from, 'pass', 'receive'], [b.end, b.to, 'set', 'set']]) {
      const owners = Object.keys(s.tracks).filter(id => {
        const p = sampleTrack(s.tracks[id], time + 1e-7)
        return p.role === role && Math.hypot(p.x - point.x, p.z - point.z) < .01
      })
      assert.equal(owners.length, 1)
      assert.equal(pose(s, owners[0], time).cue, cue)
    }
  }
})

test('front-only block entry has a bounded rise and settles; illegal back-row block remains a safe help pose', () => {
  for (const s of cases) for (const [id, track] of Object.entries(s.tracks)) {
    for (const [i, k] of track.entries()) if (k.role === 'block' && track[i - 1]?.role !== 'block') {
      assert.ok(isFront(positionOf(team, s.rotation, id)))
      assert.equal(pose(s, id, k.time).cue, 'block')
      assert.ok(pose(s, id, k.time).lift > 0 && pose(s, id, k.time).lift <= .12)
      assert.equal(pose(s, id, k.time + .5).lift, 0)
    }
  }
  const s = structuredClone(cases.find(s => s.rotation === 1 && s.serve === 'they'))
  s.tracks.harry = [{ time: 0, x: 0, z: 1, role: 'block' }, { time: s.duration, x: 0, z: 1, role: 'block' }]
  const p = pose(s, 'harry', 0)
  assert.equal(p.cue, 'ready'); assert.equal(p.lift, 0)
  assert.ok(Math.abs(p.leftArm) < 1 && Math.abs(p.rightArm) < 1)
})

test('server stays planted through TTGVA service hit and recovers only along the source track', () => {
  for (const s of cases.filter(s => s.serve === 'us')) {
    const time = s.ball[0].start
    const id = team.initialOrder[(s.rotation - 1) % 6]
    for (const t of [0, time - .1, time]) {
      const p = pose(s, id, t), source = sampleTrack(s.tracks[id], t)
      near(p.x, source.x); near(p.z, source.z)
      near(p.x, s.ball[0].from.x); near(p.z, s.ball[0].from.z)
      assert.equal(p.lift, 0); assert.equal(p.leftLeg, 0); assert.equal(p.rightLeg, 0)
    }
    assert.equal(pose(s, id, time).cue, 'serve')
    const recovery = pose(s, id, time + .4)
    assert.notEqual(recovery.cue, 'serve'); assert.equal(recovery.lift, 0)
    assert.ok(Math.hypot(recovery.x - s.ball[0].from.x, recovery.z - s.ball[0].from.z) > .01)
  }
})

test('walking follows actual velocity, eases to rest, and seeks in either direction without retained state', () => {
  const track = [{ time: 0, x: 0, z: 4, role: 'help' }, { time: 2, x: 2, z: 4, role: 'help' }, { time: 3, x: 2, z: 4, role: 'help' }]
  const cues = { contacts: [], blocks: [], front: false, serviceTime: 0 }
  const middle = playerPose(track, cues, 1)
  near(middle.facing, -Math.PI / 2)
  assert.notEqual(middle.leftLeg, 0); near(middle.leftLeg, -middle.rightLeg)
  assert.ok(Math.abs(playerPose(track, cues, 1.999).leftLeg) < Math.abs(middle.leftLeg))
  assert.equal(playerPose(track, cues, 2.5).leftLeg, 0)
  const held = [{ time: 0, x: 0, z: 0, role: 'help', facing: .7 }]
  near(playerPose(held, cues, 0).facing, .7)
  for (const s of cases.filter(s => [1, 3, 5].includes(s.rotation))) for (const id of Object.keys(s.tracks)) {
    const c = createPoseCues(s, team, id)
    const times = [...new Set([0, s.ball[0].start, ...Object.values(stageTimes(s)), s.duration])]
    const forward = times.map(t => playerPose(s.tracks[id], c, t))
    assert.deepEqual([...times].reverse().map(t => playerPose(s.tracks[id], c, t)).reverse(), forward)
    for (const [i, p] of forward.entries()) {
      const source = sampleTrack(s.tracks[id], times[i])
      near(p.x, source.x); near(p.z, source.z)
      for (const value of Object.values(p).filter(v => typeof v === 'number')) assert.ok(Number.isFinite(value))
    }
  }
})

test('reduced motion and phone mode remove secondary movement while retaining position and contact cues', () => {
  assert.deepEqual(motionBudget(false, false), { secondary: true, dpr: [1, 1.7], shadows: true })
  for (const flags of [[false, true], [true, false], [true, true]]) {
    assert.deepEqual(motionBudget(...flags), { secondary: false, dpr: [1, 1], shadows: false })
  }
  for (const s of cases) for (const id of Object.keys(s.tracks)) {
    const cues = createPoseCues(s, team, id)
    for (const t of [0, s.firstContact.time, s.secondContact.time, stageTimes(s).Attack, s.duration / 2]) {
      const full = playerPose(s.tracks[id], cues, t), low = playerPose(s.tracks[id], cues, t, true)
      assert.equal(low.cue, full.cue); assert.equal(low.x, full.x); assert.equal(low.z, full.z)
      assert.equal(low.lift, 0); assert.equal(low.leftLeg, 0); assert.equal(low.rightLeg, 0)
      assert.equal(low.lean, 0); assert.equal(low.crouch, 0)
    }
  }
})

test('contact poses settle continuously at source event boundaries and preserve intermediate travel', () => {
  for (const s of cases.filter(s => [1, 3, 5].includes(s.rotation))) for (const id of Object.keys(s.tracks)) {
    const cues = createPoseCues(s, team, id)
    for (const event of cues.contacts) {
      for (const offset of [-.65, -.28, -.2, 0, .22]) {
        const t = event.time + offset
        const before = playerPose(s.tracks[id], cues, t - .0001)
        const after = playerPose(s.tracks[id], cues, t + .0001)
        for (const key of ['leftArm', 'rightArm', 'armSpread', 'leftLeg', 'rightLeg', 'lift', 'lean', 'crouch']) {
          assert.ok(Math.abs(before[key] - after[key]) < .01, `${s.rotation}/${s.serve}/${id} ${event.kind} ${offset} ${key}`)
        }
        near(after.x, sampleTrack(s.tracks[id], t + .0001).x)
        near(after.z, sampleTrack(s.tracks[id], t + .0001).z)
      }
    }
  }
})

test('ambiguous or broken contact links never manufacture a contact actor; pose reads leave all source cases unchanged', () => {
  const s = structuredClone(cases[0]), before = JSON.stringify(plans)
  s.ball.find(b => b.kind === 'pass').from.x += 1
  assert.notEqual(pose(s, s.firstContact.player, s.firstContact.time).cue, 'receive')
  const second = s.secondContact.player
  s.tracks[s.firstContact.player] = structuredClone(s.tracks[second])
  assert.notEqual(pose(s, second, s.secondContact.time).cue, 'set')
  for (const original of cases) for (const id of Object.keys(original.tracks)) {
    const cues = createPoseCues(original, team, id)
    for (let t = 0; t <= original.duration; t += .1) playerPose(original.tracks[id], cues, t)
  }
  assert.equal(JSON.stringify(plans), before)
})
