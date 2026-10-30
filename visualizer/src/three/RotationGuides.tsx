import { Line } from '@react-three/drei'
import { activeScenario, useRotations } from '../state/rotationStore'
import { sampleTrack, selectScenario } from '../lib/rotationModel'
import { useDesktopWorkbench } from '../ui/useDesktopWorkbench'

/** Read-only floor guides; never participate in pointer editing or validation. */
export function RotationGuides() {
  const desktop = useDesktopWorkbench()
  const s = useRotations(), scenario = activeScenario(s)
  const root = s.published?.plans.scenarios.find(p => p.rotation === s.rotation && p.serve === s.serve)
  if (!scenario || !root) return null
  const source = selectScenario(root, s.opponentAttack, s.firstTouch)
  const ghost = s.selected === 'target' ? source.setterTarget : source.tracks[s.selected] && sampleTrack(source.tracks[s.selected], s.time)
  return <group>
    {(s.v3Ghost || (desktop && s.strategyMode)) && ghost && <mesh name="strategy-v3-ghost" position={[ghost.x, .09, ghost.z]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[.36, .46, 40]} /><meshBasicMaterial color="#dbe9ff" transparent opacity={.35} depthWrite={false} />
    </mesh>}
    {s.legalHints && s.time <= scenario.ball[0].start && Object.entries(scenario.tracks).map(([id, track]) => {
      const p = sampleTrack(track, 0)
      return <group key={id} name={`legal-start-${id}`}>
        <Line points={[[p.x - .22, .04, p.z], [p.x + .22, .04, p.z]]} color="#dbe9ff" transparent opacity={.5} raycast={() => null} />
        <Line points={[[p.x, .04, p.z - .22], [p.x, .04, p.z + .22]]} color="#dbe9ff" transparent opacity={.5} raycast={() => null} />
      </group>
    })}
  </group>
}
