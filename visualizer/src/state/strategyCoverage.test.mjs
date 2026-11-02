import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createStrategyStore} from './strategyStore.ts'
import {exportStrategy} from '../lib/strategyDraft.ts'
import {readFileSync} from 'node:fs'
import {applyStrategy, scenarioCaseKey, stageTimes} from '../lib/strategyDraft.ts'
import {resolveStrategyRotation} from '../lib/strategyOverlay.ts'
import {sourceEvents} from '../lib/strategyEvents.ts'
import {coverageAreas, coverageZoneAt} from '../lib/coverage.ts'
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

test('first and next dig/set coverage remain independent through exact-case edits, undo, reset and reload',()=>{
  const read=name=>JSON.parse(readFileSync(new URL(`../../public/plans/${name}.json`,import.meta.url)))
  const base={team:read('team'),plans:read('rotations')}, original=JSON.stringify(base)
  const all=base.plans.scenarios.flatMap(s=>[s,...Object.values(s.alternates)])
  for(const source of all){
    const storage=memory(), get=createStrategyStore(storage).getState
    const key=`${source.rotation}/${source.serve}`, scope=scenarioCaseKey(source), id=source.firstContact.player
    const first={role:'receive',radiusX:1.9,radiusZ:1.4}, next={role:'deep',radiusX:1.1,radiusZ:.8}
    get().newStrategy(false);get().setScope(scope)
    for(const stage of ['Receive','Set']){get().setStage(stage);get().setCoverage(key,id,first)}
    const events=sourceEvents(source), dig=events.find(e=>e.label==='Next dig'), set=events.find(e=>e.label==='Next set ready')
    const at=time=>coverageZoneAt(resolveStrategyRotation(get().working,source),source,time,id)
    for(const event of [dig,set]){
      assert.equal(at(event.time),undefined,`${scope}: first-stage assignment leaked into ${event.label}`)
      get().setEvent(source,event.id,base);get().setCoverage(key,id,next)
      assert.deepEqual(at(event.time+.05),next)
      get().undo();assert.equal(at(event.time),undefined)
      get().redo();assert.deepEqual(at(event.time),next)
    }
    get().resetCoverage(key,id);assert.equal(at(set.time),undefined)
    assert.deepEqual(at(dig.time),next);get().undo()
    for(const stage of ['Receive','Set'])assert.deepEqual(at(stageTimes(source)[stage]),first)
    get().save()
    const saved=structuredClone(get().working), reloaded=createStrategyStore(storage).getState().working
    assert.deepEqual(reloaded,saved);assert.deepEqual(saved.overrides,{})
    const result=applyStrategy(base,reloaded).bundle
    const edited=result.plans.scenarios.flatMap(s=>[s,...Object.values(s.alternates)]).find(s=>scenarioCaseKey(s)===scope)
    const changes=resolveStrategyRotation(reloaded,source)
    for(const event of [dig,set]){
      const area=coverageAreas(base.team,edited,event.time+.05,true,changes).find(a=>a.player===id)
      assert.equal(area.responsibility,'deep');assert.equal(area.radiusX,1.1);assert.equal(area.assigned,true)
    }
    for(const s of result.plans.scenarios.flatMap(s=>[s,...Object.values(s.alternates)])){
      const baseline=all.find(v=>scenarioCaseKey(v)===scenarioCaseKey(s))
      assert.deepEqual(s,baseline,'Coverage must not rewrite tracks, roles, ball, contacts or any source case')
      if(scenarioCaseKey(s)!==scope)assert.equal(resolveStrategyRotation(reloaded,s).eventOverrides,undefined)
    }
  }
  assert.equal(JSON.stringify(base),original)
})
