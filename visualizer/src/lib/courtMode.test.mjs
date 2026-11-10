import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialWorkspace, annotationScope, chronologicalPhases } from './courtMode.ts'
test('phone and standalone tablet default to court while Linux convertible stays Studio', () => {
  assert.equal(initialWorkspace('', null, 'Mozilla Android Mobile', 5), 'court')
  assert.equal(initialWorkspace('', null, 'Mozilla iPad', 5), 'court')
  assert.equal(initialWorkspace('', null, 'Mozilla Macintosh', 5), 'court')
  assert.equal(initialWorkspace('', null, 'Mozilla X11 Linux x86_64', 10), 'studio')
  assert.equal(initialWorkspace('?workspace=court', 'studio', 'X11 Linux', 10), 'court')
  assert.equal(initialWorkspace('', 'studio', 'Android', 5), 'studio')
  assert.equal(initialWorkspace('?mode=sets', 'court', 'Android', 5), 'studio')
  assert.equal(initialWorkspace('?review=reviews/test/v1/manifest.json', 'studio', 'Linux', 1), 'court')
})
test('notes isolate source changes and every rotation/serve/case/event', () => {
  const base = { source: 'sha256:one', strategy: 'saved-a', rotation: 1, serve: 'they', attack: 'left', touch: 'normal', event: 'Dig again' }
  const key = annotationScope(base)
  for (const [field, value] of Object.entries({source:'sha256:two', strategy:'saved-b',rotation:2,serve:'us',attack:'right',touch:'harry',event:'Set again'})) {
    assert.notEqual(annotationScope({...base,[field]:value}),key)
  }
})
test('phase rail keeps later contacts in chronological order', () => {
  const phases = [{label:'Set again',time:8},{label:'Start',time:0},{label:'Dig again',time:7}]
  assert.deepEqual(chronologicalPhases(phases).map(p=>p.label),['Start','Dig again','Set again'])
  assert.equal(phases[0].label,'Set again')
})
