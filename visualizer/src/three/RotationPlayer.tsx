import { useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Keyframe, Team } from '../lib/rotationTypes'
import { sampleTrack } from '../lib/rotationModel'
import { useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'

type Player = Team['players'][number]
const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
export function RotationPlayer({ player, track }: { player: Player; track: Keyframe[]; team: Team; rotation: number }) {
  const group = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const selected = useRotations((s) => s.selected === player.id)
  const dragging = useRef(false)
  useFrame(() => {
    const s = useRotations.getState()
    const p = sampleTrack(track, s.time)
    if (group.current) { group.current.position.set(p.x, 0, p.z); group.current.rotation.y = p.facing ?? 0 }
    const before = sampleTrack(track, Math.max(0, s.time - 0.03))
    const moving = Math.hypot(p.x - before.x, p.z - before.z) > 0.002
    const swing = moving ? Math.sin(s.time * 9) * 0.4 : 0
    if (leftLeg.current) leftLeg.current.rotation.x = swing
    if (rightLeg.current) rightLeg.current.rotation.x = -swing
    const raised = p.role === 'set' || p.role === 'block'
    if (leftArm.current) leftArm.current.rotation.x = raised ? -2.5 : -swing
    if (rightArm.current) rightArm.current.rotation.x = raised ? -2.5 : swing
  })
  const down = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const s = useRotations.getState()
    useRotations.setState({ selected: player.id })
    if (!s.editor) return
    if (s.view !== 'top') return
    dragging.current = true
    if (s.strategyMode) useStrategies.getState().beginGesture()
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    e.stopPropagation()
    const hit = e.ray.intersectPlane(floor, new THREE.Vector3())
    if (hit) useRotations.getState().edit({ x: Math.max(-4.5, Math.min(4.5, Math.round(hit.x * 100) / 100)), z: Math.max(0, Math.min(12, Math.round(hit.z * 100) / 100)) })
  }
  const up = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    dragging.current = false
    if (useRotations.getState().strategyMode) useStrategies.getState().endGesture(e.type === 'pointercancel')
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }
  const skin = '#e9bea5'
  return <group ref={group} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
    onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <ringGeometry args={[0.32, hovered || selected ? 0.5 : 0.4, 32]} />
      <meshBasicMaterial color={player.color} transparent opacity={0.8} />
    </mesh>
    <mesh position={[0, 1.13, 0]} castShadow>
      <boxGeometry args={[0.48, 0.56, 0.28]} />
      <meshStandardMaterial color={player.color} roughness={0.7} emissive={player.color} emissiveIntensity={hovered || selected ? .35 : .13} />
    </mesh>
    <mesh position={[0, 1.66, 0]} castShadow>
      <sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color={skin} roughness={0.9} />
    </mesh>
    <mesh position={[0, 1.79, 0]}><sphereGeometry args={[0.17, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#25202b" /></mesh>
    {[-1, 1].map((side) => <group key={side} ref={side < 0 ? leftArm : rightArm} position={[side * 0.32, 1.32, 0]} rotation={[0, 0, side * 0.12]}>
      <mesh position={[0, -0.25, 0]} castShadow><capsuleGeometry args={[0.075, 0.37, 4, 8]} /><meshStandardMaterial color={skin} /></mesh>
    </group>)}
    <mesh position={[0, 0.79, 0]}><boxGeometry args={[0.46, 0.23, 0.3]} /><meshStandardMaterial color="#16223b" /></mesh>
    {[-1, 1].map((side) => <group key={side} ref={side < 0 ? leftLeg : rightLeg} position={[side * 0.14, 0.7, 0]}>
      <mesh position={[0, -0.27, 0]} castShadow><capsuleGeometry args={[0.09, 0.4, 4, 8]} /><meshStandardMaterial color={skin} /></mesh>
      <mesh position={[0, -0.58, -0.04]} castShadow><boxGeometry args={[0.2, 0.13, 0.32]} /><meshStandardMaterial color="#f0f3ff" /></mesh>
    </group>)}
  </group>
}
