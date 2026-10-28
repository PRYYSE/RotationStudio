import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateBundle } from './rotationValidation.ts'

test('current public tactical JSON validates independently of test fixtures', () => {
  const team = JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url)))
  const plans = JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url)))
  assert.deepEqual(validateBundle({ team, plans }), [])
  assert.equal(plans.scenarios.length, 12)
  assert.equal(team.players.length, 6)
  assert.equal(team.players.filter((p) => p.setter).length, 1)
  assert.equal(team.status, plans.status)
})
