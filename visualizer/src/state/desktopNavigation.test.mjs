import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

globalThis.window = { location: { search: '' } }
const { useRotations } = await import('./rotationStore.ts')
const { useStrategies } = await import('./strategyStore.ts')
const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }

test('desktop selection instantly targets distinct source dig edits without animating or changing source', async () => {
  assert.ok(existsSync(new URL('./desktopNavigation.ts', import.meta.url)), 'desktop event selection is required')
  const { selectDesktopEvent } = await import('./desktopNavigation.ts')
  const source = base.plans.scenarios.find(s => s.rotation === 1 && s.serve === 'us')
  const original = JSON.stringify(base)
  useRotations.setState({ published: base, draft: null, rotation: 1, serve: 'us', opponentAttack: 'left', firstTouch: 'normal', editor: true, strategyMode: true, playing: true, transitionTarget: 7.77, reducedMotion: false, time: 1, selected: 'caleb', exampleResult: null })
  useStrategies.getState().newStrategy(false, base)
  for (const [id, time, x] of [['p3:our-dig', 5.4, .9], ['p8:next-dig', 12.29, 1.1]]) {
    const before = JSON.stringify(useStrategies.getState().working)
    selectDesktopEvent(source, id)
    assert.equal(useStrategies.getState().event.id, id)
    assert.equal(JSON.stringify(useStrategies.getState().working), before, 'selection must not author edits')
    const r = useRotations.getState()
    assert.equal(r.time, time); assert.equal(r.editTime, time)
    assert.equal(r.playing, false); assert.equal(r.transitionTarget, null)
    useStrategies.getState().move('1/us', 'caleb', { x, z: 6 })
  }
  const changes = useStrategies.getState().working.overrides['1/us'].eventOverrides
  assert.equal(changes['p3:our-dig'].anchors.caleb.x, .9)
  assert.equal(changes['p8:next-dig'].anchors.caleb.x, 1.1)
  assert.equal(JSON.stringify(base), original)
  useRotations.getState().navigate(14.71)
  assert.equal(useRotations.getState().playing, true, 'explicit preview can still animate')
  useRotations.setState({ playing: false, transitionTarget: null })
})
