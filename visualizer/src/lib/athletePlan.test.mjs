import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { movementReview } from './athletePlan.ts'
import { sourceEvents } from './strategyEvents.ts'

const scenario = (endX, endTime) => ({ tracks: { caleb: [
  { time: 0, x: 0, z: 4, role: 'defend' },
  { time: endTime, x: endX, z: 4, role: 'defend' }
] } })

test('movement review is a bounded screen, not a claimed measurement of player speed', () => {
  assert.equal(movementReview(scenario(0, 2), 'caleb', 0, 2).review, 'stationary')
  const normal = movementReview(scenario(1, 2), 'caleb', 0, 2)
  assert.equal(normal.review, 'normal')
  assert.ok(normal.metres > .99 && normal.metres < 1.01)
  const demanding = movementReview(scenario(4, .4), 'caleb', 0, .4)
  assert.equal(demanding.review, 'check')
  assert.ok(demanding.requiredPace > 4)
  assert.match(demanding.label, /may be too fast/)
  assert.equal(movementReview(scenario(2, 1), 'caleb', 1, 1).review, 'unavailable')
})

test('movement feedback stays finite across 48 immutable real authored cases', () => {
  const plans = JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url)))
  const all = plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])
  const original = JSON.stringify(all)
  assert.equal(all.length, 48)
  for(const s of all){
    const events = sourceEvents(s)
    for(let i=1;i<events.length;i++){
      for(const id of Object.keys(s.tracks)){
        const v=movementReview(s,id,events[i-1].time,events[i].time)
        assert.ok(['normal','stationary','check'].includes(v.review))
        assert.ok(Number.isFinite(v.metres) && v.metres>=0)
        assert.ok(Number.isFinite(v.requiredPace))
      }
    }
  }
  assert.equal(JSON.stringify(all),original)
})
