import { useEffect, useRef, type RefObject } from 'react'
import type { InkTool } from './courtNotes'
/** Identity chips are tap targets, but never dead zones for court gestures. */
export function useCourtLabelGestures(host: RefObject<HTMLDivElement|null>, tool: InkTool, enabled: boolean, onSelect: (id:string)=>void) {
  const select=useRef(onSelect); select.current=onSelect
  useEffect(()=>{
    const root=host.current
    if(!enabled||!root||tool!=='navigate')return
    const active=new Map<number,{id:string|null;x:number;y:number;moved:boolean}>()
    const handle=(e:PointerEvent)=>{
      const canvas=root.querySelector('canvas');if(!canvas)return
      if((e as PointerEvent&{courtReplay?:boolean}).courtReplay)return
      if(e.type==='pointerdown'){
        const chip=(e.target as Element).closest<HTMLElement>('[data-cm-player]')
        if(!chip && e.target!==canvas)return
        active.set(e.pointerId,{id:chip?.dataset.cmPlayer??null,x:e.clientX,y:e.clientY,moved:false})
        if(active.size>1)for(const p of active.values())p.moved=true
        if(chip){
          e.preventDefault();e.stopImmediatePropagation()
          const clone=new PointerEvent('pointerdown',{pointerId:e.pointerId,pointerType:e.pointerType,isPrimary:e.isPrimary,clientX:e.clientX,clientY:e.clientY,button:e.button,buttons:e.buttons,bubbles:true})
          Object.defineProperty(clone,'courtReplay',{value:true});canvas.dispatchEvent(clone)
        }
      }
      const point=active.get(e.pointerId)
      if(!point)return
      if(e.type==='pointermove'&&Math.hypot(e.clientX-point.x,e.clientY-point.y)>8)point.moved=true
      if(e.type==='pointerup'||e.type==='pointercancel'){
        const tap=point.id&&!point.moved&&active.size===1&&e.type==='pointerup'
        active.delete(e.pointerId)
        if(tap)queueMicrotask(()=>select.current(point.id!))
      }
    }
    const events=['pointerdown','pointermove','pointerup','pointercancel'] as const
    for(const type of events)root.addEventListener(type,handle,{capture:true,passive:false})
    return()=>{for(const type of events)root.removeEventListener(type,handle,true)}
  },[host,tool,enabled])
}
