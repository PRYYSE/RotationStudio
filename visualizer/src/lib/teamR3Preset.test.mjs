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
const players = ['caleb', 'georgia', 'harry', 'jaz', 'logan', 'trent']

// The owner's R3 correction does not authorise any R1 mutation or alteration of source V3.
test('combined published strategy preserves 8 R1 cases, adds 8 revised R3 cases and never mutates source', () => {
  const snapshot = JSON.stringify(base)
  const applied = applyStrategy(base, draft)
  assert.equal(JSON.stringify(base), snapshot)
  assert.equal(Object.keys(draft.caseOverrides).length, 16)
  for (const r of [1,3]) for (const serve of ['they','us']) for (const side of ['left','right']) for (const touch of ['normal','harry']) {
    assert.ok(draft.caseOverrides[`${r}/${serve}/${side}/${touch}`])
  }
  assert.deepEqual(validateBundle(applied.bundle), [])
})

test('R3 puts Trent in middle and Jaz right outside; left block belongs to Caleb with Harry covering', () => {
  const bundle = applyStrategy(base, draft).bundle
  for (const s of all(bundle).filter(s => s.rotation === 3)) {
    const caseKey = key(s), changes = draft.caseOverrides[caseKey]
    const side = s.tactics.opponentAttack
    const firstIsHarry = s.tactics.firstTouch === 'harry'
    const original = all(base).find(src => key(src) === caseKey)
    const expectedNext = side === 'left' || (s.serve === 'they' && side === 'right') ? 'georgia' : 'caleb'
    const attackerPhase = s.serve === 'they' ? 'p6:their-attack' : 'p7:their-next-attack'
    const postServe = s.serve === 'they' ? 'p2:first-pass' : 'p1:serve-hit:t255'
    const ourAttack = s.serve === 'they' ? 'p4:our-attack' : 'p5:our-attack'
    const opponent = changes.eventOverrides[attackerPhase]
    const middle = changes.eventOverrides[postServe]

    assert.deepEqual(serviceDiagnostics(bundle.team, s), [], caseKey)
    assert.deepEqual(sourceEvents(original).map(e => e.id), Object.keys(changes.eventOverrides), caseKey)
    assert.ok(middle.anchors.trent.x < 1, `${caseKey}: Trent must leave P2 into middle after contact`)
    assert.ok(middle.anchors.jaz.x > 2.4, `${caseKey}: Jaz must release to right outside`)
    assert.ok(changes.eventOverrides[ourAttack].anchors.trent.x < .5, `${caseKey}: Trent middle hitting option`)
    assert.ok(changes.eventOverrides[ourAttack].anchors.jaz.x > 2.5, `${caseKey}: Jaz right outside hitting option`)

    if (side === 'left') {
      assert.equal(opponent.actions.caleb, 'block', `${caseKey}: Caleb solo left block`)
      assert.equal(opponent.coverage.caleb.role, 'block')
      assert.equal(opponent.actions.trent, 'cover', `${caseKey}: Trent drops to floor defence`)
      assert.notEqual(opponent.coverage.trent.role, 'block')
      assert.ok(opponent.anchors.trent.z > 2.7 && Math.abs(opponent.anchors.trent.x) < .65, `${caseKey}: Trent short-middle floor`)
      assert.ok(opponent.anchors.harry.x < -1.5 && opponent.anchors.harry.z > 2.6, `${caseKey}: Harry behind left block`)
    } else {
      assert.equal(opponent.actions.trent, 'block', `${caseKey}: Trent right-side solo block`)
      assert.equal(opponent.coverage.trent.role, 'block')
      assert.notEqual(opponent.actions.caleb, 'block', `${caseKey}: Caleb remains floor defender`)
    }
    assert.ok(opponent.anchors.jaz.x > 2.5 && opponent.actions.jaz !== 'block')
    assert.equal(changes.contacts.nextReceiver, expectedNext, `${caseKey}: blocker cannot dig deep immediately`)
    assert.equal(s.tactics.nextSetter, 'harry')
    assert.equal(s.tactics.fallbackSetter, 'georgia')
    assert.equal(s.firstContact.player, firstIsHarry ? 'harry' : 'georgia')
    assert.equal(s.secondContact.player, firstIsHarry ? 'georgia' : 'harry')

    for (const event of sourceEvents(original)) {
      const action = changes.eventOverrides[event.id].actions
      assert.deepEqual(Object.keys(action).sort(), players, caseKey)
      for (const value of Object.values(action)) assert.ok(['ready','serve','receive','set','attack','block','cover','recover'].includes(value))
      for (const player of ['harry','logan','jaz']) assert.notEqual(action[player], 'block', `${caseKey}: ${player} cannot block`)
    }
    const start = changes.eventOverrides['p0:legal-start'].anchors
    const serveHit = changes.eventOverrides['p1:serve-hit'].anchors
    assert.deepEqual(serveHit, start, `${caseKey}: no early release before serve contact`)
    if (s.serve === 'us') {
      assert.equal(changes.eventOverrides['p1:serve-hit'].actions.logan, 'serve')
      assert.ok(sampleTrack(s.tracks.logan, s.ball[0].start).z > 9)
    }
    const pass = s.ball.find(b => b.kind === 'pass' && b.start === s.firstContact.time)
    assert.ok(pass && near(pass.to, sampleTrack(s.tracks[s.secondContact.player],s.secondContact.time)), `${caseKey}: first real set is synced`)
    const laterPass = s.ball.find(b => b.kind === 'pass' && b.start > s.secondContact.time)
    assert.ok(laterPass, `${caseKey}: a later full rally exists`)
    assert.ok(near(laterPass.from, sampleTrack(s.tracks[expectedNext],laterPass.start)), `${caseKey}: real next dig actor`)
    assert.ok(near(laterPass.to, sampleTrack(s.tracks.harry,laterPass.end)), `${caseKey}: Harry sets next`)
    const owners = sourceEndpointOwners(s)
    const nextIndex = s.ball.indexOf(laterPass)
    assert.equal(owners[nextIndex][0], expectedNext)
    assert.equal(owners[nextIndex][1], 'harry')
    for (const [player,track] of Object.entries(s.tracks)) for (let i=1;i<track.length;i++) {
      const previous=track[i-1], next=track[i], route=[previous,...(next.via??[]),next]
      const distance=route.slice(1).reduce((sum,p,j)=>sum+Math.hypot(p.x-route[j].x,p.z-route[j].z),0)
      const screened=1.5*distance/(next.time-previous.time)
      assert.ok(screened <= 4.01, `${caseKey} ${player} ${previous.time}->${next.time}: ${screened}`)
    }
  }
})

test('R3 Harry-first cannot incorrectly make Harry both first and second regular contacts', () => {
  const invalid = structuredClone(draft)
  invalid.caseOverrides['3/they/left/harry'].contacts.secondSetter = 'harry'
  assert.throws(() => applyStrategy(base, invalid), /first and second regular contacts/)
})
test('R3 receive RIGHT: Caleb stays forward, Harry covers Trent, Georgia deep digs', () => {
 const bundle=applyStrategy(base,draft).bundle
 for(const touch of ['normal','harry']){
  const k='3/they/right/'+touch, c=draft.caseOverrides[k], e=c.eventOverrides
  for(const phase of ['p6:their-attack','p7:defence-ready']){
   const q=e[phase],a=q.anchors
   assert.equal(q.actions.trent,'block')
   assert.equal(q.coverage.harry.role,'tip')
   assert.equal(q.coverage.caleb.role,'receive')
   assert.ok(a.caleb.x < -2.5 && a.caleb.z < 4.3,k+' Caleb stays left-middle')
   assert.ok(a.harry.x > 1 && a.harry.z < 2.7,k+' Harry behind Trent')
   assert.ok(Math.hypot(a.caleb.x-a.georgia.x,a.caleb.z-a.georgia.z) > 2.4,k+' separate floor')
   assert.ok(Math.hypot(a.harry.x-a.trent.x,a.harry.z-a.trent.z) < 2.6,k+' tip behind block')
  }
  assert.equal(c.contacts.nextReceiver,'georgia')
  assert.equal(e['p8:next-dig'].actions.georgia,'receive')
  assert.notEqual(e['p8:next-dig'].actions.caleb,'receive')
  assert.ok(e['p8:next-dig'].anchors.caleb.z < 4.4)
  const n=e['p9:next-set-ready'].anchors
  assert.ok(n.harry.x>.6 && Math.hypot(n.harry.x-n.trent.x,n.harry.z-n.trent.z)>.8)
  const scenario=all(bundle).find(s=>key(s)===k)
  assert.deepEqual(serviceDiagnostics(bundle.team,scenario),[])
  const pass=scenario.ball.find(b=>b.kind==='pass' && b.start>scenario.secondContact.time)
  assert.ok(pass && near(pass.from,sampleTrack(scenario.tracks.georgia,pass.start)))
  assert.ok(near(pass.to,sampleTrack(scenario.tracks.harry,pass.end)))
 }
})
