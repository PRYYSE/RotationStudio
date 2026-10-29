import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layoutLabels } from '../three/labelLayout.ts'

test('screen tags pack deterministically at every acceptance viewport, even at coincident feet', () => {
  for (const [width, height] of [[1040, 560], [390, 390], [375, 360], [768, 550], [490, 200]]) {
    const labels = ['Harry', 'Caleb', 'Trent', 'Logan', 'Georgia', 'Jaz'].map((name, i) => ({
      id: name.toLowerCase(), x: width / 2 + i, y: height / 2, width: name.length * 7 + 48,
      priority: i === 3 ? 0 : i + 1,
    }))
    const result = layoutLabels(labels, width, height)
    assert.deepEqual(result, layoutLabels(labels, width, height))
    assert.equal(result.length, 6)
    for (const a of result) {
      assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.width <= width && a.y + a.height <= height)
      for (const b of result.filter(b => b.id !== a.id)) {
        assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)
      }
    }
  }
})

test('tags avoid the gold target without moving source anchors', () => {
  const anchors = [{id:'harry',x:180,y:180,width:100,priority:0}]
  const before = JSON.stringify(anchors), target = {x:140,y:140,width:80,height:80}
  const [tag] = layoutLabels(anchors,375,390,[target])
  assert.ok(tag.x + tag.width <= target.x || tag.x >= 220 || tag.y + tag.height <= target.y || tag.y >= 220)
  assert.equal(JSON.stringify(anchors), before)
})
