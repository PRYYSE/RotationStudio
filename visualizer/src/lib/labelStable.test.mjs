import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layoutDesktopLabels, layoutLabels } from '../three/labelLayout.ts'

const people = [
  { id: 'harry', x: 260, y: 220, width: 71, priority: 0 },
  { id: 'caleb', x: 280, y: 220, width: 69, priority: 1 },
  { id: 'trent', x: 300, y: 220, width: 70, priority: 2 },
  { id: 'logan', x: 320, y: 220, width: 72, priority: 3 },
  { id: 'georgia', x: 340, y: 220, width: 76, priority: 3 },
  { id: 'jaz', x: 360, y: 220, width: 53, priority: 3 }
]

test('desktop identity is anchored to its player, with no collision-induced teleporting', () => {
  const a = layoutDesktopLabels(people, 600, 450)
  assert.equal(a.length, 6)
  for (let i = 0; i < people.length; i++) {
    assert.equal(a[i].id, people[i].id)
    assert.equal(a[i].height, 17)
    assert.equal(a[i].compact, false)
    assert.ok(Math.abs(a[i].x + a[i].width / 2 - people[i].x) < 1e-7)
    assert.equal(a[i].y, people[i].y + 10)
  }
  // Moving any other player, changing priority or crowdedness must never
  // change the identity chip of a stationary athlete.
  const modified = people.map(p => ({ ...p, priority: 20, x: p.id === 'caleb' ? 501 : p.x }))
  const b = layoutDesktopLabels(modified, 600, 450)
  for (const p of people.filter(p => p.id !== 'caleb')) {
    assert.deepEqual(b.find(t => t.id === p.id), a.find(t => t.id === p.id))
  }
  const fractional = layoutDesktopLabels(people.map(p => ({ ...p, x: p.x + .42, y: p.y + .31 })), 600, 450)
  for (let i = 0; i < people.length; i++) {
    assert.ok(Math.abs(fractional[i].x - a[i].x - .42) < 1e-7)
    assert.ok(Math.abs(fractional[i].y - a[i].y - .31) < 1e-7)
  }
})

test('desktop tags remain bounded near viewport edges; existing phone collision algorithm is unchanged', () => {
  const partial = [
    { id: 'a', x: -20, y: 12, width: 100, priority: 0 },
    { id: 'b', x: 580, y: 300, width: 120, priority: 1 },
    { id: 'c', x: 300, y: 450, width: 80, priority: 2 }
  ]
  const tags = layoutDesktopLabels(partial, 600, 450)
  assert.deepEqual(tags.map(t => t.id), ['a', 'b'])
  assert.ok(tags.every(t => t.x >= 3 && t.x + t.width <= 597))
  const phone = layoutLabels(people, 600, 450)
  assert.equal(phone.length, 6)
  assert.equal(new Set(phone.map(t => t.id)).size, 6)
})
