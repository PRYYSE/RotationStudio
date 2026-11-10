import { create } from 'zustand'
import { initialWorkspace, reviewIdFrom, validateNotes, type Workspace, type Mark, type ReviewEntry } from '../lib/courtMode'
const NOTES = 'rotationstudio-court-notes-v1', PREF = 'rotationstudio-workspace-v1'
let saved: string|null = null, marks:Mark[] = [], storageError = '', recovery: string|null = null
try { saved=localStorage.getItem(PREF); const raw=localStorage.getItem(NOTES); if(raw) { recovery=raw; marks=validateNotes(JSON.parse(raw)); recovery=null } }
catch { storageError='Notes could not be read. Original notes are protected. Export recovery data and new work before leaving.' }
type State = {
  workspace:Workspace; setWorkspace:(mode:Workspace,persist?:boolean)=>void
  reviewId:string|null; reviewEntry:ReviewEntry|null; reviewError:string; reviewLoading:boolean; reviewServes:string[]
  immersive:boolean; annotate:boolean; tool:Mark['tool']|'erase'; whole:boolean; text:string; visible:boolean; reset:number; freeOrbit:boolean
  recovery:string|null; marks:Mark[]; redo:Mark[][]; undo:Mark[][]; storageError:string; pending:Mark|null
  change:(marks:Mark[])=>void; undoMark:()=>void; redoMark:()=>void; importNotes:(value:unknown)=>void
}
function save(marks:Mark[]) {
  if(recovery)return 'Unsaved changes — original unreadable notes are protected. Export recovery and new work.'
  try { localStorage.setItem(NOTES,JSON.stringify({schemaVersion:1,notes:marks})); return '' }
  catch { return 'Unsaved changes — browser storage unavailable or full. Export notes now.' }
}
export const useCourt = create<State>((set,get)=>({
  workspace:initialWorkspace(navigator.userAgent,window.location.search,saved,/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints>1),
  setWorkspace:(workspace,persist=true)=>{
    set({workspace,annotate:false,immersive:false})
    if(persist) { try{ localStorage.setItem(PREF,workspace) }catch{/* Session choice still works. */} }
  },
  reviewId:reviewIdFrom(window.location.search),reviewEntry:null,reviewError:'',reviewLoading:false,reviewServes:[],
  immersive:false,annotate:false,tool:'pen',whole:false,text:'',visible:true,reset:0,freeOrbit:false,
  recovery,marks,redo:[],undo:[],storageError,pending:null,
  change:marks=>{const s=get();try{validateNotes({schemaVersion:1,notes:marks})}catch(e){set({storageError:String(e instanceof Error?e.message:e)});return} set({marks,undo:[...s.undo.slice(-39),s.marks],redo:[],storageError:save(marks)})},
  undoMark:()=>{const s=get(),marks=s.undo.at(-1);if(marks)set({marks,undo:s.undo.slice(0,-1),redo:[...s.redo,s.marks],storageError:save(marks)})},
  redoMark:()=>{const s=get(),marks=s.redo.at(-1);if(marks)set({marks,redo:s.redo.slice(0,-1),undo:[...s.undo,s.marks],storageError:save(marks)})},
  importNotes:value=>{const incoming=validateNotes(value),old=get().marks;const ids=new Set(incoming.map(n=>n.id));const merged=[...old.filter(n=>!ids.has(n.id)),...incoming];validateNotes({schemaVersion:1,notes:merged});get().change(merged)},
}))
