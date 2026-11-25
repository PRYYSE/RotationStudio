import { useRef, useState, type PointerEvent } from 'react'
import type { Moment, Spot } from '../domain/contracts'

export type Marker = { slot: string; name: string; appearance?: string }
type Props = {
  players: Marker[]; positions: Record<string, Spot>; slot: string; route: Spot[];
  ball?: Spot; coverage?: Moment['athletes'][number]['coverage']; exhibit?: boolean; onSelect(slot: string): void; onMove(slot: string, position: Spot): void;
}
const metres = (value: number) => Math.round(value * 100) / 100
const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n))

export function AuthoringCourt({ players, positions, slot, route, ball, coverage, exhibit, onSelect, onMove }: Props) {
  const court = useRef<SVGSVGElement>(null)
  const gesture = useRef<{ pointer: number; slot: string; downX: number; downY: number; marker: boolean } | null>(null)
  const [drag, setDrag] = useState<{ slot: string; position: Spot }>()
  const coordinates = (event: PointerEvent<SVGSVGElement>): Spot | undefined => {
    const matrix = court.current?.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    return { x: metres(clamp(point.x, -4.5, 4.5)), z: metres(clamp(point.y, 0, 12)) }
  }
  const start = (event: PointerEvent<SVGSVGElement>) => {
    if (exhibit || !event.isPrimary || event.button !== 0) return
    const marker = (event.target as Element).closest('[data-slot]')?.getAttribute('data-slot')
    if (!marker && !slot) return
    if (marker) onSelect(marker)
    gesture.current = { pointer: event.pointerId, slot: marker || slot, downX: event.clientX, downY: event.clientY, marker: !!marker }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const update = (event: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current
    if (!g || event.pointerId !== g.pointer) return
    if (g.marker && Math.hypot(event.clientX - g.downX, event.clientY - g.downY) < 5) return
    const position = coordinates(event)
    if (position) setDrag({ slot: g.slot, position })
  }
  const clear = () => { gesture.current = null; setDrag(undefined) }
  const finish = (event: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current
    if (!g || event.pointerId !== g.pointer) return
    clear()
    if (g.marker && Math.hypot(event.clientX - g.downX, event.clientY - g.downY) < 5) return
    const position = coordinates(event)
    if (position && (positions[g.slot].x !== position.x || positions[g.slot].z !== position.z)) onMove(g.slot, position)
  }
  const visibleRoute = route.length && positions[slot] ? [...route, drag?.slot === slot ? drag.position : positions[slot]] : []
  return <svg ref={court} viewBox="-5.6 -9.9 11.2 22.8" className="s1-court" aria-label="Authoring court"
    onPointerDown={start} onPointerMove={update} onPointerUp={finish} onPointerCancel={clear} onLostPointerCapture={clear}>
    <rect className="s1-court-away" x="-4.5" y="-9" width="9" height="9" />
    <rect className="s1-court-home" x="-4.5" y="0" width="9" height="9" />
    <path className="s1-court-lines" d="M-4.5,-9 H4.5 V9 H-4.5 Z M-4.5,-3 H4.5 M-4.5,3 H4.5" />
    <path className="s1-net" d="M-5.1,0 H5.1" />
    <text className="s1-side" x="0" y="-7.6">OPPONENTS</text>
    <text className="s1-side" x="0" y="11.6">OUR END</text>
    {coverage?.kind === 'ellipse' && <ellipse className="s1-coverage" cx={coverage.center.x} cy={coverage.center.z}
      rx={coverage.radiusX} ry={coverage.radiusZ} />}
    {coverage?.kind === 'polygon' && <polygon className="s1-coverage" points={coverage.vertices.map(p => p.x + ',' + p.z).join(' ')} />}
    {visibleRoute.length > 0 && <polyline className="s1-route" points={visibleRoute.map(p => p.x + ',' + p.z).join(' ')} />}
    {players.map(p => {
      const at = drag?.slot === p.slot ? drag.position : positions[p.slot]
      return at ? <g key={p.slot} data-slot={p.slot} data-x={at.x} data-z={at.z} className={slot === p.slot ? 's1-marker selected' : 's1-marker'} transform={`translate(${at.x} ${at.z})`}>
        <circle r=".58" fill={p.appearance ?? '#a6dded'} />
        <text y=".95">{p.name.length > 17 ? p.name.slice(0, 16) + '…' : p.name}</text>
      </g> : null
    })}
    {ball && <circle className="s1-ball" cx={ball.x} cy={ball.z} r=".16" />}
  </svg>
}
