import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createStrategy, parseStrategy, exportStrategy, applyStrategy, stageTimes, laterDefendTime } from './strategyDraft.ts'
import { resolveStrategyRotation } from './strategyOverlay.ts'
import { coverageAreas, assignedCoverage } from './coverage.ts'
import { collectReviewFindings } from './reviewFindings.ts'

const base = Object.fromEntries(['team','rotations'].map(n => [n === 'team' ? n : 'plans', JSON.parse(readFileSync(new URL(`../../public/plans/${n}.json`, import.meta.url)))]))
const zone = {role:'tip',radiusX:1.2,radiusZ:.6,offsetX:.2,offsetZ:-.3}
const all = b => b.plans.scenarios.flatMap(s => [s,...Object.values(s.alternates ?? {})])
const find = (serve='they',side='left',touch='normal') => all(base).find(s => s.rotation === 1 && s.serve === serve && s.tactics.opponentAttack === side && s.tactics.firstTouch === touch)

test('optional V2 coverage roundtrips strictly; legacy documents acquire no coverage fields', () => {
  const d=createStrategy(); d.overrides['1/they']={coverage:{Receive:{harry:zone}}}
  assert.deepEqual(parseStrategy(exportStrategy(d)),d)
  for (const version of [1,2]) {
    const old={...createStrategy(),schemaVersion:version,overrides:{'1/they':{anchors:{Receive:{caleb:{x:0,z:6}}}}}}
    assert.deepEqual(parseStrategy(JSON.stringify(old)),{...old,schemaVersion:2})
    assert.equal(exportStrategy(old).includes('coverage'),false)
  }
  for (const bad of [{...zone,role:'Block'},{...zone,radiusX:.09},{...zone,radiusZ:4.51},{...zone,offsetX:-4.51},{...zone,offsetZ:Infinity},{...zone,radiusX:NaN},{...zone,extra:true},{...zone,radiusX:'1'}]) {
    assert.throws(()=>exportStrategy({...d,overrides:{'1/they':{coverage:{Receive:{harry:bad}}}}}))
  }
  for (const bad of [{...d,schemaVersion:1},{...d,overrides:{'1/they':{laterDefend:{coverage:{harry:zone}}}}},{...d,overrides:{'1/us':{coverage:{Bad:{harry:zone}}}}},{...d,caseOverrides:{'1/us/left/normal':{coverage:{Defend:{unknown:zone}}}}}]) assert.throws(()=>exportStrategy(bad))
  for(const role of ['receive','tip','block','deep','attack-cover','setter-support','custom']) assert.doesNotThrow(()=>exportStrategy({...d,overrides:{'1/us':{laterDefend:{coverage:{harry:{role,radiusX:.1,radiusZ:4.5,offsetX:-4.5,offsetZ:4.5}}}}}}))
})

test('coverage merges per athlete and exact case, follows stage/occurrence positions and clamps full ellipse',()=>{
  const d=createStrategy(); d.overrides['1/they']={coverage:{Receive:{harry:zone,georgia:{...zone,role:'receive'}}}}
  d.caseOverrides={'1/they/right/harry':{coverage:{Receive:{harry:{...zone,role:'custom',radiusX:4.5,offsetX:4.5}}}}}
  for(const s of all(base)) {
    const c=resolveStrategyRotation(d,s)
    const areas=coverageAreas(base.team,s,stageTimes(s).Receive,true,c)
    if(s.rotation!==1||s.serve!=='they') {assert.deepEqual(areas,coverageAreas(base.team,s,stageTimes(s).Receive,true));continue}
    const exact=s.tactics.opponentAttack==='right'&&s.tactics.firstTouch==='harry'
    assert.equal(c.coverage.Receive.harry.role,exact?'custom':'tip')
    assert.equal(c.coverage.Receive.georgia.role,'receive')
    for(const id of ['harry','georgia']) {const a=areas.find(a=>a.player===id);assert.equal(a.assigned,true);assert.ok(a.center.x-a.radiusX>=-4.5&&a.center.x+a.radiusX<=4.5);assert.ok(a.center.z-a.radiusZ>=0&&a.center.z+a.radiusZ<=9)}
    assert.deepEqual(coverageAreas(base.team,s,stageTimes(s).Set,true,c),coverageAreas(base.team,s,stageTimes(s).Set,true))
  }
  const s=find('us');d.overrides['1/us']={coverage:{Defend:{harry:zone}},laterDefend:{coverage:{harry:{...zone,role:'deep'}}}}
  const changes=resolveStrategyRotation(d,s)
  assert.equal(coverageAreas(base.team,s,stageTimes(s).Defend,true,changes).find(a=>a.player==='harry').responsibility,'tip')
  assert.equal(coverageAreas(base.team,s,laterDefendTime(s),true,changes).find(a=>a.player==='harry').responsibility,'deep')
})

test('coverage alone preserves every authored scenario byte-for-byte and back-row block is only a review warning',()=>{
  const d=createStrategy();for(const s of base.plans.scenarios)d.overrides[`${s.rotation}/${s.serve}`]={coverage:{Receive:{harry:zone}}}
  const before=JSON.stringify(base),result=applyStrategy(base,d)
  assert.equal(JSON.stringify(result.bundle),before);assert.equal(all(result.bundle).length,48)
  d.overrides['1/us'].laterDefend={coverage:{harry:zone}}
  d.caseOverrides={'1/us/right/harry':{laterDefend:{coverage:{georgia:zone}}}}
  assert.equal(JSON.stringify(applyStrategy(base,d).bundle),before)
  d.overrides['1/they'].coverage.Receive.harry={...zone,role:'block'}
  const blocked=applyStrategy(base,d)
  assert.match(blocked.warnings.join('\n'),/harry.*back.row.*block/i)
  assert.equal(JSON.stringify(blocked.bundle),before);assert.equal(JSON.stringify(base),before)
})

test('assigned coverage retains independent dimensions and athlete-relative offsets, clamping only at edges',()=>{
  const a=assignedCoverage('harry',{x:0,z:4},zone)
  assert.deepEqual(a.center,{x:.2,z:3.7});assert.equal(a.radiusX,1.2);assert.equal(a.radiusZ,.6)
  assert.deepEqual(assignedCoverage('harry',{x:4.5,z:10},zone).center,{x:3.3,z:8.4})
})

test('back-row coverage warnings retain coverage review category, athlete, case and actual stage',()=>{
  const d=createStrategy(),block={...zone,role:'block'}
  d.overrides['1/they']={coverage:{Receive:{harry:block},Start:{harry:block}}}
  d.caseOverrides={'1/us/right/harry':{laterDefend:{coverage:{harry:block}}}}
  const {bundle,warnings}=applyStrategy(base,d),findings=collectReviewFindings(bundle,d,warnings,base)
  const blocks=findings.filter(f=>/assigned block coverage/.test(f.summary))
  assert.equal(blocks.length,3)
  for(const f of blocks){assert.equal(f.category,'COVERAGE');assert.equal(f.severity,'REVIEW');assert.equal(f.source,'human-review');assert.equal(f.playerId,'harry')}
  for(const stage of ['Receive','Start'])assert.deepEqual(blocks.find(f=>f.affectedStage===stage).affectedCases,['1/they/left/normal','1/they/right/normal','1/they/left/harry','1/they/right/harry'])
  assert.deepEqual(blocks.find(f=>f.affectedStage==='Defend').affectedCases,['1/us/right/harry'])
})
