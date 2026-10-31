import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clearDragPreview, dragPreviewAt, showDragPreview } from '../three/dragPreview.ts'

test('temporary drag previews are per-player, transient and do not mutate input points', () => {
  const point = { x: 1.2, z: 5.6 }
  const other = { x: -1.1, z: 3.3 }
  showDragPreview('jaz', point)
  showDragPreview('georgia', other)
  assert.deepEqual(dragPreviewAt('jaz'), point)
  assert.deepEqual(dragPreviewAt('georgia'), other)
  clearDragPreview('jaz')
  assert.equal(dragPreviewAt('jaz'), undefined)
  assert.deepEqual(dragPreviewAt('georgia'), other)
  clearDragPreview('georgia')
  assert.equal(dragPreviewAt('georgia'), undefined)
})
