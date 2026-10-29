import { useRef } from 'react'
import { Line } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { sampleTrack, selectScenario } from '../lib/rotationModel'
import { laterDefendTime, stageOrder, stageTimes } from '../lib/strategyDraft'
import { resolveStrategyRotation } from '../lib/strategyOverlay'
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
      const scenario = activeScenario(s)!
      const effective = studio.working ? resolveStrategyRotation(studio.working, scenario) : null
      const bends = structuredClone((studio.laterDefend ? effective?.laterDefend?.routes?.[s.selected as PlayerId] : effective?.routes?.[studio.stage]?.[s.selected as PlayerId]) ?? [])
      bends[index] = { x: Math.max(-4.5, Math.min(4.5, Math.round(p.x * 100) / 100)), z: Math.max(0, Math.min(12, Math.round(p.z * 100) / 100)) }
      studio.bend(key, s.selected, bends)
    }} onPointerUp={e => finish(e)} onPointerCancel={e => finish(e, true)}>
    <circleGeometry args={[.36, 32]} /><meshBasicMaterial color="#fff3c4" side={THREE.DoubleSide} depthTest={false} />
  </mesh>
}
export function StrategyRoute() {
  const s = useRotations(), studio = useStrategies(), scenario = activeScenario(s), bundle = activeBundle(s)
  if (!s.strategyMode || !studio.routeVisible || !scenario || !bundle) return null
  const order = stageOrder(s.serve), times = stageTimes(scenario), previous = order[order.indexOf(studio.stage) - 1]
  const later = studio.laterDefend && s.serve === 'us' && studio.stage === 'Defend'
  const end = later ? laterDefendTime(scenario)! : times[studio.stage]
  const start = later ? times.Attack : studio.stage === 'Start' ? end : Math.max(times[previous], scenario.ball[0].start)
  const root = s.published?.plans.scenarios.find(v => v.rotation === s.rotation && v.serve === s.serve)
  if (!root) return null
  const source = selectScenario(root, s.opponentAttack, s.firstTouch)
  const target = s.selected === 'target', ghost = target ? source.setterTarget : sampleTrack(source.tracks[s.selected], end)
  const points = (base = false) => Array.from({ length: 90 }, (_, i) => {
    const p = sampleTrack((base ? source : scenario).tracks[s.selected], start + (end - start) * i / 89)
    return new THREE.Vector3(p.x, base ? .08 : .12, p.z)
  })
  const effective = studio.working ? resolveStrategyRotation(studio.working, scenario) : null
  const bends = (later ? effective?.laterDefend?.routes?.[s.selected as PlayerId] : effective?.routes?.[studio.stage]?.[s.selected as PlayerId]) ?? []
  return <group>
    <mesh name="strategy-v3-ghost" position={[ghost.x, .09, ghost.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[.36, .46, 40]} /><meshBasicMaterial color="#dbe9ff" transparent opacity={.35} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
    {!target && end > start && <>
      <Line name="strategy-current-path" points={points()} color={bundle.team.players.find(p => p.id === s.selected)!.color} lineWidth={3} depthTest={false} raycast={() => null} />
      <Line name="strategy-v3-path" points={points(true)} color="#dbe9ff" lineWidth={1.5} transparent opacity={.3} raycast={() => null} />
      {bends.map((point, i) => <Bend key={i} point={point} index={i} />)}
    </>}
  </group>
}
