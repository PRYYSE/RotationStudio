import type { Scenario, Spot, Team } from './rotationTypes.ts'
import { isFront, phaseAt, positionOf, sampleTrack } from './rotationModel.ts'
import { laterDefendTime, stageOrder, stageTimes } from './strategyDraft.ts'
import type { CoverageZone, PlayerId, StrategyRotation, StrategyStage } from './strategyDraft.ts'
import { sourceEvents } from './strategyEvents.ts'

export type CoverageArea = {
  player: string; center: Spot; radiusX: number; radiusZ: number
  duty: 'primary' | 'assist' | 'compact'; responsibility: string
  assigned?: boolean
}

// These are relative coaching assignments, not reach measurements/probabilities.
export function coverageStage(s: Scenario, time: number): StrategyStage {
  const times = stageTimes(s)
  // Later rallies keep their original events, beyond the five editing anchors.
  const phase = phaseAt(s, time)
  if (time > times.Attack && phase.section === 'Defend') return 'Defend'
  if (phase.label === 'Next dig') return 'Receive'
  if (phase.label === 'Next set ready') return 'Set'
  return [...stageOrder(s.serve)].reverse().find(stage => time >= times[stage]) ?? 'Start'
}

export function coverageZoneAt(changes: StrategyRotation | undefined, s: Scenario, time: number, id: PlayerId): CoverageZone | undefined {
  const stage = coverageStage(s, time), later = laterDefendTime(s)
  const event = !s.teachingOnly && !!s.tactics && changes?.eventOverrides && sourceEvents(s).find(e => Math.abs(e.time - time) < 1e-6)
  return (event ? changes?.eventOverrides?.[event.id]?.coverage?.[id] : undefined)
    ?? (stage === 'Defend' && later !== undefined && time >= later ? changes?.laterDefend?.coverage?.[id] : undefined)
    ?? changes?.coverage?.[stage]?.[id]
}
export function assignedCoverage(player: string, p: Spot, zone: CoverageZone): CoverageArea {
  // Retain authored metre dimensions. Clamp the centre so the entire ellipse
  // fits our 9×9 floor, including an athlete serving beyond the endline.
  return { player, radiusX: zone.radiusX, radiusZ: zone.radiusZ, assigned: true, duty: 'primary', responsibility: zone.role,
    center: { x: Math.max(-4.5 + zone.radiusX, Math.min(4.5 - zone.radiusX, p.x + (zone.offsetX ?? 0))),
      z: Math.max(zone.radiusZ, Math.min(9 - zone.radiusZ, p.z + (zone.offsetZ ?? 0))) } }
}
export function coverageAreas(team: Team, s: Scenario, time: number, enabled: boolean, changes?: StrategyRotation): CoverageArea[] {
  if (!enabled) return []
  const stage = coverageStage(s, time)
  return team.players.map(player => {
    const p = sampleTrack(s.tracks[player.id], time)
    const zone = coverageZoneAt(changes, s, time, player.id as PlayerId)
    if (zone) return assignedCoverage(player.id, p, zone)
    const center = { x: p.x, z: p.z }
    const front = isFront(positionOf(team, s.rotation, player.id))
    const authored = s.serve === 'they' && (stage === 'Start' || stage === 'Receive')
      ? s.tactics?.receiveZones.find(z => z.player === player.id) : undefined
    if (authored) return { ...authored, center, responsibility: authored.label }
    const mobility = player.skills?.mobility ?? 3, receive = player.skills?.receive ?? 3
    const breadth = (mobility + receive - 2) / 8
    let radiusX = .65, radiusZ = .65, responsibility = 'Support', duty: CoverageArea['duty'] = 'compact'
    if (p.role === 'block') {
      radiusX = .85; radiusZ = .45; responsibility = 'Block lane'
    } else if (stage === 'Defend' || (stage === 'Start' && s.serve === 'us')) {
      if (p.z > 9) { responsibility = 'Server' }
      else if (front && p.z < 2) {
        radiusX = .85; radiusZ = .45; responsibility = 'Block lane'
      } else if (front || p.z < 5) {
        radiusX = .9 + breadth * .35; radiusZ = .85 + breadth * .35; responsibility = 'Short / tip'; duty = 'assist'
      } else {
        radiusX = 1.05 + breadth * .75; radiusZ = 1.2 + breadth * .8; responsibility = 'Back / deep'; duty = 'primary'
      }
    } else if (stage === 'Set' || stage === 'Attack') {
      if (p.role === 'set' || p.role === 'attack') {
        responsibility = p.role === 'set' ? 'Setting window' : 'Hitter'
      } else {
        radiusX = .8 + breadth * (front ? .35 : .65)
        radiusZ = .8 + breadth * (front ? .4 : .8)
        responsibility = front ? 'Short hit cover' : 'Deep hit cover'; duty = 'assist'
      }
    } else if (s.serve === 'us' || !s.tactics?.receiveZones.length) {
      radiusX = .8 + breadth * .8; radiusZ = .9 + breadth * .8
      responsibility = p.role === 'set' ? 'Second contact' : 'Dig lane'; duty = 'assist'
    } else responsibility = 'Receive support'
    return { player: player.id, center, radiusX, radiusZ, duty, responsibility }
  })
}
