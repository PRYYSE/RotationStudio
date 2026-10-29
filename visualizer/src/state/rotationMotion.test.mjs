import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
globalThis.window = { location: { search: '' } }
const { useRotations, activeScenario } = await import('./rotationStore.ts')
const { sampleTrack, ballAt } = await import('../lib/rotationModel.ts')
const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const get = useRotations.getState
function reset() {
  useRotations.setState({ published: structuredClone(base), draft: null, rotation: 1, serve: 'us', opponentAttack: 'left', firstTouch: 'normal', editor: false, strategyMode: false, example: null, exampleResult: null, exampleScenario: null, time: 0, editTime: 0, playing: false, rate: 1, transitionTarget: null, reducedMotion: false, selected: 'georgia' })
}
test('destination navigation samples real intermediate players and ball then stops exactly forward and backward', () => {
  reset()
  const source = activeScenario(get()), player = sampleTrack(source.tracks.harry, 0), ball = ballAt(source, 0)
  get().navigate(5.4); assert.equal(get().time, 0); assert.equal(get().playing, true)
  get().tick(.6); assert.equal(get().time, .6)
  get().tick(.6); get().tick(.6); get().tick(.3)
  assert.notDeepEqual(sampleTrack(source.tracks.harry, get().time), player)
  assert.notDeepEqual(ballAt(source, get().time), ball)
  for (let i = 0; i < 100 && get().playing; i++) get().tick(.2)
  assert.equal(get().time, 5.4); assert.equal(get().playing, false)
  get().navigate(1.4); get().tick(.1); assert.ok(get().time < 5.4 && get().time > 1.4)
  for (let i = 0; i < 100 && get().playing; i++) get().tick(.2)
  assert.equal(get().time, 1.4); assert.equal(get().playing, false)
  get().tick(1); assert.equal(get().time, 1.4)
  assert.deepEqual(get().published, base); assert.equal(get().draft, null)
})
test('large controlled ticks render every authored contact in either direction without overshooting destination', () => {
  reset()
  get().navigate(5.4)
  const seen = []
  while (get().playing && seen.length < 100) { get().tick(30); seen.push(get().time) }
  for (const t of [1.4, 2.55, 4.18, 5.4]) assert.ok(seen.includes(t), `${t}: ${seen}`)
  get().navigate(0); const backwards = []
  while (get().playing && backwards.length < 100) { get().tick(30); backwards.push(get().time) }
  for (const t of [4.18, 2.55, 1.4, 0]) assert.ok(backwards.includes(t), `${t}: ${backwards}`)
})
test('retarget, pause, explicit jump and reduced motion cancel stale motion', () => {
  reset()
  get().navigate(12.29); get().tick(.5); get().navigate(0); get().tick(1)
  assert.equal(get().time, 0); assert.equal(get().playing, false)
  get().navigate(5.4); get().tick(.3); get().pause(); get().tick(2); assert.equal(get().time, .3)
  get().navigate(7.77, true); assert.equal(get().time, 7.77); assert.equal(get().playing, false)
  useRotations.setState({ reducedMotion: true }); get().navigate(12.29)
  assert.equal(get().time, 12.29); assert.equal(get().playing, false)
  get().navigate(NaN); assert.equal(get().time, 12.29)
  get().navigate(5.4); get().choose(2, 'they'); get().tick(10); assert.equal(get().time, 0); assert.equal(get().transitionTarget, null)
})
test('Edit preview plays, pause restores a source event and mode switches preserve athlete and stage time', () => {
  reset()
  get().seek(5.4); get().setEditor(true)
  assert.equal(get().time, 5.4); assert.equal(get().selected, 'georgia')
  useRotations.setState({ strategyMode: true })
  get().navigate(7.77); get().tick(.4); assert.ok(get().time > 5.4 && get().time < 7.77)
  get().pause(); assert.equal(get().time, 5.4); assert.equal(get().editTime, 5.4)
  get().navigate(7.77)
  for (let i = 0; i < 100 && get().playing; i++) get().tick(.2)
  assert.equal(get().time, 7.77); assert.equal(get().editTime, 7.77)
  get().setEditor(false); assert.equal(get().time, 7.77); assert.equal(get().selected, 'georgia')
})
test('unavailable altered samples cannot animate or jump as an authoritative outcome', () => {
  reset()
  useRotations.setState({ exampleResult: { ok: false, message: 'Unsupported' }, time: 5.4 })
  get().navigate(12.29); get().tick(1)
  assert.equal(get().time, 5.4); assert.equal(get().playing, false)
})
