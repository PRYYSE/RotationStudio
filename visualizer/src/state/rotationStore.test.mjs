import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
globalThis.window = { location: { search: '' } }
const { useRotations, activeBundle, activeScenario } = await import('./rotationStore.ts')
const original = { team: JSON.parse(readFileSync(new URL('../../tests/fixtures/demo-team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../tests/fixtures/demo-rotations.json', import.meta.url))) }
beforeEach(() => {
  useRotations.setState({ published: null, draft: null, error: '', loading: true, rotation: 1, serve: 'they', time: 0, playing: false, rate: 1, view: 'orbit', labels: true, trails: true, editor: false, selected: 'harry', editTime: 0, opponentAttack: 'left', firstTouch: 'normal', receiveAreas: true })
  useRotations.getState().setBundle(structuredClone(original))
})
test('play pause resume speed seek reverse and end restart are deterministic', () => {
  const get = useRotations.getState
  get().toggle(); get().tick(1); assert.equal(get().time, 1)
  get().toggle(); get().tick(3); assert.equal(get().time, 1); assert.equal(get().playing, false)
  useRotations.setState({ rate: 2 }); get().toggle(); get().tick(0.5); assert.equal(get().time, 2)
  get().seek(8); assert.equal(get().playing, false); assert.equal(get().time, 8)
  get().seek(2); assert.equal(get().time, 2)
  get().seek(200); assert.equal(get().time, 15)
  get().toggle(); assert.equal(get().time, 0)
  get().tick(30); assert.equal(get().time, 15); assert.equal(get().playing, false)
  get().seek(-2); assert.equal(get().time, 0)
  get().seek(NaN); assert.equal(get().time, 0)
})
test('changing rotation or serve clears animation and editor time without changing published plans', () => {
  const get = useRotations.getState
  get().toggle(); get().tick(5); get().choose(6, 'us')
  assert.equal(get().time, 0); assert.equal(get().playing, false); assert.equal(get().editTime, 0)
  assert.equal(activeScenario(get()).rotation, 6); assert.equal(activeScenario(get()).serve, 'us')
  assert.equal(activeScenario(get()).duration, 17)
  assert.deepEqual(activeBundle(get()), original)
})
test('coach edits clone data, snap to keyframes, pause and reset without public writes', () => {
  const get = useRotations.getState
  get().edit({ x: 1, z: 2 }); assert.equal(get().draft, null)
  useRotations.setState({ editor: true, selected: 'jaz' }); get().seek(12.7)
  assert.equal(get().time, 13); assert.equal(get().editTime, 13)
  get().edit({ x: 1.1, z: 6.9 }); get().toggle()
  assert.equal(activeScenario(get()).tracks.jaz.find((k) => k.time === 13).x, 1.1)
  assert.equal(get().playing, false)
  assert.deepEqual(get().published, original)
  get().resetDraft(); assert.equal(get().draft, null); assert.equal(get().time, 0)
  assert.deepEqual(activeBundle(get()), original)
})
test('PASS HERE edits maintain pass landing, set origin and setter contact together', () => {
  const get = useRotations.getState
  useRotations.setState({ editor: true, selected: 'target' })
  get().edit({ x: 1.3, z: 1.4 })
  const s = activeScenario(get())
  assert.deepEqual(s.setterTarget, { x: 1.3, z: 1.4 })
  assert.deepEqual(s.ball.find((b) => b.kind === 'pass').to, { x: 1.3, z: 1.4, y: 2.2 })
  assert.deepEqual(s.ball.find((b) => b.kind === 'set').from, { x: 1.3, z: 1.4, y: 2.2 })
  assert.equal(s.tracks.harry.find((k) => k.time === 8).x, 1.3)
  assert.deepEqual(get().published, original)
})
test('validated draft import resets playback and invalid import preserves the previous draft', () => {
  const get = useRotations.getState
  const edited = structuredClone(original); edited.plans.scenarios[0].tracks.jaz.at(-1).x = 1.7
  get().seek(9); get().importDraft(edited)
  assert.equal(get().time, 0); assert.equal(get().playing, false)
  assert.equal(activeScenario(get()).tracks.jaz.at(-1).x, 1.7)
  const broken = structuredClone(original); broken.plans.schemaVersion = 9
  get().importDraft(broken)
  assert.match(get().error, /Unsupported schemaVersion/)
  assert.equal(activeScenario(get()).tracks.jaz.at(-1).x, 1.7)
  assert.deepEqual(get().published, original)
})

test('first-contact dragging keeps incoming flight and pass origin connected for export', async () => {
  const { validateBundle } = await import('../lib/rotationValidation.ts')
  const get = useRotations.getState
  const published = structuredClone(original)
  published.plans.scenarios[0].ball[0].end -= 0.2 // Hold at the receiver before passing.
  get().setBundle(published)
  const before = activeScenario(get())
  useRotations.setState({ editor: true, selected: before.firstContact.player, editTime: before.firstContact.time })
  get().edit({ x: -2, z: 6 })
  const s = activeScenario(get()), pass = s.ball.find((b) => b.kind === 'pass')
  assert.deepEqual(pass.from, { x: -2, y: 1, z: 6 })
  assert.deepEqual(s.ball[0].to, pass.from)
  assert.deepEqual(validateBundle(activeBundle(get())), [])
  assert.deepEqual(get().published, published)
})
test('setter contact dragging keeps target and both ball endpoints linked', async () => {
  const { validateBundle } = await import('../lib/rotationValidation.ts')
  const get = useRotations.getState
  const published = structuredClone(original)
  published.plans.scenarios[0].ball[2].start += 0.2 // Hold at second contact before setting.
  get().setBundle(published)
  const before = activeScenario(get())
  useRotations.setState({ editor: true, selected: before.secondContact.player, editTime: before.secondContact.time })
  get().edit({ x: 1.3, z: 1.4 })
  const s = activeScenario(get())
  assert.deepEqual(s.setterTarget, { x: 1.3, z: 1.4 })
  assert.deepEqual(s.ball[1].to, s.ball[2].from)
  assert.equal(s.ball[1].to.x, 1.3)
  assert.deepEqual(validateBundle(activeBundle(get())), [])
})
test('local edits never retain approved status', () => {
  const get = useRotations.getState, b = structuredClone(original)
  b.team.status = b.plans.status = 'APPROVED'; get().setBundle(b)
  useRotations.setState({ editor: true, selected: 'target' }); get().edit({ x: 1.3, z: 1.4 })
  assert.equal(activeBundle(get()).plans.status, 'DRAFT')
  assert.equal(get().published.plans.status, 'APPROVED')
})

const tactical = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const combinations = [['base', 'left', 'normal'], ['right', 'right', 'normal'], ['harry', 'left', 'harry'], ['harryRight', 'right', 'harry']]

test('tactical switches select all 48 full authored scenarios, pause and preserve timeline without stale roles', async () => {
  const { sampleTrack, phaseAt } = await import('../lib/rotationModel.ts')
  const get = useRotations.getState
  get().setBundle(structuredClone(tactical))
  for (const base of tactical.plans.scenarios) {
    get().choose(base.rotation, base.serve)
    assert.equal(get().time, 0)
    for (const [key, attack, touch] of combinations) {
      get().seek(5.1); get().toggle()
      get().chooseTactics(attack, touch)
      const expected = key === 'base' ? base : base.alternates[key]
      assert.deepEqual(activeScenario(get()), expected)
      assert.equal(get().playing, false)
      assert.equal(get().time, 5.1)
      assert.equal(get().editTime, 5.1)
      assert.equal(phaseAt(activeScenario(get()), get().time).label, phaseAt(expected, 5.1).label)
      get().seek(0)
      for (const id of tactical.team.initialOrder) assert.equal(sampleTrack(activeScenario(get()).tracks[id], get().time).role, 'start')
    }
  }
  assert.deepEqual(get().published, tactical)
})

test('selection restored before loading clamps against the selected trajectory and legacy demos stay usable', () => {
  const get = useRotations.getState
  useRotations.setState({ rotation: 3, serve: 'us', opponentAttack: 'right', firstTouch: 'harry', time: 999 })
  get().setBundle(structuredClone(tactical))
  assert.deepEqual(activeScenario(get()), tactical.plans.scenarios[5].alternates.harryRight)
  assert.equal(get().time, activeScenario(get()).duration)
  assert.equal(activeScenario(get()).tactics.nextSetter, 'trent')
  get().setBundle(structuredClone(original))
  assert.deepEqual(activeScenario(get()), original.plans.scenarios[5])
  get().chooseTactics('left', 'normal')
  assert.deepEqual(activeScenario(get()), original.plans.scenarios[5])
})

test('tactical switches remap phase progress and snap draft editing to the new authored frames', () => {
  const get = useRotations.getState, bundle = structuredClone(tactical)
  // A valid timing difference in an imported alternative: labels, not a raw
  // stale second count, anchor the selected timeline phase.
  const alternate = bundle.plans.scenarios[0].alternates.right
  alternate.phases.find((p) => p.label === 'Second contact').time = 4.6
  get().setBundle(bundle)
  get().seek(4.7)
  get().chooseTactics('right', 'normal')
  assert.ok(Math.abs(get().time - 4.8) < 1e-9)
  useRotations.setState({ editor: true, editTime: 0 })
  get().chooseTactics('left', 'harry')
  assert.equal(get().time, 4.5); assert.equal(get().editTime, 4.5)
  assert.equal(get().playing, false)
})

test('selected alternate draft edits keep receiver, backup setter and PASS HERE endpoints linked without touching siblings', async () => {
  const { validateBundle, exportBundle, parseBundle } = await import('../lib/rotationValidation.ts')
  const get = useRotations.getState
  for (const serve of ['they', 'us']) for (const [key, attack, touch] of combinations) {
    useRotations.setState({ draft: null, editor: false })
    get().setBundle(structuredClone(tactical))
    get().choose(3, serve); get().chooseTactics(attack, touch)
    const before = activeScenario(get())
    useRotations.setState({ editor: true, selected: before.firstContact.player, editTime: before.firstContact.time })
    const first = before.tracks[before.firstContact.player].find((k) => k.time === before.firstContact.time)
    get().edit({ x: first.x + 0.1, z: first.z })
    let s = activeScenario(get()), pass = s.ball.find((b) => b.kind === 'pass')
    assert.equal(pass.from.x, first.x + 0.1)
    assert.deepEqual(s.ball[s.ball.indexOf(pass) - 1].to, pass.from)
    useRotations.setState({ selected: s.secondContact.player, editTime: s.secondContact.time })
    get().edit({ x: 1.6, z: 1.1 })
    s = activeScenario(get()); pass = s.ball.find((b) => b.kind === 'pass')
    assert.deepEqual(s.setterTarget, { x: 1.6, z: 1.1 })
    assert.deepEqual(pass.to, s.ball[s.ball.indexOf(pass) + 1].from)
    useRotations.setState({ selected: 'target' })
    get().edit({ x: 1.65, z: 1.15 })
    s = activeScenario(get()); pass = s.ball.find((b) => b.kind === 'pass')
    assert.deepEqual(s.setterTarget, { x: 1.65, z: 1.15 })
    assert.equal(pass.to.x, 1.65); assert.equal(pass.to.z, 1.15)
    assert.deepEqual(pass.to, s.ball[s.ball.indexOf(pass) + 1].from)
    const setter = s.tracks[s.secondContact.player].find((k) => k.time === s.secondContact.time)
    assert.equal(setter.x, 1.65); assert.equal(setter.z, 1.15)
    assert.equal(s.tactics.nextSetter, 'trent')
    assert.deepEqual(validateBundle(activeBundle(get())), [])
    assert.deepEqual(get().published, tactical)
    const draft = activeBundle(get()), baseIndex = tactical.plans.scenarios.findIndex((p) => p.rotation === 3 && p.serve === serve)
    const unchanged = structuredClone(draft)
    if (key === 'base') {
      assert.deepEqual(draft.plans.scenarios[baseIndex].alternates, tactical.plans.scenarios[baseIndex].alternates)
      unchanged.plans.scenarios[baseIndex] = structuredClone(tactical.plans.scenarios[baseIndex])
    } else unchanged.plans.scenarios[baseIndex].alternates[key] = structuredClone(tactical.plans.scenarios[baseIndex].alternates[key])
    assert.deepEqual(unchanged, tactical)
    const roundtrip = parseBundle(exportBundle(draft))
    get().importDraft(roundtrip)
    assert.equal(get().time, 0); assert.equal(get().editTime, 0); assert.equal(get().playing, false)
    assert.deepEqual(activeScenario(get()), s)
    const invalid = structuredClone(roundtrip)
    invalid.plans.scenarios[11].alternates.harryRight.tactics.nextSetter = 'nobody'
    get().importDraft(invalid)
    assert.match(get().error, /nextSetter/)
    assert.deepEqual(activeBundle(get()), roundtrip)
    get().resetDraft()
    assert.deepEqual(activeBundle(get()), tactical)
    assert.deepEqual(activeScenario(get()), key === 'base' ? tactical.plans.scenarios[baseIndex] : tactical.plans.scenarios[baseIndex].alternates[key])
  }
})
