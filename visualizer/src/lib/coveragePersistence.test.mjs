import { test } from 'node:test'
import assert from 'node:assert/strict'
import { exportStrategy, parseStrategy, MAX_STRATEGY_BYTES, PLAYER_IDS, STAGES } from './strategyDraft.ts'

const point = (x, z) => ({ x, z })
const zone = vertices => ({ role: 'receive', radiusX: 1, radiusZ: 1, ...(vertices ? { vertices } : {}) })
const source = () => ({ kind: 'rotation-studio-strategy', schemaVersion: 2,
  id: 'polygon-fixture', name: 'Polygon fixture', author: 'Test coach', baseRevision: '8c0fb5d', overrides: {} })

test('legacy ellipse and exact polygon survive lossless export and import', () => {
  const draft = source()
  const vertices = [point(-1, 1), point(1, 1), point(.7, 4), point(-.6, 5), point(-1.4, 3)]
  draft.overrides['1/they'] = { coverage: { Receive: { harry: zone(), caleb: zone(vertices) } } }
  const restored = parseStrategy(exportStrategy(draft))
  assert.equal(restored.overrides['1/they'].coverage.Receive.harry.vertices, undefined)
  assert.deepEqual(restored.overrides['1/they'].coverage.Receive.caleb.vertices, vertices)
})
test('self-crossed polygons cannot corrupt a saved strategy', () => {
  const draft = source()
  draft.overrides['1/they'] = { coverage: { Receive: { caleb: zone([point(-1,1),point(1,3),point(-1,3),point(1,1)]) } } }
  assert.throws(() => exportStrategy(draft), /cross or touch/)
})
test('a complete six-rotation coverage library may exceed the old 100 KB ceiling', () => {
  const draft = source()
  const polygon = Array.from({ length: 12 }, (_, i) => {
    const a = i / 12 * Math.PI * 2
    return point(+(Math.cos(a) * 1.5).toFixed(4), +(4.5 + Math.sin(a) * 1.5).toFixed(4))
  })
  for (let r = 1; r <= 6; r++) for (const serve of ['they', 'us']) {
    const coverage = Object.fromEntries(STAGES.map(stage => [stage,
      Object.fromEntries(PLAYER_IDS.map(player => [player, zone(polygon)]))]))
    draft.overrides[`${r}/${serve}`] = { coverage }
  }
  const saved = exportStrategy(draft)
  assert.ok(Buffer.byteLength(saved) > 100_000, 'regression fixture must exceed old limit')
  assert.ok(Buffer.byteLength(saved) < MAX_STRATEGY_BYTES)
  const restored = parseStrategy(saved)
  assert.deepEqual(restored.overrides, draft.overrides)
})
