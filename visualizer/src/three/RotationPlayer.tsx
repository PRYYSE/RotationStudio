import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Scenario, Team } from '../lib/rotationTypes'
import { createPoseCues, playerPose } from '../lib/rotationPose'
import { useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { selectScenario } from '../lib/rotationModel'
import { sourceEvents } from '../lib/strategyEvents'
import { resolveStrategyRotation } from '../lib/strategyOverlay'
import type { PlayerId } from '../lib/strategyDraft'
import { clearDragPreview, dragPreviewAt, showDragPreview } from './dragPreview'

type Player = Team['players'][number]
const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
export function RotationPlayer({ player, scenario, team, reducedMotion = false }: { player: Player; scenario: Scenario; team: Team; reducedMotion?: boolean }) {
  const track = scenario.tracks[player.id]
  const published = useRotations(s => s.published), working = useStrategies(s => s.working)
  const actions = useMemo(() => {
    const root = published?.plans.scenarios.find(s => s.rotation === scenario.rotation && s.serve === scenario.serve)
    if (!root || !working || scenario.teachingOnly) return []
    const source = selectScenario(root, scenario.tactics!.opponentAttack, scenario.tactics!.firstTouch)
    const changes = resolveStrategyRotation(working, source)
    return sourceEvents(source).map(e => ({ time: e.time, action: changes.eventOverrides?.[e.id]?.actions?.[player.id as PlayerId] }))
  }, [published, working, scenario, player.id])
  const cues = useMemo(() => createPoseCues(scenario, team, player.id), [scenario, team, player.id])
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null), upper = useRef<THREE.Group>(null)
  const shirt = useRef<THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>>(null)
  const leftArm = useRef<THREE.Group>(null), rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null), rightLeg = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const selected = useRotations((s) => s.selected === player.id)
  const dragging = useRef(false), dragStart = useRef({ x: 0, y: 0 })
  const pendingDrag = useRef<{ x: number; z: number } | null>(null)
  useEffect(() => () => clearDragPreview(player.id), [player.id])
  useFrame(() => {
    const s = useRotations.getState()
    const current = actions.filter(e => e.time <= s.time + 1e-7).at(-1)
    const p = playerPose(track, cues, s.time, reducedMotion, current?.action ?? undefined, current?.time)
    // Render the preview directly, with no strategy rebuild between mouse moves.
    const preview = s.strategyMode ? dragPreviewAt(player.id) : undefined
    if (group.current) { group.current.position.set(preview?.x ?? p.x, 0, preview?.z ?? p.z); group.current.rotation.y = p.facing }
    if (body.current) body.current.position.y = p.lift
    if (upper.current) { upper.current.position.y = .82 - p.crouch * .08; upper.current.rotation.x = p.lean }
    if (leftLeg.current) leftLeg.current.rotation.x = p.leftLeg
    if (rightLeg.current) rightLeg.current.rotation.x = p.rightLeg
    if (leftArm.current) leftArm.current.rotation.set(p.leftArm, 0, -p.armSpread)
    if (rightArm.current) rightArm.current.rotation.set(p.rightArm, 0, p.armSpread)
    if (shirt.current) shirt.current.material.emissiveIntensity = hovered || selected ? .35 : p.cue === 'ready' ? .13 : .28
  })
  const down = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const s = useRotations.getState()
    useRotations.setState({ selected: player.id })
    if (!s.editor || s.playing) return
    if (s.view !== 'top') return
    dragging.current = true
    pendingDrag.current = null
    clearDragPreview(player.id)
    dragStart.current = { x: e.clientX, y: e.clientY }
    if (s.strategyMode) useStrategies.getState().beginGesture()
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    if (Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y) < 4) return
    e.stopPropagation()
    const hit = e.ray.intersectPlane(floor, new THREE.Vector3())
    if (hit) {
      const point = { x: Math.max(-4.5, Math.min(4.5, Math.round(hit.x * 100) / 100)), z: Math.max(0, Math.min(12, Math.round(hit.z * 100) / 100)) }
      if (useRotations.getState().strategyMode && window.matchMedia('(min-width: 900px)').matches) {
        // Commit a single undoable desktop strategy mutation at pointer-up. The avatar
        // and its identity label follow the preview at full frame rate.
        pendingDrag.current = point
        showDragPreview(player.id, point)
      } else useRotations.getState().edit(point)
    }
  }
  const up = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    dragging.current = false
    const coached = useRotations.getState().strategyMode
    if (coached) {
      const cancel = e.type === 'pointercancel'
      if (!cancel && pendingDrag.current) useRotations.getState().edit(pendingDrag.current)
      useStrategies.getState().endGesture(cancel)
      // Hold the visual preview through the one React render applying the
      // committed scenario, so release cannot snap briefly to its old spot.
      if (cancel) clearDragPreview(player.id)
      else requestAnimationFrame(() => clearDragPreview(player.id))
    }
    pendingDrag.current = null
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }
  const skin = '#e9bea5'
  return <group ref={group} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
    onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <ringGeometry args={[0.32, hovered || selected ? 0.5 : 0.4, 32]} />
      <meshBasicMaterial color={player.color} transparent opacity={0.8} />
    </mesh>
    <group ref={body}>
      <group ref={upper} position={[0, .82, 0]}>
        <mesh ref={shirt} position={[0, .31, 0]} castShadow>
          <boxGeometry args={[0.44, 0.56, 0.28]} />
          <meshStandardMaterial color={player.color} roughness={0.7} emissive={player.color} emissiveIntensity={hovered || selected ? .35 : .13} />
        </mesh>
        <mesh position={[0, .84, 0]} castShadow>
          <sphereGeometry args={[0.18, 12, 10]} /><meshStandardMaterial color={skin} roughness={0.9} />
        </mesh>
        <mesh position={[0, .97, 0]}><sphereGeometry args={[0.17, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#25202b" /></mesh>
        {[-1, 1].map((side) => <group key={side} ref={side < 0 ? leftArm : rightArm} position={[side * 0.29, .5, 0]} rotation={[0, 0, side * 0.12]}>
          <mesh position={[0, -0.25, 0]} castShadow><capsuleGeometry args={[0.075, 0.37, 4, 8]} /><meshStandardMaterial color={skin} /></mesh>
          <mesh position={[0, -.5, 0]}><sphereGeometry args={[.08, 8, 6]} /><meshStandardMaterial color={skin} /></mesh>
        </group>)}
        <mesh position={[0, -.03, 0]}><boxGeometry args={[0.42, 0.23, 0.3]} /><meshStandardMaterial color="#16223b" /></mesh>
      </group>
      {[-1, 1].map((side) => <group key={side} ref={side < 0 ? leftLeg : rightLeg} position={[side * 0.14, 0.7, 0]}>
        <mesh position={[0, -0.27, 0]} castShadow><capsuleGeometry args={[0.09, 0.4, 4, 8]} /><meshStandardMaterial color={skin} /></mesh>
        <mesh position={[0, -0.58, -0.04]} castShadow><boxGeometry args={[0.2, 0.13, 0.32]} /><meshStandardMaterial color="#f0f3ff" /></mesh>
      </group>)}
    </group>
  </group>
}
