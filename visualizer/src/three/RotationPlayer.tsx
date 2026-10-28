import { useRef, useState } from 'react'
import { Html, Line } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Keyframe, Team } from '../lib/rotationTypes'
import { sampleTrack, positionOf, isFront } from '../lib/rotationModel'
import { useRotations } from '../state/rotationStore'

type Player = Team['players'][number]
const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
export function RotationPlayer({ player, track, team, rotation }: { player: Player; track: Keyframe[]; team: Team; rotation: number }) {
  const group = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const labels = useRotations((s) => s.labels)
  const view = useRotations((s) => s.view)
  const selected = useRotations((s) => s.editor && s.selected === player.id)
  const dragging = useRef(false)
  const position = positionOf(team, rotation, player.id)
  // A legal overlap-safe stack can place adjacent athletes only ~1m apart.
  // Offset nameplates from bodies (not player positions) to keep the six
  // identities readable in top-down/mobile views without changing tactics.
  const labelOffset: Record<number, [number, number, number]> = {
    1: [0.65, 0.07, 0.62], 2: [2.50, 0.07, 0.42],
    3: [0, 0.07, 1.15], 4: [-1.52, 0.07, 0.42],
    5: [-0.70, 0.07, 0.65], 6: [0, 0.07, 0.95],
  }
  const labelPosition: [number, number, number] = view === 'front' || view === 'side' ? [0, 0.05, 0] : labelOffset[position]
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
    if (!s.editor) return
    useRotations.setState({ selected: player.id })
    if (s.view !== 'top') return
    dragging.current = true
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    e.stopPropagation()
    const hit = e.ray.intersectPlane(floor, new THREE.Vector3())
    if (hit) useRotations.getState().edit({ x: Math.round(hit.x * 100) / 100, z: Math.round(hit.z * 100) / 100 })
  }
  const up = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    dragging.current = false
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }
  const skin = '#e9bea5'
  const jersey = hovered || selected ? '#e0f1ff' : player.color
  return <group ref={group} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
    onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <ringGeometry args={[0.32, hovered || selected ? 0.5 : 0.4, 32]} />
      <meshBasicMaterial color={player.color} transparent opacity={0.8} />
    </mesh>
    <mesh position={[0, 1.13, 0]} castShadow>
      <boxGeometry args={[0.48, 0.56, 0.28]} />
      <meshStandardMaterial color={jersey} roughness={0.7} emissive={player.color} emissiveIntensity={0.13} />
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
    {labels && view !== 'front' && view !== 'side' && <Line points={[[0, 0.085, 0], labelPosition]} color={player.color} transparent opacity={0.42} lineWidth={1} />}
    {labels && <Html center position={labelPosition as [number, number, number]} style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
      <span className={`athlete-label ${selected ? 'selected' : ''}`}>{player.name}{player.setter ? ' · S' : ''}<small>P{position} · {isFront(position) ? 'front' : 'back'}</small></span>
    </Html>}
  </group>
}
