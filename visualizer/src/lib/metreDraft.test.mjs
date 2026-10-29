import {test} from 'node:test'
import assert from 'node:assert/strict'
import {commitMetres} from './metreDraft.ts'

test('metre commits preserve signed decimals and zero, rejecting incomplete/nonfinite/out-of-court drafts',()=>{
  for(const [text,want] of [['-0.5',-.5],['-.25',-.25],['0',0],['0.0',0],['+0.5',.5],['1.25',1.25],['-4.5',-4.5]])
    assert.equal(commitMetres(text,-4.5,4.5),want)
  for(const text of ['','-','.','-.','1e2','Infinity','NaN','4.51','-4.51','0x1'])
    assert.equal(commitMetres(text,-4.5,4.5),null)
  assert.equal(commitMetres('-0.5',0,12),null)
  assert.equal(commitMetres('2.99',0,2.99),2.99)
  assert.equal(commitMetres('3',0,2.99),null)
})
