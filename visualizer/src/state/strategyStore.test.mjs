import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStrategyStore, STRATEGY_STORAGE_KEY } from './strategyStore.ts'
import { exportStrategy } from '../lib/strategyDraft.ts'
const memory = () => { const data=new Map(); return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)} }
test('player and waypoint gestures make one undo step, cancel rolls back, redo and resets restore exact values', () => {
  const store=createStrategyStore(memory()), get=store.getState
  get().newStrategy(false); get().setStage('Receive')
  get().beginGesture()
  for(let n=0;n<20;n++) get().move('1/they','caleb',{x:n/10,z:6})
  get().endGesture()
  assert.equal(get().past.length,1)
  assert.equal(get().working.overrides['1/they'].anchors.Receive.caleb.x,1.9)
  get().undo(); assert.equal(get().working.overrides['1/they'],undefined)
  get().beginGesture(); get().move('1/they','caleb',{x:2,z:5}); get().endGesture(true)
  assert.equal(get().future.length,1, 'cancelling a gesture must preserve redo')
  get().redo(); assert.equal(get().working.overrides['1/they'].anchors.Receive.caleb.x,1.9)
  get().bend('1/they','caleb',[{x:1,z:5}]); get().beginGesture()
  get().bend('1/they','caleb',[{x:2,z:5}]); get().endGesture(true)
  assert.equal(get().working.overrides['1/they'].routes.Receive.caleb[0].x,1)
  get().resetStage('1/they'); assert.equal(get().working.overrides['1/they'].anchors.Receive,undefined)
  get().undo(); assert.equal(get().working.overrides['1/they'].anchors.Receive.caleb.x,1.9)
  get().resetRotation('1/they'); assert.equal(get().working.overrides['1/they'],undefined)
})
test('baseline is immutable; independent saved copies autosave/reload and imports stay previews until save-copy', () => {
  const storage=memory(), store=createStrategyStore(storage), get=store.getState
  get().move('1/they','caleb',{x:1,z:6}); assert.equal(get().working,null)
  get().newStrategy(false); get().metadata('First','Caleb'); get().save()
  const id=get().working.id
  get().setStage('Receive'); get().move('1/they','caleb',{x:1,z:6})
  assert.equal(get().saved,true)
  const second=createStrategyStore(storage)
  assert.equal(second.getState().working.overrides['1/they'].anchors.Receive.caleb.x,1)
  get().newStrategy(true); get().metadata('Second','Friend'); get().save()
  assert.notEqual(get().working.id,id)
  get().move('1/they','caleb',{x:2,z:7})
  assert.equal(get().library.find(d=>d.id===id).overrides['1/they'].anchors.Receive.caleb.x,1)
  const json=exportStrategy(get().working), count=get().library.length
  get().previewImport(json)
  assert.equal(get().preview,true); assert.equal(get().library.length,count)
  get().move('1/they','caleb',{x:3,z:7}); assert.equal(get().library.length,count)
  get().save(); assert.equal(get().library.length,count+1); assert.equal(get().preview,false)
  assert.equal(new Set(get().library.map(d=>d.id)).size,count+1)
  get().select(null); assert.equal(get().working,null)
  get().select(id); assert.equal(get().working.name,'First')
  get().remove(id); assert.equal(get().working,null)
})
test('invalid import or edits and storage failures preserve data and report unsaved state', () => {
  const storage=memory(), store=createStrategyStore(storage), get=store.getState
  get().newStrategy(false); get().save(); const before=JSON.stringify(get().working)
  get().previewImport('{"schemaVersion":99}')
  assert.equal(JSON.stringify(get().working),before); assert.ok(get().error)
  get().move('1/they','unknown',{x:0,z:3}); get().move('1/they','harry',{x:Infinity,z:3})
  assert.equal(JSON.stringify(get().working),before)
  storage.setItem=()=>{throw new Error('Quota exceeded')}
  get().setStage('Set'); get().move('1/they','harry',{x:1,z:1})
  assert.equal(get().saved,false); assert.match(get().error,/locally/)
  assert.equal(get().working.overrides['1/they'].anchors.Set.harry.x,1)
  assert.equal(get().library[0].overrides['1/they'],undefined,'failed autosave cannot replace the last saved version')
  const bad=memory(); bad.setItem(STRATEGY_STORAGE_KEY,'not json')
  const recovered=createStrategyStore(bad)
  assert.match(recovered.getState().error,/library/)
  recovered.getState().select(null); recovered.getState().newStrategy(false); recovered.getState().save()
  assert.equal(bad.getItem(STRATEGY_STORAGE_KEY),'not json','unreadable storage must survive every ordinary operation')
})
