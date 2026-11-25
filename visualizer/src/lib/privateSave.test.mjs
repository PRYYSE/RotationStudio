import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createFixture } from '../../server/fixture-support.mjs'
import { fixture, sampleProposal } from '../domain/fixture.ts'

test('private Worker denies absent, wrong-owner and tampered Access JWT; retries and concurrent saves preserve state', async () => {
  const f = await createFixture()
  assert.equal((await f.request('/api/v1/library', { token: '' })).status, 401)
  assert.equal((await f.request('/api/v1/session', { token: await f.token({ email: 'other@example.test' }) })).status, 401)
  assert.equal((await f.request('/api/v1/session', { token: f.ownerToken + 'x' })).status, 401)
  const plan = fixture()
  const save = { requestId: 'save-first', expectedRevision: 0, document: plan }
  const send = data => f.request('/api/v1/library', { method: 'PUT', body: data })
  assert.equal((await send(save)).status, 201)
  assert.equal((await send(save)).status, 200)
  const altered = structuredClone(plan)
  altered.teams[0].name = 'Remapped without a revision'
  assert.equal((await send({ ...save, document: altered })).status, 409)
  assert.equal((await send({ ...save, expectedRevision: 1, requestId: 'overwrite', document: altered })).status, 422)
  assert.equal((await send({ ...save, requestId: 'other-device' })).status, 409)
  const patch = sampleProposal(plan)
  const transaction = (action, extra = {}) => f.request('/api/v1/transaction', {
    method: 'POST', body: { action, expectedRevision: 1, proposal: patch, ...extra },
  })
  assert.equal((await transaction('preview')).status, 200)
  assert.equal((await (await f.request('/api/v1/library')).json()).revision, 1)
  const results = await Promise.all([transaction('apply'), transaction('apply')])
  assert.deepEqual(results.map(r => r.status).sort(), [200, 201])
  assert.equal((await (await f.request('/api/v1/library')).json()).revision, 2)
  assert.equal((await transaction('apply', { proposal: { ...patch, operationId: 'stale-proposal' } })).status, 409)
})

test('the library endpoint rejects changing an approved case and rejects a forged transaction result', async () => {
  const f = await createFixture(), l = fixture(), p = sampleProposal(l)
  l.plans[0].cases[0].status = 'approved'
  const send = (document, expectedRevision, requestId) => f.request('/api/v1/library', {
    method: 'PUT', body: { document, expectedRevision, requestId },
  })
  assert.equal((await send(l, 0, 'initial')).status, 201)
  const edited = structuredClone(l)
  const revised = { ...structuredClone(edited.plans[0]), revision: 2 }
  revised.cases[0].moments[0].athletes[0].position.x = 1
  edited.plans.push(revised)
  assert.equal((await send(edited, 1, 'approved-edited')).status, 422)

  const different = await createFixture()
  const unapproved = fixture()
  await different.request('/api/v1/library', { method: 'PUT', body: { document: unapproved, expectedRevision: 0, requestId: 'initial' } })
  const { applyProposal } = await import('../domain/authoring.ts')
  const valid = await applyProposal(unapproved, p)
  valid.plans.at(-1).cases[0].moments[0].athletes[0].position.x = 1
  assert.equal((await different.request('/api/v1/library', {
    method: 'PUT', body: { document: valid, expectedRevision: 1, requestId: 'mismatching' },
  })).status, 422)
})
