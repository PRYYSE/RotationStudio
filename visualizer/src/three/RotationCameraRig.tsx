import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as Controls } from 'three-stdlib'
import * as THREE from 'three'
import { activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { EDITOR_TARGET, EDITOR_MIN_DISTANCE, EDITOR_MAX_DISTANCE, editorZoomDistance } from '../lib/editorZoom'
import { useDesktopWorkbench } from '../ui/useDesktopWorkbench'

// Same aspect-fitted target/direction approach as the original CameraRig.
const framings = {
  front: { target: [0, 0.8, 1], dir: [0, 0.9, 1], halfW: 6.4, halfH: 9 },
  side: { target: [0, 0.8, 0], dir: [1, 1.2, 0.12], halfW: 10.8, halfH: 6.2 },
  orbit: { target: [0, 0.5, 0.6], dir: [0.38, 1.35, 1], halfW: 7.8, halfH: 10.5 },
  top: { target: [0, 0, 0.5], dir: [0, 1, 0.001], halfW: 5.8, halfH: 11 },
} as const
export function RotationCameraRig() {
  const desktop = useDesktopWorkbench()
  const controls = useRef<Controls>(null)
  const { camera, size } = useThree()
  const view = useRotations((s) => s.view)
  const editing = useRotations((s) => s.strategyMode)
  const gesture = useStrategies(s => !!s.gesture)
  const command = useStrategies(s => s.cameraCommand)
  const fitDistance = useRef(30)
  // Their server needs the far half at Start. Once the first ball arrives,
  // devote the view to our full 9x9 floor instead of the empty opposing half.
  const ourHalf = useRotations(s => s.strategyMode || s.serve === 'us' || s.time >= (activeScenario(s)?.firstContact.time ?? Infinity))
  const target = useRef(new THREE.Vector3())
  const destination = useRef(new THREE.Vector3())
  useEffect(() => {
    const original = framings[view]
    const f = view === 'top' ? { target: EDITOR_TARGET, dir: [0, 1, .001] as const, halfW: desktop ? 5.2 : 5.8, halfH: desktop ? 5.6 : 6.8 }
      : ourHalf ? { ...original, target: [0, .5, 4.5] as const, halfW: view === 'side' ? 6.8 : 6, halfH: 6.8 } : original
    target.current.set(f.target[0], f.target[1], f.target[2])
    const aspect = size.width / size.height
    const tan = Math.tan(42 * Math.PI / 360)
    // Reserve chrome space, especially the lower timeline on portrait phones.
    const portrait = size.width < 600
    const halfW = !ourHalf && portrait && (view === 'orbit' || view === 'front') ? 6.2 : f.halfW
    const halfH = !ourHalf && portrait && (view === 'orbit' || view === 'front') ? 9.5 : f.halfH
    if (!editing && !ourHalf && portrait && view === 'orbit') target.current.set(0, 0.6, 2.5)
    const distance = Math.max(halfH / tan, halfW / (tan * aspect)) * 1.05
    destination.current.copy(target.current).addScaledVector((portrait && view === 'orbit' ? new THREE.Vector3(0, 1.25, 1) : new THREE.Vector3(...f.dir)).normalize(), distance)
    fitDistance.current = distance
    camera.position.copy(destination.current)
    controls.current?.target.copy(target.current)
    controls.current?.update()
    // On mobile, stage labels may shift the canvas top by a few pixels without
    // changing its width/height. Do not discard the coach's zoom for that move.
  }, [view, size.width, size.height, editing, ourHalf, desktop])
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
