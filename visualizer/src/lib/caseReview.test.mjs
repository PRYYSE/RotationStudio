import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createReviewModel, createReviewProjection } from './caseReview.ts'
import { timelinePath } from './reviewGeometry.ts'
import { applyStrategy, createStrategy, stageTimes, laterDefendTime, scenarioCaseKey } from './strategyDraft.ts'
import { isFront, positionOf, sampleTrack } from './rotationModel.ts'
import { serviceDiagnostics, validateBundle } from './rotationValidation.ts'
import { movementIssue } from './receiveExample.ts'

const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const all = b => b.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])
const context = (s, stage = 'Set', playerId = 'harry') => ({ rotation:s.rotation, serve:s.serve, attackSide:s.tactics.opponentAttack, firstTouch:s.tactics.firstTouch, stage, playerId })
const get = (r, serve='they') => base.plans.scenarios.find(s => s.rotation===r && s.serve===serve)
const point = p => ({x:p.x,z:p.z})
const freeze = o => { Object.freeze(o); Object.values(o).forEach(v => { if(v && typeof v==='object' && !Object.isFrozen(v)) freeze(v) }); return o }
freeze(base)
const publishedModel=createReviewModel(base,null)

test('48 cases x five stages x six actors use source identity, events, tracks and immutable empty V2', () => {
  const draft = createStrategy(), before=JSON.stringify(base)
  const emptyModel=createReviewModel(base,draft)
  assert.deepEqual(applyStrategy(base,draft).bundle,base)
  assert.equal(all(base).length,48)
  for(const s of all(base)) for(const stage of ['Start','Receive','Set','Attack','Defend']) {
    const p=publishedModel.project(context(s,stage))
    const empty=emptyModel.project(context(s,stage))
    assert.equal(p.caseSource,'published'); assert.equal(empty.caseSource,'shared-draft')
    assert.deepEqual(p.actors,empty.actors)
    assert.equal(p.eventTime,stageTimes(s)[stage])
    assert.equal(p.eventLabel,s.phases.find(e=>Math.abs(e.time-p.eventTime)<1e-6).label)
    assert.equal(p.firstContact,s.firstContact.player); assert.equal(p.secondContact,s.secondContact.player)
    assert.equal(p.actors.length,6)
    for(const a of p.actors) {
      assert.equal(a.number,positionOf(base.team,s.rotation,a.id)); assert.equal(a.frontEligible,isFront(a.number))
      assert.deepEqual(a.point,point(sampleTrack(s.tracks[a.id],p.eventTime)))
      assert.equal(a.role,sampleTrack(s.tracks[a.id],p.eventTime).role)
      assert.equal(a.isNamedFirst,a.id===s.firstContact.player); assert.equal(a.isNamedSecond,a.id===s.secondContact.player)
      assert.equal(a.isAnimatedHitter,a.id===p.animatedHitter)
      assert.equal(a.isOtherFrontHitterOption,a.frontEligible && !a.isNamedSecond && !a.isAnimatedHitter)
    }
    const hit=s.ball.find(b=>b.kind==='attack' && b.start===stageTimes(s).Attack)
    assert.ok(p.animatedHitter)
    assert.deepEqual(point(sampleTrack(s.tracks[p.animatedHitter],hit.start)),point(hit.from))
    assert.ok(!p.eligibleFrontAttackers.includes(p.secondContact))
    for(const actor of p.actors) {
      const selected=publishedModel.project(context(s,stage,actor.id))
      assert.equal(selected.noteScope.playerId,actor.id)
      assert.deepEqual(selected.comparison.current.point,actor.point)
      assert.ok(selected.explanation.player)
    }
    if(stage==='Receive' && s.tactics.firstTouch==='harry') assert.match(p.explanation.core,new RegExp(`A named backup, ${base.team.players.find(a=>a.id===s.secondContact.player).name}`))
    assert.deepEqual(p.nextEvent,s.phases.find(e=>e.time>p.eventTime) && (({label,time})=>({label,time}))(s.phases.find(e=>e.time>p.eventTime)))
    assert.doesNotMatch(JSON.stringify(p),/approved|\d+%|probability|success rate/i)
  }
  assert.equal(JSON.stringify(base),before)
})

test('eligibility is distinct from setting, passing and unmodelled alternate hitter readiness', () => {
  for(const r of [4,5]) {
    const p=publishedModel.project(context(get(r)))
    const harry=p.actors.find(a=>a.id==='harry')
    assert.equal(harry.frontEligible,true); assert.equal(harry.availability,'second-contact')
    assert.equal(harry.isOtherFrontHitterOption,false)
  }
  const p=publishedModel.project(context(get(5),'Attack','caleb'))
  assert.equal(p.animatedHitter,'georgia')
  assert.equal(p.actors.find(a=>a.id==='caleb').availability,'conditional-after-first')
  assert.match(p.explanation.player,/Conditional: needs sufficient time after passing/)
  assert.ok(p.reviewFindings.some(f=>f.code==='first-to-attack-review' && f.playerId==='caleb' && f.severity==='REVIEW'))
  const missing=structuredClone(base), s=missing.plans.scenarios.find(s=>s.rotation===5 && s.serve==='they')
  for(const track of Object.values(s.tracks)) for(const frame of track) if(frame.role==='attack') frame.role='help'
  const absent=createReviewProjection(missing,null,context(s,'Attack'))
  assert.equal(absent.animatedHitter,null)
  assert.match(absent.explanation.team,/not authored/i)
  assert.ok(absent.reviewFindings.some(f=>f.code==='hitter-not-authored' && f.severity==='REVIEW'))
})

test('notes retain exact plain text, scope and provenance; source cues and factual fallbacks stay separate', () => {
  const d=createStrategy(); d.notes={team:{'3/they':{Set:'Team <call> 🏐'}},players:{'3/they':{Set:{harry:{primary:'My words',ifDifferent:'',fallback:'Ask Trent',teamCall:'Mine'}}}}}
  const before=structuredClone(d)
  const model=createReviewModel(base,d)
  for(const s of all(base).filter(s=>s.rotation===3 && s.serve==='they')) {
    const p=model.project(context(s))
    assert.equal(p.notes.team,'Team <call> 🏐'); assert.deepEqual(p.notes.player,d.notes.players['3/they'].Set.harry)
    assert.equal(p.explanation.team,'Team <call> 🏐'); assert.equal(p.explanation.player,'My words')
    assert.equal(p.explanation.teamSource,'user-authored'); assert.equal(p.explanation.playerSource,'user-authored')
    p.notes.player.primary='Changed result'; assert.equal(d.notes.players['3/they'].Set.harry.primary,'My words')
  }
  assert.deepEqual(model.project(context(get(3),'Receive')).notes,{team:null,player:null})
  assert.deepEqual(model.project(context(get(3,'us'))).notes,{team:null,player:null})
  const fallback=publishedModel.project(context(get(3)))
  assert.match(fallback.explanation.core,/Second contact: Harry/)
  assert.equal(fallback.explanation.team,get(3).phases.find(p=>p.label==='Second contact').cue)
  assert.deepEqual(d,before)
})

test('path lengths clip eased timed polylines exactly, including bends and holds', () => {
  const track=[{time:0,x:0,z:0,role:'start'},{time:4,x:3,z:4,via:[{x:3,z:0}],role:'help'}]
  const full=timelinePath(track,0,4)
  assert.equal(full.straightMetres,5); assert.equal(full.pathMetres,7); assert.equal(full.availableSeconds,4)
  assert.equal(timelinePath(track,1,3).pathMetres,7*(.84375-.15625))
  assert.equal(timelinePath(track,2,2).pathMetres,0)
  assert.throws(()=>timelinePath(track,3,2),/interval/i)
})

test('R1 service hold and R3 release use real source times and all timed waypoint segments', () => {
  for(const s of [get(1,'us'),get(3),get(3,'us')]) {
    const p=publishedModel.project(context(s))
    const incoming=p.comparison.current.incoming
    assert.equal(incoming.from.time,s.firstContact.time); assert.equal(incoming.to.time,s.secondContact.time)
    assert.equal(incoming.availableSeconds,s.secondContact.time-s.firstContact.time)
    assert.equal(incoming.straightMetres,Math.hypot(sampleTrack(s.tracks.harry,s.firstContact.time).x-s.setterTarget.x,sampleTrack(s.tracks.harry,s.firstContact.time).z-s.setterTarget.z))
    const release=p.comparison.current.releaseToEvent
    assert.equal(release.from.time,s.ball[0].start)
    assert.equal(release.availableSeconds,s.secondContact.time-s.ball[0].start)
    assert.ok(release.pathMetres>=release.straightMetres-1e-9)
  }
  const s=get(1,'us'), p=publishedModel.project(context(s,'Start'))
  assert.match(p.explanation.player,/Serve from behind the baseline/)
  assert.equal(p.comparison.current.incoming.pathMetres,0)
  assert.equal(timelinePath(s.tracks.harry,0,s.ball[0].start).pathMetres,0)
  const r3=publishedModel.project(context(get(3))).comparison.current
  assert.ok(Math.abs(r3.releaseToEvent.availableSeconds-3.3)<1e-12)
  assert.ok(Math.abs(r3.incoming.availableSeconds-1.95)<1e-12)
  const expected=Math.hypot(.55,-1.15)+Math.hypot(.5,-1.45)+Math.hypot(1.05,-.1)+Math.hypot(.5,.35)
  assert.ok(Math.abs(r3.releaseToEvent.pathMetres-expected)<1e-12)
})

test('shared/case/later defence comparison reports exact geometry, fan-out and same-time V3 ghost', () => {
  const d=createStrategy(); d.overrides['3/us']={anchors:{Receive:{caleb:{x:0,z:6}}}}
  let p=createReviewProjection(base,d,context(get(3,'us'),'Receive','caleb'))
  assert.equal(p.caseSource,'shared-draft'); assert.equal(p.comparison.affectedCases.length,4)
  d.caseOverrides={'3/us/right/harry':{laterDefend:{anchors:{georgia:{x:-1.5,z:6}},routes:{georgia:[{x:-2,z:5}]}}}}
  const s=get(3,'us').alternates.harryRight
  p=createReviewProjection(base,d,context(s,'Defend','georgia'),{laterDefend:true})
  assert.equal(p.caseSource,'case-specific'); assert.equal(p.eventTime,laterDefendTime(s)); assert.equal(p.eventLabel,'Defend again')
  assert.deepEqual(p.comparison.current.point,{x:-1.5,z:6})
  assert.deepEqual(p.comparison.baseline.point,point(sampleTrack(s.tracks.georgia,p.eventTime)))
  assert.equal(p.comparison.current.incoming.from.time,stageTimes(s).Attack)
  assert.deepEqual(p.comparison.scopeCases,['3/us/right/harry'])
  assert.equal(p.comparison.caseChanges.filter(c=>c.pointChanged).length,1)
  assert.deepEqual(createReviewProjection(base,d,context(s,'Defend','georgia')).actors.map(a=>a.point),publishedModel.project(context(s,'Defend','georgia')).actors.map(a=>a.point))
})

test('invalid Start stays visible; grouped warnings preserve all raw validator/service/movement case details', () => {
  const d=createStrategy(); d.overrides['1/us']={anchors:{Start:{harry:{x:0,z:5}}}}
  const p=createReviewProjection(base,d,context(get(1,'us'),'Start'))
  assert.deepEqual(p.actors.find(a=>a.id==='harry').point,{x:0,z:5})
  const rules=p.reviewFindings.filter(f=>f.category==='RULE')
  assert.ok(rules.some(f=>f.affectedCases.length===4 && f.playerId==='harry' && f.severity==='INVALID'))
  assert.match(rules.map(f=>f.suggestedCheck).join(' '),/foot|centre-point/)
  const edited=applyStrategy(base,d).bundle
  for(const raw of validateBundle(edited)) assert.ok(p.reviewFindings.some(f=>f.details.some(detail=>detail.message===raw)),raw)
  for(const s of all(edited)) {
    for(const raw of serviceDiagnostics(edited.team,s)) assert.ok(p.reviewFindings.some(f=>f.details.some(detail=>detail.caseKey===scenarioCaseKey(s) && detail.message===raw)))
    const issue=movementIssue(s)
    if(issue) assert.ok(p.reviewFindings.some(f=>f.details.some(detail=>detail.caseKey===scenarioCaseKey(s) && detail.message===issue)))
  }
  assert.deepEqual(p,createReviewProjection(base,d,context(get(1,'us'),'Start')))
})

test('unsupported authored case is explicit and never silently reuses another variant', () => {
  const b=structuredClone(base); delete b.plans.scenarios[0].alternates.harryRight
  const s=base.plans.scenarios[0]
  assert.throws(()=>createReviewProjection(b,null,{...context(s),attackSide:'right',firstTouch:'harry'}),/not authored/i)
  assert.throws(()=>createReviewProjection(base,null,context(get(3)),{laterDefend:true}),/later defence/i)
  const covered=createReviewProjection(b,null,context(s))
  assert.ok(covered.reviewFindings.some(f=>f.code==='case-not-authored' && f.severity==='REVIEW' && f.affectedCases.includes(`${s.rotation}/${s.serve}/right/harry`)))
})

test('broken ball contact remains INVALID; missing alternate readiness and changed note/contact remain REVIEW', () => {
  const b=structuredClone(base), s=b.plans.scenarios.find(s=>s.rotation===3 && s.serve==='they')
  s.ball.find(b=>b.kind==='pass').to.x+=.8
  const p=createReviewProjection(b,null,context(s))
  assert.ok(p.reviewFindings.some(f=>f.code==='pass-link' && f.category==='CONTACT' && f.severity==='INVALID' && f.affectedStage==='Receive' && f.playerId==='georgia' && f.affectedCases.includes('3/they/left/normal')))
  const d=createStrategy(); d.caseOverrides={'3/they/right/harry':{setterTarget:{x:2,z:1}}}
  d.notes={team:{'3/they':{Set:'Our call'}},players:{'3/they':{Set:{trent:{primary:'Review my call'}}}}}
  const result=createReviewProjection(base,d,context(get(3).alternates.harryRight,'Set','trent'))
  assert.equal(result.secondContact,'trent'); assert.equal(result.caseSource,'case-specific')
  assert.deepEqual(result.comparison.affectedCases,['3/they/right/harry'])
  const note=result.reviewFindings.find(f=>f.code==='note-contact-review')
  assert.equal(note.severity,'REVIEW'); assert.deepEqual(note.affectedCases,['3/they/right/harry'])
  assert.deepEqual(result.notes.player,{primary:'Review my call'})
  const unmodelled=result.reviewFindings.filter(f=>f.code==='hitter-route-unmodelled')
  assert.ok(unmodelled.length); assert.ok(unmodelled.every(f=>f.severity==='REVIEW'))
  const team=publishedModel.project(context(get(3),'Set',null))
  assert.equal(team.comparison,null); assert.equal(team.notes.player,null); assert.equal(team.explanation.player,null)
})
