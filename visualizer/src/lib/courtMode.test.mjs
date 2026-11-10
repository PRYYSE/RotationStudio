import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialWorkspace, annotationScope, validateNotes, reviewPacket, groundPan, reviewIdFrom, reviewEntry } from './courtMode.ts'
import { readFileSync } from 'node:fs'
const base = {team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url)))}
test('workspace defaults use platform identity; links and explicit preference win', () => {
  assert.equal(initialWorkspace('Mozilla/5.0 (X11; Linux x86_64)', '', null), 'studio')
  assert.equal(initialWorkspace('Mozilla/5.0 (iPhone)', '', null), 'court')
  assert.equal(initialWorkspace('Mozilla/5.0 (Linux; Android 14; Tablet)', '', null), 'court')
  assert.equal(initialWorkspace('Macintosh', '', null, true), 'court')
  assert.equal(initialWorkspace('iPhone', '', 'studio'), 'studio')
  assert.equal(initialWorkspace('Linux', '?ui=court', 'studio'), 'court')
  assert.equal(reviewIdFrom(''),null)
  assert.throws(()=>reviewEntry({schemaVersion:1,reviews:{}},reviewIdFrom('?review=')))
})
test('notes retain source/case/moment and reject corrupt import without changing data', () => {
  const a = annotationScope('v1', 1, 'they', 'left', 'normal')
  assert.notEqual(a, annotationScope('v2', 1, 'they', 'left', 'normal'))
  assert.notEqual(a, annotationScope('v1', 1, 'us', 'left', 'normal'))
  const notes = [{id:'n1', scope:a, time:1.23, whole:false, tool:'pen', points:[{x:1,z:2},{x:2,z:3}], text:'', owner:'Local coach'}]
  assert.deepEqual(validateNotes(JSON.parse(JSON.stringify({schemaVersion:1,notes}))), notes)
  assert.throws(() => validateNotes({schemaVersion:1,notes:[{...notes[0],points:[{x:NaN,z:0}]}]}))
  assert.throws(() => validateNotes({schemaVersion:1,notes:[{...notes[0],tool:'script'}]}))
})
test('review packets isolate one rotation and require the exact selected serve/case', () => {
  const packet = {schemaVersion:1,id:'r1-v1',rotation:1,version:'R1 v1',scenarios:base.plans.scenarios.filter(s=>s.rotation===1)}
  const out = reviewPacket(packet, base, 'r1-v1', 1, 'they', 'left', 'normal')
  assert.equal(out.plans.scenarios.length,12)
  assert.deepEqual(out.plans.scenarios.find(s=>s.rotation===2),base.plans.scenarios.find(s=>s.rotation===2))
  assert.throws(()=>reviewPacket({...packet,scenarios:[base.plans.scenarios.find(s=>s.rotation===2)]},base,'r1-v1',1,'they','left','normal'))
  assert.throws(()=>reviewPacket(packet,base,'r1-v2',1,'they','left','normal'))
  assert.throws(()=>reviewPacket({...packet,scenarios:packet.scenarios.filter(s=>s.serve==='us')},base,'r1-v1',1,'they','left','normal'))
})
test('ground-plane pan keeps Y fixed and clamps targets', () => {
  assert.deepEqual(groundPan({x:0,z:0},{x:2,z:-3}),{x:2,z:-3})
  assert.deepEqual(groundPan({x:9,z:13},{x:10,z:10}),{x:12,z:15})
})
