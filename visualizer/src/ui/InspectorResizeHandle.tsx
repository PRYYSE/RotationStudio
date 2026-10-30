import { useState } from 'react'

export function InspectorResizeHandle({ onResize }: { onResize: (width: number) => void }) {
  const [width, setWidth] = useState(() => Math.min(520, Math.max(370, window.innerWidth * .27)))
  const update = (next: number) => {
    const value = Math.min(520, Math.max(370, next))
    setWidth(value); onResize(value)
  }
  return <div className="inspector-resizer" role="separator" aria-label="Resize inspector" aria-orientation="vertical" aria-valuemin={370} aria-valuemax={520} aria-valuenow={Math.round(width)} tabIndex={0}
    title="Drag to resize inspector · arrow keys adjust width"
    onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault() }}
    onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) update(window.innerWidth - e.clientX) }}
    onPointerUp={e => e.currentTarget.releasePointerCapture(e.pointerId)}
    onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); update(width + (e.key === 'ArrowLeft' ? 20 : -20)) } }} />
}
