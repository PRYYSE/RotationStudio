import { useMemo, useState } from 'react'
import type { Spot } from '../lib/rotationTypes'
import { downloadCourtFile } from '../lib/courtMode'
export type InkTool = 'navigate'|'pen'|'arrow'|'highlight'|'text'|'erase'
export type Mark = {id:string;tool:Exclude<InkTool,'navigate'|'erase'>;points:Spot[];text?:string;color:string}
export type CourtNotes = {kind:'court-notes';schemaVersion:1;scope:string;note:string;marks:Mark[]}
export function parseCourtNotes(text:string,scope:string):CourtNotes {
  if(text.length>1_000_000)throw new Error('Notes file is too large.')
  const d=JSON.parse(text) as CourtNotes
  if(d.kind!=='court-notes'||d.schemaVersion!==1||d.scope!==scope||typeof d.note!=='string'||d.note.length>20_000||!Array.isArray(d.marks)||d.marks.length>500)throw new Error('Notes belong to another source, strategy, case or phase, or use an unsupported format.')
  for(const m of d.marks)if(!m || typeof m.id!=='string'||!['pen','arrow','highlight','text'].includes(m.tool)||!/^#[a-fA-F0-9]{6}$/.test(m.color)||!Array.isArray(m.points)||m.points.length<1||m.points.length>3000||m.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.abs(p.x)>30||Math.abs(p.z)>30)||(m.text!==undefined&&(typeof m.text!=='string'||m.text.length>200)))throw new Error('Invalid court drawing.')
  return d
}
const keyFor=(scope:string)=>'court-mode-notes-v1:'+scope
export function useCourtNotes(scope:string) {
  const loaded=useMemo(()=>{
    const empty:CourtNotes={kind:'court-notes',schemaVersion:1,scope,note:'',marks:[]}
    try { const raw=localStorage.getItem(keyFor(scope)); return {doc:raw?parseCourtNotes(raw,scope):empty,error:''} }
    catch {return {doc:empty,error:'Existing local notes could not be read. They have been preserved. Export new notes to keep them.'}}
  },[scope])
  const [state,setState]=useState({scope,doc:loaded.doc,past:[] as CourtNotes[],future:[] as CourtNotes[],error:loaded.error})
  const current=state.scope===scope?state:{scope,doc:loaded.doc,past:[],future:[],error:loaded.error}
  const store=(doc:CourtNotes,past:CourtNotes[],future:CourtNotes[])=>{
    let error=loaded.error
    try {if(loaded.error)throw new Error(loaded.error); const json=JSON.stringify(doc); parseCourtNotes(json,scope); localStorage.setItem(keyFor(scope),json)}
    catch {error=loaded.error||'Could not save local notes. Export them before leaving this page.'}
    setState({scope,doc,past,future,error})
  }
  const update=(doc:CourtNotes)=>store(doc,[...current.past.slice(-39),current.doc],[])
  return {doc:current.doc,error:current.error,canUndo:!!current.past.length,canRedo:!!current.future.length,
    setNote:(note:string)=>update({...current.doc,note}),
    add:(mark:Mark)=>update({...current.doc,marks:[...current.doc.marks,mark]}),
    erase:(id:string)=>update({...current.doc,marks:current.doc.marks.filter(m=>m.id!==id)}),
    undo:()=>{const doc=current.past.at(-1);if(doc)store(doc,current.past.slice(0,-1),[current.doc,...current.future])},
    redo:()=>{const doc=current.future[0];if(doc)store(doc,[...current.past,current.doc],current.future.slice(1))},
    export:()=>downloadCourtFile(JSON.stringify(current.doc,null,2),'court-notes.json'),
    import:(text:string)=>update(parseCourtNotes(text,scope)),
  }
}
export type NotesController = ReturnType<typeof useCourtNotes>
