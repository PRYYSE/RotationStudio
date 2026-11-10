import { useRef } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { coverageAreas, coverageZoneAt } from '../lib/coverage'
import type { CoverageArea } from '../lib/coverage'
import { coveragePolygonError } from '../lib/coveragePolygon'
import type { Spot } from '../lib/rotationTypes'
import { resolveStrategyRotation } from '../lib/strategyOverlay'
import type { CoverageZone, PlayerId, RotationKey } from '../lib/strategyDraft'

const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
function shapeFromCourtPoints(points: Spot[]) {
  const shape = new THREE.Shape()
  points.forEach((p, i) => i ? shape.lineTo(p.x, -p.z) : shape.moveTo(p.x, -p.z))
  shape.closePath()
  return shape
}
function VertexHandle({ player, vertex, index, zone, color }: { player: PlayerId; vertex: Spot; index: number; zone: CoverageZone; color: string }) {
  const start = useRef<CoverageZone | null>(null)
  const finish = (e: ThreeEvent<PointerEvent>) => {
    if (!start.current) return
    e.stopPropagation(); start.current = null
    useStrategies.getState().endGesture(e.type === 'pointercancel')
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }
  return <mesh name={`coverage-vertex-${player}-${index}`} position={[vertex.x, .16, vertex.z]}
    onPointerDown={e => {
      e.stopPropagation()
      start.current = structuredClone(zone)
      useStrategies.getState().beginGesture()
      ;(e.target as Element).setPointerCapture(e.pointerId)
    }} onPointerMove={e => {
      if (!start.current?.vertices) return
      e.stopPropagation()
      const p = e.ray.intersectPlane(floor, new THREE.Vector3())
      if (!p) return
      const next = start.current.vertices.map((v, i) => i === index
        ? { x: +clamp(p.x, -4.5, 4.5).toFixed(3), z: +clamp(p.z, 0, 9).toFixed(3) }
        : { ...v })
      if (coveragePolygonError(next)) return
      const s = useRotations.getState(), key = `${s.rotation}/${s.serve}` as RotationKey
      useStrategies.getState().setCoverage(key, player, { ...start.current, vertices: next })
    }} onPointerUp={finish} onPointerCancel={finish}>
    <sphereGeometry args={[.22, 12, 12]} />
    <meshBasicMaterial color={color} depthTest={false} />
  </mesh>
}
function RadiusHandle({ area, zone, axis, color }: { area: CoverageArea; zone: CoverageZone; axis: 'X' | 'Z'; color: string }) {
  const start = useRef<{ center: CoverageArea['center']; zone: CoverageZone } | null>(null)
  const finish = (e: ThreeEvent<PointerEvent>) => {
    if (!start.current) return
    e.stopPropagation(); start.current = null
    useStrategies.getState().endGesture(e.type === 'pointercancel')
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }
  return <mesh name={`coverage-radius-${axis}`} position={[area.center.x + (axis === 'X' ? area.radiusX : 0), .16, area.center.z + (axis === 'Z' ? area.radiusZ : 0)]}
    rotation={[-Math.PI / 2, 0, Math.PI / 4]}
    onPointerDown={e => {
      e.stopPropagation(); start.current = { center: { ...area.center }, zone: { ...zone } }
      useStrategies.getState().beginGesture()
      ;(e.target as Element).setPointerCapture(e.pointerId)
    }} onPointerMove={e => {
      if (!start.current) return
      e.stopPropagation()
      const p = e.ray.intersectPlane(floor, new THREE.Vector3())
      if (!p) return
      const value = Math.abs(axis === 'X' ? p.x - start.current.center.x : p.z - start.current.center.z)
      const s = useRotations.getState(), key = `${s.rotation}/${s.serve}` as RotationKey
      useStrategies.getState().setCoverage(key, area.player as PlayerId, { ...start.current.zone,
        [axis === 'X' ? 'radiusX' : 'radiusZ']: Math.max(.1, Math.min(4.5, Math.round(value * 100) / 100)) })
    }} onPointerUp={finish} onPointerCancel={finish}>
    <planeGeometry args={[.32, .32]} /><meshBasicMaterial color={color} depthTest={false} side={THREE.DoubleSide} />
  </mesh>
}

export function StrategyCoverage() {
  const desktop = true
  const s = useRotations(), studio = useStrategies(), scenario = activeScenario(s), bundle = activeBundle(s)
  if (!scenario || !bundle) return null
  const working = s.review ? s.review.strategy : studio.working
  const changes = working ? resolveStrategyRotation(working, scenario) : undefined
  const enabled = (s.receiveAreas || (desktop && s.strategyMode)) && (!s.strategyMode || studio.coverageDisplay !== 'off')
  const areas = coverageAreas(bundle.team, scenario, s.time, enabled, changes)
    .filter(a => !s.strategyMode || (!studio.coverageHidden.includes(a.player as PlayerId) && (studio.coverageDisplay !== 'selected' || a.player === s.selected)))
  return <>{areas.map(area => {
    const player = bundle.team.players.find(p => p.id === area.player)!
    const points = area.polygon
      ? [...area.polygon, area.polygon[0]].map(p => new THREE.Vector3(p.x, .055, p.z))
      : Array.from({ length: 65 }, (_, i) => new THREE.Vector3(
        area.center.x + Math.cos(i / 64 * Math.PI * 2) * area.radiusX, .055,
        area.center.z + Math.sin(i / 64 * Math.PI * 2) * area.radiusZ))
    const zone = coverageZoneAt(changes, scenario, s.time, area.player as PlayerId)
    return <group key={area.player} name={`coverage-${area.player}`}>
      {area.polygon ? <mesh position={[0, .045, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <shapeGeometry args={[shapeFromCourtPoints(area.polygon)]} /><meshBasicMaterial color={player.color} transparent opacity={.16} depthWrite={false} side={THREE.DoubleSide} />
      </mesh> : <mesh position={[area.center.x, .045, area.center.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[area.radiusX, area.radiusZ, 1]} raycast={() => null}>
        <circleGeometry args={[1, 64]} /><meshBasicMaterial color={player.color} transparent opacity={area.assigned ? .16 : area.duty === 'primary' ? .09 : .045} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>}
      <Line points={points} color={player.color} lineWidth={area.assigned ? 1.5 : .8} transparent opacity={area.assigned ? .7 : .25} raycast={() => null} />
      {s.strategyMode && !s.playing && s.view === 'top' && studio.working && s.selected === area.player && zone && <>
        {zone.vertices ? zone.vertices.map((vertex, index) => <VertexHandle key={index} player={area.player as PlayerId} vertex={vertex} index={index} zone={zone} color={player.color} />) : <>
          <RadiusHandle area={area} zone={zone} axis="X" color={player.color} />
          <RadiusHandle area={area} zone={zone} axis="Z" color={player.color} />
        </>}
      </>}
    </group>
  })}</>
}
