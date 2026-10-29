import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createStrategyStore} from './strategyStore.ts'
import {exportStrategy} from '../lib/strategyDraft.ts'
const zone={role:'tip',radiusX:1.2,radiusZ:.6}
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}}

test('coverage fields and radius gestures autosave with one undo, scoped reset, duplicate and import copy',()=>{
  const storage=memory(),store=createStrategyStore(storage),get=store.getState
  get().newStrategy(false);get().save();get().setStage('Receive');const blank=structuredClone(get().working)
  get().setCoverage('1/they','harry',zone);assert.equal(get().past.length,1)
  get().undo();assert.deepEqual(get().working,blank);get().redo()
  get().setScope('1/they/right/harry');get().beginGesture()
  const n=get().past.length;for(let i=1;i<=12;i++)get().setCoverage('1/they','harry',{...zone,radiusX:i/10})
  get().endGesture();assert.equal(get().past.length,n+1)
  assert.deepEqual(createStrategyStore(storage).getState().working,get().working)
  get().resetCoverage('1/they','harry');assert.equal(get().working.caseOverrides?.['1/they/right/harry']?.coverage,undefined)
  assert.deepEqual(get().working.overrides['1/they'].coverage.Receive.harry,zone)
  get().undo();const draft=structuredClone(get().working)
  get().newStrategy(true);assert.deepEqual(get().working.caseOverrides,draft.caseOverrides);assert.notEqual(get().working.id,draft.id)
  get().previewImport(exportStrategy(draft));get().save();assert.notEqual(get().working.id,draft.id)
  get().setScope('1/they/right/harry');get().resetStage('1/they');assert.equal(get().working.caseOverrides['1/they/right/harry'].coverage?.Receive,undefined)
  assert.deepEqual(get().working.overrides,draft.overrides)
})

test('later coverage is separate and resetting removes only selected athlete and correct occurrence',()=>{
  const store=createStrategyStore(memory()),get=store.getState;get().newStrategy(false);get().setStage('Defend')
  get().setCoverage('1/us','harry',zone);store.setState({laterDefend:true})
  get().setCoverage('1/us','harry',{...zone,role:'deep'});get().setCoverage('1/us','georgia',zone)
  get().resetCoverage('1/us','harry');assert.equal(get().working.overrides['1/us'].laterDefend.coverage.harry,undefined)
  assert.deepEqual(get().working.overrides['1/us'].laterDefend.coverage.georgia,zone)
  assert.deepEqual(get().working.overrides['1/us'].coverage.Defend.harry,zone)
  const before=structuredClone(get().working);get().setCoverage('1/they','harry',zone);assert.deepEqual(get().working,before);assert.match(get().error,/serve/i)
})
