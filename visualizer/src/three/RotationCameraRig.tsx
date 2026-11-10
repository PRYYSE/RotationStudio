import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as Controls } from 'three-stdlib'
import * as THREE from 'three'
import { useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { EDITOR_TARGET, EDITOR_MIN_DISTANCE, EDITOR_MAX_DISTANCE, editorZoomDistance } from '../lib/editorZoom'

// Same aspect-fitted target/direction approach as the original CameraRig.
const framings = {
  front: { target: [0, 0.8, 1], dir: [0, 0.9, 1], halfW: 6.4, halfH: 9 },
  side: { target: [0, 0.8, 0], dir: [1, 1.2, 0.12], halfW: 10.8, halfH: 6.2 },
  orbit: { target: [0, 0.5, 0.6], dir: [0.38, 1.35, 1], halfW: 7.8, halfH: 10.5 },
  top: { target: [0, 0, 0.5], dir: [0, 1, 0.001], halfW: 5.8, halfH: 11 },
} as const
export function RotationCameraRig() {
  const desktop = true
  const controls = useRef<Controls>(null)
  const { camera, size } = useThree()
  const view = useRotations((s) => s.view)
  const editing = useRotations((s) => s.strategyMode)
  const gesture = useStrategies(s => !!s.gesture)
  const command = useStrategies(s => s.cameraCommand)
  const fitDistance = useRef(30)
  const previousDesktopPreset = useRef<string | null>(null)
  const target = useRef(new THREE.Vector3())
  const destination = useRef(new THREE.Vector3())
  useEffect(() => {
    // Canvas height changes when the expanded moment rail opens. Do not reset
    // user panning/zoom/orbit for that resize or when the rally advances.
    const preset = `${view}/${editing}/${desktop}`
    if (desktop && previousDesktopPreset.current === preset) return
    previousDesktopPreset.current = preset
    const original = framings[view]
    const f = view === 'top' ? { target: EDITOR_TARGET, dir: [0, 1, .001] as const, halfW: desktop ? 5.2 : 5.8, halfH: desktop ? 5.6 : 6.8 }
      : desktop && view === 'orbit' ? { ...original, target: [0, .5, useRotations.getState().serve === 'us' ? 2 : .6] as const, halfH: 9.3 }
      : original
    target.current.set(f.target[0], f.target[1], f.target[2])
    const aspect = size.width / size.height
    const tan = Math.tan(42 * Math.PI / 360)
    const distance = Math.max(f.halfH / tan, f.halfW / (tan * aspect)) * 1.05
    destination.current.copy(target.current).addScaledVector(new THREE.Vector3(...f.dir).normalize(), distance)
    fitDistance.current = distance
    camera.position.copy(destination.current)
    controls.current?.target.copy(target.current)
    controls.current?.update()
  }, [view, size.width, size.height, editing, desktop])
  useEffect(() => {
    const c = controls.current
    if (!editing || !command || !c) return
    const distance = editorZoomDistance(camera.position.distanceTo(c.target), command.action, fitDistance.current)
    camera.position.sub(c.target).setLength(distance).add(c.target)
    c.update()
  }, [command, editing, camera])
  return <OrbitControls ref={controls} makeDefault enabled={!gesture} enablePan={false} enableZoom enableRotate={!editing && view === 'orbit'}
    touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
    minDistance={EDITOR_MIN_DISTANCE} maxDistance={EDITOR_MAX_DISTANCE} maxPolarAngle={Math.PI / 2 - 0.02} />
}
