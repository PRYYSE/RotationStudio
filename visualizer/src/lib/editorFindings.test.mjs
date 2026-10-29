import {test} from 'node:test'
import assert from 'node:assert/strict'
import {scopeEditorFindings} from './editorFindings.ts'

test('editor retains every relevant root cause and case detail while excluding other rotations and serves',()=>{
  const group={code:'travel',category:'GEOMETRY_TIME',severity:'CAUTION',summary:'Travel',suggestedCheck:'Check time',source:'sampled-timeline',
    affectedCases:['1/us/left/normal','1/us/right/harry','2/us/left/normal','1/they/left/normal'],
    details:[{caseKey:'1/us/left/normal',message:'First leg'},{caseKey:'1/us/left/normal',message:'Second leg'},
      {caseKey:'1/us/right/harry',message:'Alternate leg'},{caseKey:'2/us/left/normal',message:'Other rotation'},{caseKey:'1/they/left/normal',message:'Other serve'}]}
  const input=[group,{...group,code:'other',affectedCases:['2/us/left/normal'],details:[]}], before=structuredClone(input)
  const result=scopeEditorFindings(input,'1/us')
  assert.equal(result.length,1)
  assert.deepEqual(result[0].affectedCases,['1/us/left/normal','1/us/right/harry'])
  assert.deepEqual(result[0].details.map(d=>d.message),['First leg','Second leg','Alternate leg'])
  assert.deepEqual(input,before)
})
