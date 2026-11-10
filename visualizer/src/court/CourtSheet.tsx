import { useEffect, useRef, type ReactNode } from 'react'
import { CourtIcon } from './CourtIcon'
export function CourtSheet({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}) {
  const host=useRef<HTMLElement>(null),close=useRef(onClose);close.current=onClose
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    host.current?.focus()
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close.current()} }
    window.addEventListener('keydown',key)
    return()=>{window.removeEventListener('keydown',key);previous?.focus()}
  },[])
  return <>
    <button className="cm-scrim" aria-label="Dismiss panel" onClick={onClose} />
    <aside className="cm-sheet" aria-label={title} ref={host} tabIndex={-1}>
      <div className="cm-sheet-head"><h2>{title}</h2><button className="cm-icon-button" aria-label="Close panel" onClick={onClose}><CourtIcon name="close" /></button></div>
      <div className="cm-sheet-body">{children}</div>
    </aside>
  </>
}
