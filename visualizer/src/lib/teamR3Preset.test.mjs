import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyStrategy, parseStrategy } from './strategyDraft.ts'
import { serviceDiagnostics, validateBundle } from './rotationValidation.ts'
import { sourceEvents, sourceEndpointOwners } from './strategyEvents.ts'
import { sampleTrack } from './rotationModel.ts'

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const base = { team: load('../../public/plans/team.json'), plans: load('../../public/plans/rotations.json') }
const draft = parseStrategy(readFileSync(new URL('../../public/strategies/pryyse-team-tactics-2026-v1.json', import.meta.url), 'utf8'))
const all = bundle => bundle.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])
const key = s => `${s.rotation}/${s.serve}/${s.tactics?.opponentAttack}/${s.tactics?.firstTouch}`
const near = (a, b) => Math.hypot(a.x-b.x,a.z-b.z) < 1e-5

test('combined published strategy retains 8 R1 cases and adds 8 R3 cases without changing V3 source data', () => {
  const snapshot = JSON.stringify(base)
  const applied = applyStrategy(base, draft)
  assert.equal(JSON.stringify(base), snapshot)
  assert.equal(Object.keys(draft.caseOverrides).length, 16)
  for (const r of [1,3]) for (const serve of ['they','us']) for (const side of ['left','right']) for (const touch of ['normal','harry']) {
    assert.ok(draft.caseOverrides[`${r}/${serve}/${side}/${touch}`])
  }
  assert.equal(validateBundle(applied.bundle).length, 0)
})

test('each R3 event gives all six meaningful coaching actions and correct actual contact ownership', () => {
  const bundle = applyStrategy(base, draft).bundle
  for(const scenario of all(bundle).filter(s=>s.rotation===3)){
    const original = all(base).find(s=>key(s)===key(scenario))
    const changes = draft.caseOverrides[key(scenario)]
    const expectedSecond = scenario.tactics.firstTouch==='harry'?'georgia':'harry'
    assert.equal(scenario.secondContact.player, expectedSecond)
    assert.equal(scenario.tactics.fallbackSetter,'georgia')
    assert.equal(scenario.tactics.nextSetter,'harry')
    assert.equal(scenario.firstContact.player,scenario.tactics.firstTouch==='harry'?'harry':'georgia')
    assert.deepEqual(serviceDiagnostics(bundle.team,scenario),[])
    assert.deepEqual(sourceEvents(original).map(e=>e.id),Object.keys(changes.eventOverrides))
    for (const event of sourceEvents(original)) {
      const action=changes.eventOverrides[event.id].actions
      assert.deepEqual(Object.keys(action).sort(), ['caleb','georgia','harry','jaz','logan','trent'].sort())
      for(const value of Object.values(action))assert.ok(['ready','serve','receive','set','attack','block','cover','recover'].includes(value))
      assert.notEqual(action.harry,'block')
      assert.notEqual(action.logan,'block')
      assert.notEqual(action.jaz,'block')
    }
    if(scenario.serve==='us'){
      assert.equal(changes.eventOverrides['p1:serve-hit'].actions.logan,'serve')
      assert.ok(sampleTrack(scenario.tracks.logan, scenario.ball[0].start).z > 9)
    }
    const firstPass=scenario.ball.find(b=>b.kind==='pass')
    assert.ok(near(firstPass.to,sampleTrack(scenario.tracks[expectedSecond],scenario.secondContact.time)))
    const laterPass=scenario.ball.find(b=>b.kind==='pass'&&b.start>scenario.secondContact.time)
    assert.ok(laterPass)
    assert.ok(near(laterPass.from,sampleTrack(scenario.tracks.caleb,laterPass.start)))
    assert.ok(near(laterPass.to,sampleTrack(scenario.tracks.harry,laterPass.end)))
    const owners=sourceEndpointOwners(scenario)
    const nextIdx=scenario.ball.indexOf(laterPass)
    assert.equal(owners[nextIdx][0],'caleb')
    assert.equal(owners[nextIdx][1],'harry')
    for(const [player,track] of Object.entries(scenario.tracks)) for(let i=1;i<track.length;i++){
      const prev=track[i-1],next=track[i],route=[prev,...(next.via??[]),next]
      const distance=route.slice(1).reduce((sum,p,j)=>sum+Math.hypot(p.x-route[j].x,p.z-route[j].z),0)
      const screened=1.5*distance/(next.time-prev.time)
      assert.ok(screened<=4.01,`${key(scenario)} ${player} ${prev.time}->${next.time}: ${screened}`)
    }
  }
})

test('explicit ownership cannot assign the same person first and second contacts', () => {
 const invalid=structuredClone(draft)
 invalid.caseOverrides['3/they/left/harry'].contacts.secondSetter='harry'
 assert.throws(()=>applyStrategy(base,invalid),/first and second regular contacts/)
})
