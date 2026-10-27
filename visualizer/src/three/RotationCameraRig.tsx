import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as Controls } from 'three-stdlib'
import * as THREE from 'three'
import { useRotations } from '../state/rotationStore'

// Same aspect-fitted target/direction approach as the original CameraRig.
const framings = {
  front: { target: [0, 0.8, 1], dir: [0, 0.9, 1], halfW: 6.4, halfH: 9 },
  side: { target: [0, 0.8, 0], dir: [1, 1.2, 0.12], halfW: 10.8, halfH: 6.2 },
  orbit: { target: [0, 0.5, 0.6], dir: [0.38, 1.35, 1], halfW: 7.8, halfH: 10.5 },
  top: { target: [0, 0, 0.5], dir: [0, 1, 0.001], halfW: 5.8, halfH: 11 },
} as const
export function RotationCameraRig() {
  const controls = useRef<Controls>(null)
  const { camera, size } = useThree()
  const view = useRotations((s) => s.view)
  const target = useRef(new THREE.Vector3())
  const destination = useRef(new THREE.Vector3())
  const transitioning = useRef(true)
  useEffect(() => {
    const f = framings[view]
    target.current.set(f.target[0], f.target[1], f.target[2])
    const aspect = size.width / size.height
    const tan = Math.tan(42 * Math.PI / 360)
    // Reserve chrome space, especially the lower timeline on portrait phones.
    const portrait = size.width < 600
    const halfW = portrait && (view === 'orbit' || view === 'front') ? 6.2 : f.halfW
    const halfH = portrait && (view === 'orbit' || view === 'front') ? 9.5 : f.halfH
    if (portrait && view === 'orbit') target.current.set(0, 0.6, 2.5)
    const distance = Math.max(halfH / tan, halfW / (tan * aspect)) * 1.05
    destination.current.copy(target.current).addScaledVector((portrait && view === 'orbit' ? new THREE.Vector3(0, 1.25, 1) : new THREE.Vector3(...f.dir)).normalize(), distance)
    transitioning.current = true
  }, [view, size])
  useFrame((_, dt) => {
    const c = controls.current
    if (!c) return
    if (transitioning.current) {
      const alpha = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1 - Math.exp(-8 * dt)
      camera.position.lerp(destination.current, alpha)
      c.target.lerp(target.current, alpha)
      if (camera.position.distanceTo(destination.current) < 0.025) transitioning.current = false
      c.update()
    }
  })
  return <OrbitControls ref={controls} makeDefault enablePan={false} enableRotate={view === 'orbit'}
    minDistance={7} maxDistance={85} maxPolarAngle={Math.PI / 2 - 0.02}
    onStart={() => { transitioning.current = false }} />
}
