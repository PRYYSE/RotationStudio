import { useRef } from 'react'
import { Line } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { sampleTrack } from '../lib/rotationModel'
import { stageOrder, stageTimes } from '../lib/strategyDraft'
import type { PlayerId, RotationKey } from '../lib/strategyDraft'

const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
function Bend({ point, index }: { point: { x: number; z: number }; index: number }) {
  const dragging = useRef(false)
  const finish = (e: ThreeEvent<PointerEvent>, cancel = false) => {
    if (!dragging.current) return
    e.stopPropagation(); dragging.current = false
    useStrategies.getState().endGesture(cancel)
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }
  return <mesh position={[point.x, .18, point.z]} rotation={[-Math.PI / 2, 0, 0]}
    onPointerDown={e => { e.stopPropagation(); dragging.current = true; useStrategies.getState().beginGesture(); (e.target as Element).setPointerCapture(e.pointerId) }}
    onPointerMove={e => {
      if (!dragging.current) return
      e.stopPropagation()
      const p = e.ray.intersectPlane(floor, new THREE.Vector3())
      if (!p) return
      const s = useRotations.getState(), studio = useStrategies.getState(), key = `${s.rotation}/${s.serve}` as RotationKey
      const bends = structuredClone(studio.working?.overrides[key]?.routes?.[studio.stage]?.[s.selected as PlayerId] ?? [])
      bends[index] = { x: Math.max(-4.5, Math.min(4.5, Math.round(p.x * 100) / 100)), z: Math.max(0, Math.min(12, Math.round(p.z * 100) / 100)) }
      studio.bend(key, s.selected, bends)
    }} onPointerUp={e => finish(e)} onPointerCancel={e => finish(e, true)}>
    <circleGeometry args={[.36, 32]} /><meshBasicMaterial color="#fff3c4" side={THREE.DoubleSide} depthTest={false} />
  </mesh>
}
export function StrategyRoute() {
  const s = useRotations(), studio = useStrategies(), scenario = activeScenario(s), bundle = activeBundle(s)
  if (!s.strategyMode || !studio.routeVisible || !scenario || !bundle || s.selected === 'target' || studio.stage === 'Start') return null
  const order = stageOrder(s.serve), times = stageTimes(scenario), previous = order[order.indexOf(studio.stage) - 1]
  const start = Math.max(times[previous], scenario.ball[0].start), end = times[studio.stage]
  const points = Array.from({ length: 90 }, (_, i) => { const p = sampleTrack(scenario.tracks[s.selected], start + (end - start) * i / 89); return new THREE.Vector3(p.x, .12, p.z) })
  const bends = studio.working?.overrides[`${s.rotation}/${s.serve}` as RotationKey]?.routes?.[studio.stage]?.[s.selected as PlayerId] ?? []
  return <group>
    <Line points={points} color={bundle.team.players.find(p => p.id === s.selected)!.color} lineWidth={4} depthTest={false} raycast={() => null} />
    {bends.map((point, i) => <Bend key={i} point={point} index={i} />)}
  </group>
}
