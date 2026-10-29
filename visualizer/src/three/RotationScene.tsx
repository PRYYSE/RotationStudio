import { memo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Court } from './Court'
import { Net } from './Net'
import { StageBox } from './StageBox'
import { RotationCameraRig } from './RotationCameraRig'
import { RotationPlayer } from './RotationPlayer'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { ballAt, sampleArc, sampleTrack } from '../lib/rotationModel'
import { coverageAreas } from '../lib/coverage'
import { FORMATS } from '../lib/formats'
import { BRAND } from '../lib/constants'
import { useStrategies } from '../state/strategyStore'
import { StrategyRoute } from './StrategyRoute'
import { RotationLabels } from './RotationLabels'

function Target({ x, z }: { x: number; z: number }) {
  const dragging = useRef(false)
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const down = (e: ThreeEvent<PointerEvent>) => {
    const s = useRotations.getState()
    if (!s.editor || s.view !== 'top') return
    e.stopPropagation(); dragging.current = true
    useRotations.setState({ selected: 'target' })
    if (s.strategyMode) useStrategies.getState().beginGesture()
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    e.stopPropagation()
    const hit = e.ray.intersectPlane(plane, new THREE.Vector3())
    if (hit) useRotations.getState().edit({ x: Math.max(-4.5, Math.min(4.5, Math.round(hit.x * 100) / 100)), z: Math.max(0, Math.min(2.99, Math.round(hit.z * 100) / 100)) })
  }
  const up = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    dragging.current = false
    if (useRotations.getState().strategyMode) useStrategies.getState().endGesture(e.type === 'pointercancel')
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }
  return <group position={[x, 0.06, z]} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.4, 0.53, 40]} /><meshBasicMaterial color="#ffd878" side={THREE.DoubleSide} /></mesh>
    <Line points={[[-0.7, 0, 0], [0.7, 0, 0]]} color="#ffd878" lineWidth={2} />
    <Line points={[[0, 0, -0.7], [0, 0, 0.7]]} color="#ffd878" lineWidth={2} />
  </group>
}
function MovingBall() {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    useRotations.getState().tick(dt)
    const s = useRotations.getState(), scenario = activeScenario(s)
    if (!scenario || !mesh.current) return
    const p = ballAt(scenario, s.time)
    mesh.current.position.set(p.x, p.y, p.z)
    mesh.current.rotation.z = s.time * 3
  })
  return <mesh ref={mesh} castShadow><sphereGeometry args={[0.16, 20, 16]} /><meshStandardMaterial color="#ffdb70" emissive="#ffbd36" emissiveIntensity={0.35} roughness={0.5} /></mesh>
}
function Players() {
  const bundle = useRotations(activeBundle)!
  const scenario = useRotations(activeScenario)!
  const trails = useRotations((s) => s.trails)
  const time = useRotations((s) => s.time)
  const editor = useRotations((s) => s.editor)
  const receiveAreas = useRotations((s) => s.receiveAreas)
  return <>
    {coverageAreas(bundle.team, scenario, time, receiveAreas).map((zone) => {
      const player = bundle.team.players.find((p) => p.id === zone.player)!
      const points = Array.from({ length: 65 }, (_, i) => {
        const angle = i / 64 * Math.PI * 2
        return new THREE.Vector3(Math.cos(angle) * zone.radiusX, 0, Math.sin(angle) * zone.radiusZ)
      })
      return <group key={zone.player} name={`coverage-${zone.player}`} position={[zone.center.x, 0.045, zone.center.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[zone.radiusX, zone.radiusZ, 1]} raycast={() => null}>
          <circleGeometry args={[1, 64]} /><meshBasicMaterial color={player.color} transparent opacity={zone.duty === 'primary' ? 0.09 : 0.045} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <Line points={points} color={player.color} lineWidth={.8} transparent opacity={0.25} raycast={() => null} />
      </group>
    })}
    {bundle.team.players.map((player) => <RotationPlayer key={player.id} player={player} track={scenario.tracks[player.id]} team={bundle.team} rotation={scenario.rotation} />)}
    {trails && !editor && bundle.team.players.map((p) => {
      const points = Array.from({ length: 100 }, (_, i) => { const v = sampleTrack(scenario.tracks[p.id], i / 99 * scenario.duration); return new THREE.Vector3(v.x, 0.08, v.z) })
      return <group key={p.id}>
        <Line points={points} color={p.color} lineWidth={1} transparent opacity={p.setter ? 0.65 : 0.2} />
        {p.setter && scenario.tracks[p.id].slice(1).filter((k, i) => Math.hypot(k.x - scenario.tracks[p.id][i].x, k.z - scenario.tracks[p.id][i].z) > 0.4).map((k, i) => {
          const before = sampleTrack(scenario.tracks[p.id], k.time - 0.1)
          return <mesh key={i} position={[k.x, 0.12, k.z]} rotation={[Math.PI / 2, 0, -Math.atan2(k.x - before.x, k.z - before.z)]}>
            <coneGeometry args={[0.12, 0.35, 3]} /><meshBasicMaterial color={p.color} />
          </mesh>
        })}
      </group>
    })}
    <Target {...scenario.setterTarget} />
    <StrategyRoute />
    {trails && scenario.ball.map((b, i) => <Line key={i} points={Array.from({ length: 50 }, (_, j) => { const p = sampleArc(b, j / 49); return new THREE.Vector3(p.x, p.y, p.z) })}
      color={b.kind === 'pass' ? '#ffd878' : BRAND.accent} lineWidth={b.kind === 'pass' ? 2 : 1} transparent opacity={0.35} />)}
    {scenario.serve === 'they' && <group position={[scenario.ball[0].from.x, 0, scenario.ball[0].from.z]}>
      <mesh position={[0, 0.8, 0]}><capsuleGeometry args={[0.2, 0.9, 6, 10]} /><meshStandardMaterial color="#536581" /></mesh>
      <mesh position={[0, 1.6, 0]}><sphereGeometry args={[0.18, 12, 10]} /><meshStandardMaterial color="#b7c9e4" /></mesh>
      <Html zIndexRange={[1, 0]} center position={[0, 2.3, 0]} style={{ pointerEvents: 'none' }}><span className="server-cue">Their server</span></Html>
    </group>}
    <MovingBall />
  </>
}
export const RotationScene = memo(function RotationScene({ labelHost }: { labelHost: RefObject<HTMLDivElement | null> }) {
  const netHeight = useRotations((s) => activeBundle(s)!.plans.netHeight)
  const scenarioKey = useRotations((s) => `${s.rotation}/${s.serve}/${s.opponentAttack}/${s.firstTouch}`)
  return <Canvas shadows dpr={[1, 1.7]} camera={{ position: [12, 30, 25], fov: 42, near: 0.1, far: 150 }} gl={{ antialias: true }}>
    <color attach="background" args={[BRAND.bg]} />
    <fog attach="fog" args={[BRAND.bg, 45, 100]} />
    <ambientLight intensity={0.75} />
    <hemisphereLight args={['#b8d8ff', '#090a12', 0.8]} />
    <directionalLight position={[7, 13, 9]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
    <StageBox /><Court courtFormat={FORMATS.indoor6s} /><Net courtFormat={{ ...FORMATS.indoor6s, netHeight }} />
    <Players key={scenarioKey} />
    <ContactShadows position={[0, 0.02, 0]} scale={28} resolution={512} blur={2.4} opacity={0.35} far={5} />
    <RotationCameraRig />
    <RotationLabels host={labelHost} />
  </Canvas>
})
