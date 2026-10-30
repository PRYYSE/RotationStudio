import { Line } from '@react-three/drei'
import { BRAND } from '../lib/constants'
import { FORMATS, type Format } from '../lib/formats'
import { useStore } from '../state/store'

// The full court (both halves), sized by the active format and always
// visible: boundary, attack lines on both sides, and the center line under
// the net. The camera stage and the surrounding StageBox are constant; the
// court scales within them.
export function Court({ courtFormat, courtline = false }: { courtFormat?: Format; courtline?: boolean } = {}) {
  const storedFormat = useStore((s) => FORMATS[s.format])
  const format = courtFormat ?? storedFormat
  const xMax = format.courtWidth / 2
  const xMin = -xMax
  const zMax = format.halfDepth
  const lineColor = courtline ? '#e3f0ec' : BRAND.courtLine

  const rect: [number, number, number][] = [
    [xMin, 0.01, -zMax], [xMax, 0.01, -zMax], [xMax, 0.01, zMax],
    [xMin, 0.01, zMax], [xMin, 0.01, -zMax],
  ]

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[format.courtWidth, format.halfDepth * 2]} />
        <meshStandardMaterial color={courtline ? '#126879' : BRAND.court} roughness={0.95} metalness={0} />
      </mesh>
      {courtline && [-1, 1].map(side => <mesh key={side} rotation={[-Math.PI / 2, 0, 0]} position={[0, .003, side * 1.5]} receiveShadow>
        <planeGeometry args={[format.courtWidth, 3]} /><meshStandardMaterial color="#1c8190" roughness={.95} />
      </mesh>)}
      <Line points={rect} color={lineColor} lineWidth={2} />
      {/* center line under the net */}
      <Line points={[[xMin, 0.01, 0], [xMax, 0.01, 0]]} color={lineColor} lineWidth={1.5} />
      {format.attackLine !== null && (
        <>
          <Line
            points={[[xMin, 0.01, format.attackLine], [xMax, 0.01, format.attackLine]]}
            color={lineColor}
            lineWidth={1.5}
          />
          <Line
            points={[[xMin, 0.01, -format.attackLine], [xMax, 0.01, -format.attackLine]]}
            color={lineColor}
            lineWidth={1.5}
          />
        </>
      )}
    </group>
  )
}
