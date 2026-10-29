import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createStrategyStore, STRATEGY_STORAGE_KEY } from './strategyStore.ts'
import { exportStrategy, scenarioCaseKey, strategyLink, readStrategyLink, applyStrategy } from '../lib/strategyDraft.ts'
import { sampleTrack } from '../lib/rotationModel.ts'

const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const source = base.plans.scenarios.find(s => s.rotation === 1 && s.serve === 'us')
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } }
const zone = { role: 'tip', radiusX: .7, radiusZ: 1.2, offsetZ: -.2 }

test('event navigation creates no mutation; first/next dig gestures and coverage reset are single undo steps', () => {
  const storage = memory(), store = createStrategyStore(storage), get = store.getState
  get().newStrategy(false); get().save()
  const initial = exportStrategy(get().working), raw = storage.getItem(STRATEGY_STORAGE_KEY)
  get().setEvent(source, 'p3:our-dig'); get().setEvent(source, 'p8:next-dig')
  assert.equal(exportStrategy(get().working), initial); assert.equal(get().past.length, 0)
  assert.equal(storage.getItem(STRATEGY_STORAGE_KEY), raw)
  get().setEvent(source, 'p3:our-dig'); get().setCoverage('1/us', 'caleb', zone)
  get().setEvent(source, 'p8:next-dig'); get().setScope(scenarioCaseKey(source))
  get().beginGesture()
  for (let i = 0; i < 15; i++) {
    get().move('1/us', 'caleb', { x: -i / 10, z: 6 })
    get().setCoverage('1/us', 'caleb', { ...zone, radiusX: 1 + i / 10 })
  }
  get().endGesture()
  assert.equal(get().past.length, 2)
  const current = exportStrategy(get().working)
  get().setEvent(source, 'p3:our-dig'); assert.equal(exportStrategy(get().working), current)
  get().setEvent(source, 'p8:next-dig'); get().resetEvent('1/us')
  assert.equal(get().working.caseOverrides['1/us/left/normal'].eventOverrides, undefined)
  assert.deepEqual(get().working.overrides['1/us'].eventOverrides['p3:our-dig'].coverage.caleb, zone)
  assert.equal(get().past.length, 3)
  get().undo(); assert.equal(exportStrategy(get().working), current)
  get().undo(); assert.equal(get().working.caseOverrides, undefined)
  get().redo(); assert.equal(exportStrategy(get().working), current)
  get().beginGesture(); get().move('1/us', 'caleb', { x: 2, z: 5 }); get().endGesture(true)
  assert.equal(exportStrategy(get().working), current); assert.equal(get().past.length, 2)
  assert.deepEqual(createStrategyStore(storage).getState().working, get().working)
})

test('source-validated edits/imports reject bad IDs, deleted input, invalid geometry and wrong case without data loss', () => {
  const storage = memory(), store = createStrategyStore(storage), get = store.getState
  get().newStrategy(false); get().setEvent(source, 'p8:next-dig'); get().move('1/us', 'caleb', { x: 1, z: 6 }); get().save()
  const before = exportStrategy(get().working), raw = storage.getItem(STRATEGY_STORAGE_KEY), history = get().past.length
  for (const action of [
    () => get().setEvent(source, 'p7:invented-event'),
    () => get().move('1/us', 'caleb', { x: NaN, z: 6 }),
    () => get().move('1/us', 'caleb', { x: 0, z: 10 }),
    () => get().move('1/they', 'caleb', { x: 0, z: 6 }),
    () => get().move('1/us', 'target', { x: 0, z: 1 }),
    () => get().previewImport('', base),
    () => get().previewImport(before.replace('p8:next-dig', 'p7:invented-event'), base),
    () => get().previewImport(before.replace('p8:next-dig', 'p3:next-dig'), base),
  ]) {
    action(); assert.ok(get().error)
    assert.equal(exportStrategy(get().working), before); assert.equal(storage.getItem(STRATEGY_STORAGE_KEY), raw)
    assert.equal(get().past.length, history)
  }
  get().setStage('Receive'); assert.equal(get().event, null)
  get().setEvent(source, 'p8:next-dig'); get().setLaterDefend(source); assert.ok(get().event, 'invalid later selection preserves current event')
  get().setStage('Defend'); get().setLaterDefend(source); assert.equal(get().event, null)
})

test('event edits and footprints survive save, copy, URL and import; same-event repeated move has stable diff', () => {
  const store = createStrategyStore(memory()), get = store.getState
  get().newStrategy(false); get().setEvent(source, 'p8:next-dig')
  get().move('1/us', 'caleb', { x: -1, z: 6 }); get().bend('1/us', 'caleb', [{ x: 0, z: 6.5 }]); get().setCoverage('1/us', 'caleb', zone)
  const edited = structuredClone(get().working), history = get().past.length
  get().move('1/us', 'caleb', { x: -1, z: 6 }); assert.equal(get().past.length, history)
  get().save(); get().newStrategy(true)
  assert.notEqual(get().working.id, edited.id); assert.deepEqual(get().working.overrides, edited.overrides)
  const link = strategyLink('https://example.test/', edited)
  assert.deepEqual(readStrategyLink(new URL(link).hash), edited)
  get().previewImport(exportStrategy(edited), base); assert.equal(get().preview, true)
  get().save(); assert.notEqual(get().working.id, edited.id)
  assert.deepEqual(get().working.overrides, edited.overrides)
  const s = applyStrategy(base, get().working).bundle.plans.scenarios.find(s => s.rotation === 1 && s.serve === 'us')
  assert.equal(sampleTrack(s.tracks.caleb, 5.4).x, .77); assert.equal(sampleTrack(s.tracks.caleb, 12.29).x, -1)
})

test('shared event edits validate all four source contexts before autosave, including when selected on an alternate', () => {
  for (const selected of [source, source.alternates.right]) {
    const storage = memory(), store = createStrategyStore(storage), get = store.getState
    get().newStrategy(false); get().save(); get().setEvent(selected, 'p4:second-contact', base)
    const before = exportStrategy(get().working), raw = storage.getItem(STRATEGY_STORAGE_KEY)
    get().move('1/us', 'georgia', { x: 1, z: 6 })
    assert.match(get().error, /setter|target|Z < 3/)
    assert.equal(exportStrategy(get().working), before); assert.equal(storage.getItem(STRATEGY_STORAGE_KEY), raw)
    assert.equal(get().past.length, 0)
    get().setScope(scenarioCaseKey(selected)); get().move('1/us', 'georgia', { x: 1, z: 6 })
    assert.equal(get().error, '')
    assert.doesNotThrow(() => applyStrategy(base, get().working))
    get().previewImport(exportStrategy(get().working), base); assert.equal(get().preview, true)
  }
})
