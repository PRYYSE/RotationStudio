import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
globalThis.window = { location: { search: '' } }
const { useRotations, activeScenario } = await import('./rotationStore.ts')
const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const get = useRotations.getState
const key = () => `${get().opponentAttack}/${get().firstTouch}`
function reset(rotation = 1, serve = 'they') {
  useRotations.setState({ published: base, draft: null, rotation, serve, opponentAttack: 'left', firstTouch: 'normal', editor: false, strategyMode: false, example: null, exampleResult: null, exampleScenario: null, time: 0, playing: false, rate: 1, transitionTarget: null, reducedMotion: false,
    shuffleEnabled: false, shuffleRunning: false, shuffleSeed: 7003, shuffleHistory: [], shuffleCursor: -1, shuffleNotice: '' })
}
test('seeded history repeats across runs and visits four distinct source cases without R/serve drift', () => {
  reset()
  const run = () => {
    get().setShuffleSeed(41)
    for (let i = 0; i < 8; i++) { get().nextVariation(); assert.equal(get().rotation, 1); assert.equal(get().serve, 'they') }
    return structuredClone(get().shuffleHistory)
  }
  const history = run()
  assert.equal(new Set(history.slice(0, 4)).size, 4)
  reset(); assert.deepEqual(run(), history)
  assert.ok(history.every((v, i) => !i || v !== history[i - 1]))
  get().previousVariation(); assert.equal(key(), history.at(-2))
  get().nextVariation(); assert.equal(key(), history.at(-1)); assert.deepEqual(get().shuffleHistory, history)
})
test('each of 48 selections is an actual existing case with unchanged contacts/tracks and local overlay', () => {
  const snapshot = JSON.stringify(base), local = structuredClone(base)
  local.plans.scenarios[0].tracks.harry[0].x += .01
  for (let r = 1; r <= 6; r++) for (const serve of ['they', 'us']) {
    reset(r, serve); useRotations.setState({ draft: local })
    const seen = new Set()
    for (let i = 0; i < 4; i++) {
      get().nextVariation(); seen.add(key())
      const root = local.plans.scenarios.find(s => s.rotation === r && s.serve === serve)
      const actual = activeScenario(get())
      assert.ok([root, ...Object.values(root.alternates)].includes(actual))
      assert.equal(actual.tactics.opponentAttack, get().opponentAttack)
      assert.equal(actual.tactics.firstTouch, get().firstTouch)
      assert.equal(get().draft, local); assert.equal(get().time, 0); assert.equal(get().playing, false)
    }
    assert.equal(seen.size, 4)
  }
  assert.equal(JSON.stringify(base), snapshot)
  assert.equal(local.plans.scenarios[0].tracks.harry[0].x, base.plans.scenarios[0].tracks.harry[0].x + .01)
})
test('invalid teaching example is skipped with explanation and never enters shuffle history', () => {
  reset()
  get().chooseExample({ x: 999, z: 8, receiver: 'auto' })
  assert.equal(get().exampleResult.ok, false)
  get().nextVariation()
  assert.equal(get().example, null); assert.equal(get().exampleResult, null)
  assert.match(get().shuffleNotice, /invalid.*skip/i)
  assert.match(get().shuffleNotice, /authored/i)
  assert.equal(activeScenario(get()).teachingOnly, undefined)
})
test('On only arms; opt-in Play completes actual source boundaries before restarting next case', () => {
  reset(1, 'us'); get().seek(5.4); get().setShuffle(true)
  assert.equal(get().time, 5.4); assert.equal(get().playing, false)
  get().toggle(); assert.equal(get().shuffleRunning, true)
  const source = activeScenario(get()), before = key(), visited = []
  for (let i = 0; i < 100 && get().time < source.duration; i++) { get().tick(30); visited.push(get().time); assert.equal(key(), before) }
  assert.equal(get().time, source.duration)
  for (const b of source.ball) if (b.end > 5.4) assert.ok(visited.includes(b.end), `contact ${b.end}: ${visited}`)
  get().tick(.1); assert.notEqual(key(), before); assert.equal(get().time, 0); assert.equal(get().playing, true)
  get().tick(.2); const time = get().time, selected = key()
  get().setShuffle(false); get().tick(30)
  assert.equal(get().time, time); assert.equal(key(), selected); assert.equal(get().playing, false)
})
test('manual pause/navigation, case/R/serve changes and Edit stop automatic shuffle', () => {
  for (const action of [() => get().pause(), () => get().seek(2), () => get().navigate(3), () => get().chooseTactics('right', 'harry'), () => get().choose(4, 'us'), () => get().setEditor(true), () => get().stopShuffle()]) {
    reset(); get().setShuffle(true); get().toggle(); action()
    assert.equal(get().shuffleRunning, false)
  }
  get().setEditor(true); const before = key(); get().nextVariation(); get().setShuffle(true)
  assert.equal(key(), before); assert.equal(get().shuffleEnabled, false)
})
test('missing alternates cannot silently fall back to a different source case', () => {
  reset()
  const bundle = structuredClone(base); delete bundle.plans.scenarios[0].alternates
  useRotations.setState({ published: bundle })
  get().nextVariation()
  assert.equal(key(), 'left/normal'); assert.equal(get().shuffleEnabled, false)
  assert.match(get().shuffleNotice, /unavailable|four/i)
})
test('shuffle actions and complete playback never mutate working strategy, library or undo history', async () => {
  reset()
  const { useStrategies } = await import('./strategyStore.ts')
  const { createStrategy, applyStrategy } = await import('../lib/strategyDraft.ts')
  const previous = useStrategies.getState(), strategy = createStrategy('Retain user draft', 'Coach')
  strategy.overrides['1/they'] = { coverage: { Receive: { harry: { role: 'tip', radiusX: .8, radiusZ: .6 } } } }
  strategy.notes = { team: { '1/they': { Receive: 'User note' } } }
  useStrategies.setState({ working: strategy, library: [strategy], saved: true, past: [structuredClone(strategy)], future: [] })
  const snapshot = useStrategies.getState(), json = JSON.stringify(snapshot)
  useRotations.setState({ draft: applyStrategy(base, strategy).bundle })
  try {
    get().nextVariation(); get().previousVariation(); get().setShuffleSeed(42); get().setShuffle(true); get().toggle()
    for (let i = 0; i < 100; i++) get().tick(1)
    get().stopShuffle()
    assert.equal(useStrategies.getState(), snapshot)
    assert.equal(JSON.stringify(useStrategies.getState()), json)
    assert.deepEqual(snapshot.working, strategy)
  } finally { useStrategies.setState(previous) }
})
