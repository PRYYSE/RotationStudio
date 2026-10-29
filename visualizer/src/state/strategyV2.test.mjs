import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStrategyStore, STRATEGY_STORAGE_KEY } from './strategyStore.ts'
import { createStrategy } from '../lib/strategyDraft.ts'
import { readFileSync } from 'node:fs'
const V1 = 'rotation-studio-strategies-v1'
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) } }
const legacy = () => ({ ...createStrategy('Legacy', 'Coach'), schemaVersion: 1, overrides: { '3/they': { anchors: { Receive: { caleb: { x: .4, z: 6 } } } } } })

test('V1 library first read is non-destructive; only accepted edit/save writes V2; reload prefers V2', () => {
  assert.equal(STRATEGY_STORAGE_KEY, 'rotation-studio-strategies-v2')
  const storage = memory(), d = legacy(), raw = JSON.stringify({ schemaVersion: 1, library: [d], activeId: d.id })
  storage.setItem(V1, raw)
  const store = createStrategyStore(storage), get = store.getState
  assert.equal(get().working.schemaVersion, 2); assert.deepEqual(get().working.overrides, d.overrides)
  assert.equal(storage.getItem(STRATEGY_STORAGE_KEY), null)
  get().select(null); get().select(d.id)
  assert.equal(storage.getItem(STRATEGY_STORAGE_KEY), null, 'selection is not a migration save')
  get().setStage('Receive'); get().move('3/they', 'caleb', { x: 1, z: 6 })
  assert.equal(JSON.parse(storage.getItem(STRATEGY_STORAGE_KEY)).schemaVersion, 2)
  assert.equal(storage.getItem(V1), raw)
  assert.equal(createStrategyStore(storage).getState().working.overrides['3/they'].anchors.Receive.caleb.x, 1)
})

test('unreadable V2 offers recoverable V1 in memory and blocks every write', () => {
  const storage = memory(), d = legacy(), raw = JSON.stringify({ schemaVersion: 1, library: [d], activeId: d.id })
  storage.setItem(V1, raw); storage.setItem(STRATEGY_STORAGE_KEY, 'broken')
  const store = createStrategyStore(storage), get = store.getState
  assert.equal(get().working.name, 'Legacy'); assert.match(get().error, /recover|export/i)
  get().setStage('Receive'); get().move('3/they', 'caleb', { x: 1, z: 6 }); get().save(); get().remove(d.id)
  assert.equal(storage.getItem(V1), raw); assert.equal(storage.getItem(STRATEGY_STORAGE_KEY), 'broken')
  assert.equal(get().saved, false)
})

test('case scope is opt-in without writes; per-case gestures, stage resets and case reset are undoable', () => {
  const store = createStrategyStore(memory()), get = store.getState
  get().newStrategy(false); get().setStage('Receive'); get().move('3/they', 'jaz', {x:2,z:5})
  const before = structuredClone(get().working), history = get().past.length
  get().setScope('3/they/right/harry')
  assert.deepEqual(get().working, before); assert.equal(get().past.length, history)
  get().resetStage('3/they')
  assert.deepEqual(get().working, before, 'reset of an inherited-only case stage is a no-op')
  get().beginGesture()
  for (let i=0; i<20; i++) get().move('3/they', 'caleb', { x:i/10,z:6 })
  get().endGesture(); assert.equal(get().past.length, history+1)
  assert.equal(get().working.caseOverrides['3/they/right/harry'].anchors.Receive.caleb.x, 1.9)
  get().bend('3/they', 'caleb', []); get().setStage('Set'); get().move('3/they','logan',{x:-3,z:3.4})
  get().setStage('Receive'); get().resetStage('3/they')
  assert.equal(get().working.caseOverrides['3/they/right/harry'].anchors.Receive, undefined)
  assert.ok(get().working.caseOverrides['3/they/right/harry'].anchors.Set)
  assert.deepEqual(get().working.overrides, before.overrides)
  get().undo(); assert.equal(get().working.caseOverrides['3/they/right/harry'].anchors.Receive.caleb.x,1.9)
  get().resetCase('3/they/right/harry'); assert.equal(get().working.caseOverrides['3/they/right/harry'],undefined)
  get().undo(); get().redo(); assert.equal(get().working.caseOverrides['3/they/right/harry'],undefined)
})

test('invalid case imports leave library, working draft and history intact; copies retain all V2 fields', () => {
  const store = createStrategyStore(memory()), get = store.getState
  get().newStrategy(false); get().setScope('3/us/right/harry'); get().move('3/us', 'harry', {x:1,z:4}); get().save()
  const original = structuredClone(get().working)
  get().newStrategy(true)
  assert.deepEqual(get().working.caseOverrides, original.caseOverrides); assert.notEqual(get().working.id, original.id)
  const before = get()
  for (const key of ['3/us/normal/right','03/us/right/harry']) {
    get().previewImport(JSON.stringify({ ...original, caseOverrides: { [key]: {} } }))
    assert.equal(get().working, before.working); assert.equal(get().library, before.library); assert.equal(get().past, before.past)
  }
  get().previewImport(JSON.stringify(original)); get().save()
  assert.notEqual(get().working.id, original.id); assert.equal(get().library.length, 2)
})

test('later occurrence selector is gated by authored event; edits/reset/undo preserve first Defend', () => {
  const plans = JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url)))
  const own = plans.scenarios.find(s=>s.rotation===3 && s.serve==='us'), they = plans.scenarios.find(s=>s.rotation===3 && s.serve==='they')
  const store=createStrategyStore(memory()), get=store.getState
  get().newStrategy(false); get().setStage('Defend'); get().move('3/us','harry',{x:0,z:4})
  const before=structuredClone(get().working), history=get().past.length
  get().setLaterDefend(they); assert.equal(get().laterDefend,false)
  get().setLaterDefend({...own,phases:own.phases.filter(p=>p.label!=='Defend again')}); assert.equal(get().laterDefend,false)
  get().setLaterDefend(own); assert.equal(get().laterDefend,true)
  assert.deepEqual(get().working,before); assert.equal(get().past.length,history)
  get().beginGesture(); get().move('3/us','harry',{x:1,z:4}); get().move('3/us','harry',{x:1.2,z:4}); get().endGesture()
  assert.equal(get().past.length,history+1)
  get().bend('3/us','harry',[])
  get().resetStage('3/us'); assert.equal(get().working.overrides['3/us'].laterDefend,undefined)
  assert.deepEqual(get().working.overrides['3/us'].anchors,before.overrides['3/us'].anchors)
  get().undo(); assert.deepEqual(get().working.overrides['3/us'].laterDefend.routes.harry,[])
  get().setStage('Receive'); assert.equal(get().laterDefend,false)
})

test('V2 copies retain notes and imports never autosave; 50-strategy, quota and invalid-library guards retain data', () => {
  const storage=memory(), store=createStrategyStore(storage), get=store.getState
  const draft=createStrategy(); draft.notes={team:{'3/us':{Defend:'Read the ball'}}}
  get().previewImport(JSON.stringify(draft)); get().metadata('Preview','Coach')
  assert.equal(storage.getItem(STRATEGY_STORAGE_KEY),null)
  get().save(); const saved=storage.getItem(STRATEGY_STORAGE_KEY)
  get().newStrategy(true); assert.deepEqual(get().working.notes,draft.notes)
  get().save()
  storage.setItem=()=>{throw Error('Quota')}
  get().metadata('Unsaved','Coach'); assert.equal(get().saved,false)
  assert.equal(get().library.at(-1).name,'Preview copy')
  const full=memory(), library=Array.from({length:50},()=>createStrategy())
  full.setItem(STRATEGY_STORAGE_KEY,JSON.stringify({schemaVersion:2,library,activeId:null}))
  const capped=createStrategyStore(full), raw=full.getItem(STRATEGY_STORAGE_KEY)
  capped.getState().newStrategy(false); capped.getState().save()
  assert.equal(capped.getState().library.length,50); assert.equal(full.getItem(STRATEGY_STORAGE_KEY),raw)
  const duplicate=memory(); duplicate.setItem(STRATEGY_STORAGE_KEY,JSON.stringify({schemaVersion:2,library:[draft,draft],activeId:draft.id}))
  assert.match(createStrategyStore(duplicate).getState().error,/library/)
  assert.ok(saved)
})
