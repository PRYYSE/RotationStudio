import { useRef } from 'react'
import { Line } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { sampleTrack, selectScenario } from '../lib/rotationModel'
import { sourceEvents } from '../lib/strategyEvents'
import { routeBends } from '../lib/athletePlan'
import type { RotationKey } from '../lib/strategyDraft'

const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
function Handle({ point, index, targetId }: { point: { x: number; z: number }; index: number; targetId: string }) {
  const dragging = useRef(false)
  const finish = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    e.stopPropagation(); dragging.current = false
    useStrategies.getState().endGesture(e.type === 'pointercancel')
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }
  return <mesh name={`route-bend-${index}`} position={[point.x, .18, point.z]} rotation={[-Math.PI / 2, 0, 0]}
    onPointerDown={e => { e.stopPropagation(); dragging.current = true; useStrategies.getState().beginGesture(); (e.target as Element).setPointerCapture(e.pointerId) }}
    onPointerMove={e => {
      if (!dragging.current) return
      e.stopPropagation()
      const hit = e.ray.intersectPlane(floor, new THREE.Vector3()), r = useRotations.getState(), studio = useStrategies.getState()
      const scenario = activeScenario(r), source = studio.event?.source
      if (!hit || !scenario || !source) return
      const bends = routeBends(scenario, source, targetId, r.selected)
      bends[index] = { x: Math.max(-4.5, Math.min(4.5, Math.round(hit.x * 100) / 100)), z: Math.max(0, Math.min(9, Math.round(hit.z * 100) / 100)) }
      studio.bendAt(`${r.rotation}/${r.serve}` as RotationKey, r.selected, targetId, bends)
    }} onPointerUp={finish} onPointerCancel={finish}>
    <circleGeometry args={[.32, 24]} /><meshBasicMaterial color="#fff3c4" depthTest={false} side={THREE.DoubleSide} />
  </mesh>
}

export function DesktopStrategyRoute() {
  const r = useRotations(), studio = useStrategies(), scenario = activeScenario(r)
  if (!r.strategyMode || !studio.routeVisible || !scenario || !studio.event || !scenario.tracks[r.selected] || !r.published) return null
  const root = r.published.plans.scenarios.find(s => s.rotation === r.rotation && s.serve === r.serve)!
  const source = selectScenario(root, r.opponentAttack, r.firstTouch), events = sourceEvents(source)
  const index = events.findIndex(e => e.id === studio.event!.id), current = events[index]
  if (!current) return null
  const spans = [{ from: events[index - 1], to: current, direction: 'into' }, { from: current, to: events[index + 1], direction: 'out' }] as const
  return <group>{spans.map(({ from, to, direction }) => {
    if (!from || !to || to.time <= from.time) return null
    const points = Array.from({ length: 64 }, (_, i) => {
      const p = sampleTrack(scenario.tracks[r.selected], from.time + (to.time - from.time) * i / 63)
      return new THREE.Vector3(p.x, .12, p.z)
    })
    const tip = points[points.length - 1], before = points[points.length - 4]
    const handles = !r.playing && r.view === 'top' && studio.routeDirection === direction && from.time >= source.ball[0].start
      ? routeBends(scenario, source, to.id, r.selected) : []
    return <group key={direction}>
      <Line name={`route-${direction}`} points={points} color={direction === 'into' ? '#ffe2aa' : '#93e5d1'} lineWidth={3} depthTest={false} raycast={() => null} />
      <mesh position={[tip.x, .16, tip.z]} rotation={[Math.PI / 2, 0, -Math.atan2(tip.x - before.x, tip.z - before.z)]} raycast={() => null}>
        <coneGeometry args={[.14, .32, 3]} /><meshBasicMaterial color={direction === 'into' ? '#ffe2aa' : '#93e5d1'} depthTest={false} />
      </mesh>
      {handles.map((p, i) => <Handle key={`${to.id}/${i}`} point={p} index={i} targetId={to.id} />)}
    </group>
  })}</group>
}
