import {test} from 'node:test'
import assert from 'node:assert/strict'
import {editorZoomDistance, EDITOR_TARGET, EDITOR_MIN_DISTANCE, EDITOR_MAX_DISTANCE} from './editorZoom.ts'
test('edit zoom targets our half, clamps both limits and Fit restores aspect-fitted distance',()=>{
  assert.deepEqual(EDITOR_TARGET,[0,0,4.5])
  assert.ok(editorZoomDistance(20,'in',30)<20);assert.ok(editorZoomDistance(20,'out',30)>20)
  assert.equal(editorZoomDistance(7,'in',30),EDITOR_MIN_DISTANCE)
  assert.equal(editorZoomDistance(85,'out',30),EDITOR_MAX_DISTANCE)
  assert.equal(editorZoomDistance(7,'fit',30),30)
})
