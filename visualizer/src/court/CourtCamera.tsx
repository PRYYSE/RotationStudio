import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as Controls } from 'three-stdlib'
import { TOUCH, Vector3 } from 'three'
import { useRotations } from '../state/rotationStore'

const directions = { orbit: [.38, 1.25, 1], top: [0, 1, .001], front: [0, .65, 1], side: [1, .85, .03] } as const
/** Camera target belongs to the coach. Only choosing a view or Reset reframes it. */
export function CourtCamera({ reset, drawing }: { reset: number; drawing: boolean }) {
  const { camera, size, gl } = useThree(), controls = useRef<Controls>(null)
  const view = useRotations(s => s.view), destination = useRef<Vector3 | null>(null)
  const target = useRef(new Vector3(0, .15, 4.5)), fitted = useRef(0)
  useEffect(() => {
    const tan = Math.tan(42 * Math.PI / 360), aspect = size.width / size.height
    const halfH = view === 'top' ? 5.7 : view === 'front' ? 4.3 : 5.4
    const halfW = view === 'side' ? 6.1 : 5.6
    const distance = Math.max(halfH / tan, halfW / (tan * aspect)) * 1.12
    fitted.current = distance
    target.current.set(0, .15, 4.5)
    destination.current = target.current.clone().addScaledVector(new Vector3(...directions[view]).normalize(), distance)
    // Reset is immediate and predictable, including when the same view is selected again.
    camera.position.copy(destination.current); controls.current?.target.copy(target.current); controls.current?.update()
    destination.current = null
  // Deliberately do not reset on resize, playhead, focus or sheet state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, reset, camera])
  useEffect(() => {
    const c = controls.current
    if (!c || !fitted.current) return
    const tan = Math.tan(42 * Math.PI / 360), aspect = size.width / size.height
    const halfH = view === 'top' ? 5.7 : view === 'front' ? 4.3 : 5.4
    const next = Math.max(halfH / tan, (view === 'side' ? 6.1 : 5.6) / (tan * aspect)) * 1.12
    // Preserve orbit, pan target and the coach's relative zoom when a sheet or
    // orientation changes the available aspect ratio; do not choose a new pose.
    camera.position.sub(c.target).multiplyScalar(next / fitted.current).add(c.target)
    fitted.current = next
    c.update()
  }, [size.width, size.height, camera, view])
  useFrame(() => {
    const c = controls.current
    if (!c) return
    // screenSpacePanning=false keeps both fingers on the horizontal court plane.
    const x = Math.max(-6, Math.min(6, c.target.x)), z = Math.max(-3, Math.min(12, c.target.z))
    camera.position.x += x - c.target.x; camera.position.z += z - c.target.z
    camera.position.y += .15 - c.target.y; c.target.set(x, .15, z)
    gl.domElement.dataset.camera = [...camera.position.toArray(), ...c.target.toArray()].map(v=>v.toFixed(3)).join(',')
  })
  return <OrbitControls ref={controls} makeDefault enabled={!drawing} enablePan enableZoom enableRotate
    screenSpacePanning={false} touches={{ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN}}
    minDistance={7} maxDistance={55} minPolarAngle={.005} maxPolarAngle={Math.PI / 2 - .08}
    enableDamping={false} rotateSpeed={.65} panSpeed={.7} />
}
