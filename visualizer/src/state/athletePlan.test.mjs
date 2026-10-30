import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createStrategyStore, STRATEGY_STORAGE_KEY } from './strategyStore.ts'
import { applyStrategy, exportStrategy, parseStrategy, scenarioCaseKey, strategyLink, readStrategyLink, validateStrategy } from '../lib/strategyDraft.ts'
import { sourceEvents } from '../lib/strategyEvents.ts'
import { actionAt, actionWarning, routeBends } from '../lib/athletePlan.ts'
import { resolveStrategyRotation } from '../lib/strategyOverlay.ts'
import { createPoseCues, playerPose } from '../lib/rotationPose.ts'
import { sampleTrack } from '../lib/rotationModel.ts'
import { splitTrack } from '../lib/trackSplit.ts'

const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const source = base.plans.scenarios.find(s => s.rotation === 1 && s.serve === 'us')
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } }

test('case athlete actions, bends, coverage and positions survive save, reload, import and share', () => {
  const storage = memory(), store = createStrategyStore(storage), s = store.getState
  const original = JSON.stringify(base), other = structuredClone(base.plans.scenarios.find(v => v.rotation === 3 && v.serve === 'they'))
  s().newStrategy(false); s().setScope(scenarioCaseKey(source))
  s().setEvent(source, 'p3:our-dig', base)
  s().move('1/us', 'harry', { x: 1, z: 6 }, true); s().setAction('1/us', 'harry', 'cover')
  s().bendAt('1/us', 'georgia', 'p3:our-dig', [{ x: 1.5, z: 4.5 }])
  s().setCoverage('1/us', 'jaz', { role: 'tip', radiusX: .9, radiusZ: 1.2 })
  s().setEvent(source, 'p8:next-dig', base); s().setAction('1/us', 'harry', 'receive')
  assert.equal(s().error, '')
  s().save(); const saved = structuredClone(s().working), json = exportStrategy(saved)
  assert.deepEqual(createStrategyStore(storage).getState().working, saved)
  assert.deepEqual(parseStrategy(json), saved)
  assert.deepEqual(readStrategyLink(new URL(strategyLink('https://example.test', saved)).hash), saved)
  s().previewImport(json, base); assert.equal(s().preview, true); assert.deepEqual(s().working, saved)
  s().save(); assert.notEqual(s().working.id, saved.id); assert.deepEqual(s().working.caseOverrides, saved.caseOverrides)
  const result = applyStrategy(base, saved).bundle
  const edited = result.plans.scenarios.find(v => v.rotation === 1 && v.serve === 'us')
  const changes = resolveStrategyRotation(saved, source)
  assert.equal(actionAt(changes, source, 5.4, 'harry'), 'cover')
  assert.equal(actionAt(changes, source, 12.29, 'harry'), 'receive')
  assert.equal(sampleTrack(edited.tracks.harry, 5.4).x, 1)
  assert.deepEqual(routeBends(edited, source, 'p3:our-dig', 'georgia'), [{ x: 1.5, z: 4.5 }])
  assert.equal(changes.eventOverrides['p3:our-dig'].coverage.jaz.role, 'tip')
  assert.deepEqual(result.plans.scenarios.find(v => v.rotation === 3 && v.serve === 'they'), other)
  assert.equal(JSON.stringify(base), original)
  assert.deepEqual(saved.overrides, {})
})

test('action changes only the teaching pose; validates extension and back-row safety', () => {
  const store = createStrategyStore(memory()), s = store.getState
  s().newStrategy(false); s().setScope(scenarioCaseKey(source)); s().setEvent(source, 'p3:our-dig', base)
  s().setAction('1/us', 'harry', 'block')
  const result = applyStrategy(base, s().working).bundle.plans.scenarios.find(v => v.rotation === 1 && v.serve === 'us')
  assert.deepEqual(result.ball, source.ball); assert.deepEqual(result.firstContact, source.firstContact); assert.deepEqual(result.secondContact, source.secondContact)
  assert.match(actionWarning(source, base.team, 'p3:our-dig', 'harry', 'block').join(' '), /Back-row.*illegal/)
  const cues = createPoseCues(result, base.team, 'harry')
  const block = playerPose(result.tracks.harry, cues, 5.4, false, 'block')
  const cover = playerPose(result.tracks.harry, cues, 5.4, false, 'cover')
  const receive = playerPose(result.tracks.harry, cues, 5.4, false, 'receive')
  assert.equal(block.lift, 0); assert.ok(block.leftArm < 1); assert.notEqual(cover.armSpread, receive.armSpread)
  const bad = structuredClone(s().working)
  bad.caseOverrides['1/us/left/normal'].eventOverrides['p3:our-dig'].actions.harry = 'fly'
  assert.throws(() => validateStrategy(bad), /Unknown athlete action/)
  delete bad.coachingVersion
  assert.throws(() => validateStrategy(bad), /Unknown strategy field/)
  s().setAction('1/us', 'harry', null); assert.equal(actionAt(resolveStrategyRotation(s().working, source), source, 5.4, 'harry'), undefined)
})

test('old V2 profile remains byte-identical during selection and navigation', () => {
  const storage = memory(), s = createStrategyStore(storage).getState
  s().newStrategy(false); s().save()
  const id = s().working.id, raw = JSON.stringify(JSON.parse(storage.getItem(STRATEGY_STORAGE_KEY)), null, 2)
  storage.setItem(STRATEGY_STORAGE_KEY, raw)
  s().select(null); s().select(id); s().setEvent(source, sourceEvents(source)[3].id, base); s().setScope(scenarioCaseKey(source))
  s().beginGesture(); s().endGesture()
  s().beginGesture(); s().move('1/us', 'harry', { x: 0, z: 5 }); s().endGesture(true)
  assert.equal(storage.getItem(STRATEGY_STORAGE_KEY), raw)
})

test('splitting a source route retains its bends on both sides of the new boundary', () => {
  const track = [{ time: 0, x: 0, z: 0, role: 'defend' }, { time: 4, x: 4, z: 4, role: 'defend', via: [{ x: 1, z: 0 }, { x: 1, z: 4 }] }]
  const midpoint = sampleTrack(track, 2), frame = splitTrack(track, 2)
  assert.equal(frame.x, midpoint.x); assert.equal(frame.z, midpoint.z)
  assert.deepEqual(frame.via, [{ x: 1, z: 0 }]); assert.deepEqual(track[2].via, [{ x: 1, z: 4 }])
  assert.equal(track[0].x, 0); assert.equal(track[2].x, 4)
})

test('case original action can override a shared action without changing the shared plan', () => {
  const store = createStrategyStore(memory()), s = store.getState
  s().newStrategy(false); s().setEvent(source, 'p3:our-dig', base)
  s().setAction('1/us', 'harry', 'cover')
  assert.equal(s().error, '')
  s().setScope(scenarioCaseKey(source)); s().setAction('1/us', 'harry', null)
  assert.equal(actionAt(resolveStrategyRotation(s().working, source), source, 5.4, 'harry'), undefined)
  assert.equal(s().working.overrides['1/us'].eventOverrides['p3:our-dig'].actions.harry, 'cover')
})

test('adding an action does not reinterpret legacy event routes', () => {
  const store = createStrategyStore(memory()), s = store.getState
  s().newStrategy(false); s().setScope(scenarioCaseKey(source)); s().setEvent(source, 'p3:our-dig', base)
  s().bend('1/us', 'georgia', [{ x: 1.1, z: 5 }])
  const old = applyStrategy(base, s().working).bundle
  s().setAction('1/us', 'harry', 'cover')
  const withAction = applyStrategy(base, s().working).bundle
  assert.deepEqual(withAction.plans, old.plans)
})
