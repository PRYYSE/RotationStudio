import { test } from 'node:test'
import assert from 'node:assert/strict'
import { coveragePolygonError, polygonArea, hexagonFromEllipse, addPolygonCorner } from './coveragePolygon.ts'
const coords = (x, z) => ({ x, z })

test('initial hexagon is valid and remains inside court', () => {
  const v = hexagonFromEllipse(coords(4, 8.8), .45, .2)
  assert.equal(v.length, 6)
  assert.equal(coveragePolygonError(v), null)
  assert.ok(v.every(x => x.x <= 4.5 && x.z <= 9))
})
test('thin offset lanes and concave shapes are valid', () => {
  assert.equal(coveragePolygonError([coords(3, .4), coords(3.25, .4), coords(3.25, 7.7), coords(3, 7.7)]), null)
  assert.equal(coveragePolygonError([coords(0, 0), coords(2, 0), coords(2, 2), coords(1, 1), coords(0, 2)]), null)
})
test('crossed or degenerate shapes are rejected', () => {
  assert.match(coveragePolygonError([coords(0, 0), coords(2, 2), coords(0, 2), coords(2, 0)]), /cross|area/)
  assert.match(coveragePolygonError([coords(0, 0), coords(0, 0), coords(1, 1)]), /apart/)
})
test('a single vertex move preserves every other vertex', () => {
  const v = hexagonFromEllipse(coords(0, 4.5), 2, 2)
  const next = structuredClone(v)
  next[2].x += .25
  assert.equal(coveragePolygonError(next), null)
  for (let i = 0; i < v.length; i++) if (i !== 2) assert.deepEqual(next[i], v[i])
})
test('inserting a corner keeps existing vertex coordinates and valid area', () => {
  const v = hexagonFromEllipse(coords(0, 4.5), 2, 2), next = addPolygonCorner(v)
  assert.equal(next.length, v.length + 1)
  assert.equal(coveragePolygonError(next), null)
  for (const original of v) assert.ok(next.some(p => p.x === original.x && p.z === original.z))
  assert.ok(polygonArea(next) > 0)
})
