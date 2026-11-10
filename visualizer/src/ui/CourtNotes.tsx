import { useRef, useState } from 'react'
import { useCourt } from '../state/courtStore'
import { useRotations } from '../state/rotationStore'
import { courtScope } from '../lib/courtContext'
export function exportCourtNotes() {
  const blob=new Blob([JSON.stringify({schemaVersion:1,notes:useCourt.getState().marks},null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='rotationstudio-court-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
export function CourtNotes() {
  const c=useCourt(),s=useRotations(),scope=courtScope(),file=useRef<HTMLInputElement>(null)
  const [copySource,setCopySource]=useState('')
  const [error,setError]=useState(''),[edit,setEdit]=useState<string|null>(null),[text,setText]=useState('')
  const notes=c.marks.filter(m=>m.scope===scope)
  const otherSources=[...new Set(c.marks.filter(m=>m.scope!==scope && JSON.stringify(JSON.parse(m.scope).slice(1))===JSON.stringify(JSON.parse(scope).slice(1))).map(m=>m.scope))]
  return <section className="court-notes">
    {c.recovery&&<button onClick={()=>{const url=URL.createObjectURL(new Blob([c.recovery!],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download='court-notes-recovery.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}>Export original recovery data</button>}
    <p>Your notes stay in this browser. Export/import to move them to another device or explicitly share them. Links alone do not include private marks.</p>
    <div className="court-row"><button onClick={exportCourtNotes}>Export notes</button><button onClick={()=>file.current?.click()}>Import notes</button><button aria-pressed={c.visible} onClick={()=>useCourt.setState({visible:!c.visible})}>{c.visible?'Hide marks':'Show marks'}</button></div>
    <input ref={file} hidden type="file" accept="application/json,.json" onChange={async e=>{try{const f=e.target.files?.[0];if(!f)return;if(f.size>2_000_000)throw new Error('Notes file exceeds 2 MB.');c.importNotes(JSON.parse(await f.text()));setError('')}catch(err){setError(String(err instanceof Error?err.message:err))}finally{e.target.value=''}}}/>
    {(error||c.storageError)&&<p role="alert">{error||c.storageError}</p>}
    <p>{notes.length} marks in this source / rotation / serve / variation. Moment marks appear only at their saved time.</p>
    {otherSources.length>0&&<details><summary>Copy notes from another source revision</summary><p>Copies keep their exact times. Review each mark against this version; no tactical meaning is inferred.</p><select aria-label="Source revision to copy" value={copySource} onChange={e=>setCopySource(e.target.value)}><option value="">Choose source</option>{otherSources.map(key=><option key={key} value={key}>{JSON.parse(key)[0]}</option>)}</select><button disabled={!copySource} onClick={()=>{if(confirm('Copy these notes to this source? Originals are kept; check every moment.'))c.change([...c.marks,...c.marks.filter(m=>m.scope===copySource).map(m=>({...m,id:crypto.randomUUID(),scope}))])}}>Copy to this revision</button></details>}
    {!notes.length&&<p>No notes yet. Choose Annotate, then draw on the court.</p>}
    {notes.map(n=><article key={n.id} className="court-note-row">
      <button onClick={()=>s.seek(n.time)}>{n.tool==='text'?n.text:`${n.tool} mark`} <small>{n.whole?'Whole rotation':`${n.time.toFixed(2)}s`} · {n.owner}</small></button>
      <button onClick={()=>{setEdit(n.id);setText(n.text)}}>Edit</button>
      <button aria-label={`Delete ${n.tool} mark`} onClick={()=>{if(confirm('Delete this mark?'))c.change(c.marks.filter(m=>m.id!==n.id))}}>Delete</button>
      {edit===n.id&&<div className="court-note-edit"><textarea aria-label="Edit note text" maxLength={2000} value={text} onChange={e=>setText(e.target.value)}/><label><input type="checkbox" checked={n.whole} onChange={e=>c.change(c.marks.map(m=>m.id===n.id?{...m,whole:e.target.checked}:m))}/>Whole rotation</label><button onClick={()=>{c.change(c.marks.map(m=>m.id===n.id?{...m,text}:m));setEdit(null)}}>Save note</button><button onClick={()=>setEdit(null)}>Cancel</button></div>}
    </article>)}
    {notes.length>0&&<button onClick={()=>{if(confirm('Clear notes only for this source, rotation, serve and variation?'))c.change(c.marks.filter(n=>n.scope!==scope))}}>Clear this case’s notes</button>}
    <div className="court-row"><button disabled={!c.undo.length} onClick={c.undoMark}>Undo</button><button disabled={!c.redo.length} onClick={c.redoMark}>Redo</button></div>
  </section>
}
export function DrawingTools() {
  const c=useCourt()
  return <div className="court-drawing" aria-label="Drawing tools">
    <div className="court-row">{(['pen','arrow','circle','highlight','text','erase'] as const).map(tool=><button key={tool} aria-pressed={c.tool===tool} onClick={()=>useCourt.setState({tool})}>{tool[0].toUpperCase()+tool.slice(1)}</button>)}<button disabled={!c.undo.length} onClick={c.undoMark}>Undo</button><button disabled={!c.redo.length} onClick={c.redoMark}>Redo</button></div>
    <div className="court-row"><select aria-label="Note scope" value={c.whole?'whole':'moment'} onChange={e=>useCourt.setState({whole:e.target.value==='whole'})}><option value="moment">This exact moment</option><option value="whole">Whole rotation</option></select>{c.tool==='text'&&<input aria-label="Text to place on court" maxLength={2000} placeholder="Write a note, then tap court" value={c.text} onChange={e=>useCourt.setState({text:e.target.value})}/>}<button onClick={()=>useCourt.setState({annotate:false,pending:null})}>Navigate</button></div>
    <small>{c.storageError||'Local notes · one finger / pen draws; two fingers pan + pinch'}</small>
  </div>
}
