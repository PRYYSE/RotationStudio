import { useRef } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { coverageAreas, coverageZoneAt } from '../lib/coverage'
import type { CoverageArea } from '../lib/coverage'
import { resolveStrategyRotation } from '../lib/strategyOverlay'
import type { CoverageZone, PlayerId, RotationKey } from '../lib/strategyDraft'

const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
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
  const s = useRotations(), studio = useStrategies(), scenario = activeScenario(s), bundle = activeBundle(s)
  if (!scenario || !bundle) return null
  const changes = studio.working ? resolveStrategyRotation(studio.working, scenario) : undefined
  const enabled = s.receiveAreas && (!s.strategyMode || studio.coverageDisplay !== 'off')
  const areas = coverageAreas(bundle.team, scenario, s.time, enabled, changes)
    .filter(a => !s.strategyMode || (!studio.coverageHidden.includes(a.player as PlayerId) && (studio.coverageDisplay !== 'selected' || a.player === s.selected)))
  return <>{areas.map(area => {
    const player = bundle.team.players.find(p => p.id === area.player)!
    const points = Array.from({ length: 65 }, (_, i) => new THREE.Vector3(
      area.center.x + Math.cos(i / 64 * Math.PI * 2) * area.radiusX, .055,
      area.center.z + Math.sin(i / 64 * Math.PI * 2) * area.radiusZ))
    const zone = coverageZoneAt(changes, scenario, s.time, area.player as PlayerId)
    return <group key={area.player} name={`coverage-${area.player}`}>
      <mesh position={[area.center.x, .045, area.center.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[area.radiusX, area.radiusZ, 1]} raycast={() => null}>
        <circleGeometry args={[1, 64]} /><meshBasicMaterial color={player.color} transparent opacity={area.assigned ? .16 : area.duty === 'primary' ? .09 : .045} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Line points={points} color={player.color} lineWidth={area.assigned ? 1.5 : .8} transparent opacity={area.assigned ? .7 : .25} raycast={() => null} />
      {s.strategyMode && !s.playing && s.view === 'top' && studio.working && s.selected === area.player && zone && <>
        <RadiusHandle area={area} zone={zone} axis="X" color={player.color} />
        <RadiusHandle area={area} zone={zone} axis="Z" color={player.color} />
      </>}
    </group>
  })}</>
}
