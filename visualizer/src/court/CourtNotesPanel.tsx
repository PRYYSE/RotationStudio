import { useRef, useState } from 'react'
import type { NotesController, InkTool } from './courtNotes'
import { CourtIcon } from './CourtIcon'
import type { IconName } from './CourtIcon'
const tools:[InkTool,IconName,string][]=[['navigate','view','Navigate'],['pen','pen','Draw'],['arrow','arrow','Arrow'],['highlight','highlight','Highlight'],['text','text','Text'],['erase','erase','Erase']]
export function CourtNotesPanel({notes,tool,onTool,text,onText,onDraw,onShare}:{notes:NotesController;tool:InkTool;onTool:(tool:InkTool)=>void;text:string;onText:(s:string)=>void;onDraw:()=>void;onShare:()=>void}) {
  const file=useRef<HTMLInputElement>(null),[message,setMessage]=useState('')
  return <>
    <p className="cm-muted">Local to this exact source, strategy, rotation, serve, case and phase. Drawings sit on the court plane and follow the camera. They never edit tactics.</p>
    <div className="cm-draw-tools" role="group" aria-label="Annotation tool">{tools.map(([id,icon,label])=><button key={id} aria-pressed={tool===id} onClick={()=>onTool(id)}><CourtIcon name={icon}/>{label}</button>)}</div>
    {tool==='text'&&<label className="cm-field">Text to place<input maxLength={200} value={text} onChange={e=>onText(e.target.value)} placeholder="e.g. Call early" /></label>}
    <div className="cm-actions"><button onClick={onDraw}>Draw on court</button><button disabled={!notes.canUndo} onClick={notes.undo}>Undo</button><button disabled={!notes.canRedo} onClick={notes.redo}>Redo</button></div>
    <p className="cm-muted">One finger or pen draws. Two fingers navigate. Select Navigate to orbit with one finger. Erase taps a mark near its path.</p>
    <label className="cm-field">Phase note<textarea aria-label="Local phase note" maxLength={20_000} rows={5} placeholder="What should we change or explain?" value={notes.doc.note} onChange={e=>notes.setNote(e.target.value)} /></label>
    <p className="cm-save-state" role="status">{notes.error||'Saved in this browser · not synced'}</p>
    <div className="cm-actions"><button onClick={notes.export}>Export notes &amp; marks</button><button onClick={()=>file.current?.click()}>Import notes</button></div>
    <button className="cm-wide" onClick={onShare}>Review &amp; share exact proposal</button>
    <input ref={file} type="file" hidden accept=".json" aria-label="Import local phase notes" onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{if(f.size>1_000_000)throw new Error('Notes file is too large.');notes.import(await f.text());setMessage('Imported notes for this exact phase.')}catch(e){setMessage(String(e))}}}/>
    {message&&<p role="status">{message}</p>}
  </>
}
