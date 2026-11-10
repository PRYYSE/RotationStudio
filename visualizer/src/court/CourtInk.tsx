import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Mark, InkTool, NotesController } from './courtNotes'
import { pointOnCourt, type Projection } from './CourtProjection'
/** Captures drawing before OrbitControls. Two fingers are replayed to the canvas
 * so pinch/pan remains available without mixing navigation into a stroke. */
export function CourtInk({host,projection,tool,notes,text}:{host:RefObject<HTMLDivElement|null>;projection:RefObject<Projection>;tool:InkTool;notes:NotesController;text:string}) {
  const [preview,setPreview]=useState<Mark|null>(null), current=useRef<Mark|null>(null)
  const latest=useRef({notes,text});latest.current={notes,text}
  useEffect(()=>{
    const root=host.current;if(!root||tool==='navigate')return
    const canvas=root.querySelector('canvas');if(!canvas)return
    const pointers=new Map<number,PointerEvent>();let navigating=false
    const replay=(e:PointerEvent,type=e.type)=>{
      const clone=new PointerEvent(type,{pointerId:e.pointerId,pointerType:e.pointerType,clientX:e.clientX,clientY:e.clientY,buttons:e.buttons,button:e.button,bubbles:true})
      Object.defineProperty(clone,'courtReplay',{value:true});canvas.dispatchEvent(clone)
    }
    const handle=(e:PointerEvent)=>{
      if((e as PointerEvent&{courtReplay?:boolean}).courtReplay || (e.target as Element).closest('button,input,select,textarea'))return
      const rect=root.getBoundingClientRect(),point=pointOnCourt(projection.current,e.clientX-rect.left,e.clientY-rect.top)
      if(e.type==='pointerdown'){
        pointers.set(e.pointerId,e)
        if(pointers.size===2){current.current=null;setPreview(null);navigating=true;for(const p of pointers.values())replay(p,'pointerdown');e.preventDefault();e.stopImmediatePropagation();return}
      }
      if(navigating){e.preventDefault();e.stopImmediatePropagation();replay(e);if(e.type==='pointerup'||e.type==='pointercancel'){pointers.delete(e.pointerId);if(!pointers.size)navigating=false}return}
      if(!pointers.has(e.pointerId))return
      e.preventDefault();e.stopImmediatePropagation()
      if(e.type==='pointerdown'&&point){
        root.setPointerCapture(e.pointerId)
        const effective=e.button===5?'erase':tool
        if(effective==='erase'){
          const closest=latest.current.notes.doc.marks.map(m=>({id:m.id,d:Math.min(...m.points.map(p=>Math.hypot(p.x-point.x,p.z-point.z)))})).sort((a,b)=>a.d-b.d)[0]
          if(closest&&closest.d<1.5)latest.current.notes.erase(closest.id)
          return
        }
        if(effective==='text'&&!latest.current.text.trim())return
        current.current={id:crypto.randomUUID(),tool:effective as Mark['tool'],points:[point],color:effective==='highlight'?'#ffe190':'#f4c69a',...(effective==='text'?{text:latest.current.text.trim()}: {})}
        setPreview({...current.current})
      }
      if(e.type==='pointermove'&&current.current&&point){
        const m=current.current
        if(m.tool==='arrow')m.points=[m.points[0],point]
        else if(m.tool!=='text'&&m.points.length<3000&&Math.hypot(point.x-m.points.at(-1)!.x,point.z-m.points.at(-1)!.z)>.035)m.points.push(point)
        setPreview({...m})
      }
      if(e.type==='pointerup'||e.type==='pointercancel'){
        pointers.delete(e.pointerId)
        if(current.current&&e.type!=='pointercancel')latest.current.notes.add(current.current)
        current.current=null;setPreview(null)
        if(root.hasPointerCapture(e.pointerId))root.releasePointerCapture(e.pointerId)
      }
    }
    const events=['pointerdown','pointermove','pointerup','pointercancel'] as const
    for(const type of events)root.addEventListener(type,handle,{capture:true,passive:false})
    return()=>{for(const type of events)root.removeEventListener(type,handle,true);current.current=null;setPreview(null)}
  },[host,projection,tool])
  return <svg className="cm-ink" aria-label={`${notes.doc.marks.length} local coaching marks`}>
    <defs><marker id="cm-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L8,3 z" fill="#f4c69a" /></marker></defs>
    {[...notes.doc.marks,...(preview?[preview]:[])].map(m=>m.tool==='text'
      ?<text key={m.id} data-cm-points={JSON.stringify(m.points)} fill={m.color} stroke="#202522" strokeWidth="3" paintOrder="stroke" fontSize="18" fontWeight="600">{m.text}</text>
      :<polyline key={m.id} data-cm-points={JSON.stringify(m.points)} fill="none" stroke={m.color} strokeWidth={m.tool==='highlight'?18:3} opacity={m.tool==='highlight'?.4:1} strokeLinecap="round" strokeLinejoin="round" markerEnd={m.tool==='arrow'?'url(#cm-arrow)':undefined} />)}
  </svg>
}
