import type { Keyframe, Scenario, Spot, Team } from './rotationTypes.ts'
import { positionOf, sampleTrack } from './rotationModel.ts'
import { PLAYER_IDS, scenarioCaseKey, stageOrder, stageTimes } from './strategyDraft.ts'
import type { PlayerId, RotationKey, StrategyDraftV2 } from './strategyDraft.ts'
import { DRAFT_MARKER } from './strategyShare.ts'

// A clipped piecewise polyline from the actual rendered track, retaining bends
// and event points. Never interpolate a new tactical route or move a marker.
export function referencePath(track: Keyframe[], start: number, end: number): Spot[] {
  const points: Spot[] = [{ ...sampleTrack(track, start) }]
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1], b = track[i]
    if (b.time <= start || a.time >= end) continue
    const line = [a, ...(b.via ?? []), b]
    const lengths = line.slice(1).map((p, j) => Math.hypot(p.x - line[j].x, p.z - line[j].z))
    const total = lengths.reduce((n, v) => n + v, 0)
    const fraction = (t: number) => { const u = Math.max(0, Math.min(1, (t - a.time) / (b.time - a.time))); return u * u * (3 - 2 * u) }
    const lo = total * fraction(start), hi = total * fraction(end)
    let distance = 0
    for (let j = 1; j < line.length; j++) {
      distance += lengths[j - 1]
      if (distance > lo && distance < hi) points.push({ x: line[j].x, z: line[j].z })
    }
  }
  const last = sampleTrack(track, end)
  points.push({ x: last.x, z: last.z })
  return points.map(p => ({ x: p.x, z: p.z }))
}
/** Read only: receives the *current* source/overlay/sample scenario, just like
 * the live court. No second overlay and no saved/generated positional diagram. */
export function createTeamReference(team: Team, scenario: Scenario, draft: StrategyDraftV2 | null, selectedPlayer: PlayerId | null) {
  const key = `${scenario.rotation}/${scenario.serve}` as RotationKey
  const order = stageOrder(scenario.serve), times = stageTimes(scenario)
  return { status: DRAFT_MARKER, rotation: scenario.rotation, serve: scenario.serve, caseKey: scenarioCaseKey(scenario),
    teachingOnly: !!scenario.teachingOnly, selectedPlayer,
    stages: order.map((stage, index) => {
      const time = times[stage], phase = scenario.phases.find(p => Math.abs(p.time - time) < .001)
      const actors = PLAYER_IDS.map(id => {
        const p = sampleTrack(scenario.tracks[id], time), player = team.players.find(p => p.id === id)!
        return { id, name: player.name, color: player.color, number: positionOf(team, scenario.rotation, id),
          point: { x: p.x, z: p.z }, role: p.role, notes: draft?.notes?.players?.[key]?.[stage]?.[id] ?? null }
      })
      const from = index ? times[order[index - 1]] : time
      return { stage, time, eventLabel: phase?.label ?? stage, cue: phase?.cue ?? '',
        teamNote: draft?.notes?.team?.[key]?.[stage] ?? null, actors,
        path: selectedPlayer ? referencePath(scenario.tracks[selectedPlayer], from, time) : [],
        pathFrom: index ? order[index - 1] : null, setterTarget: { ...scenario.setterTarget } }
    }) }
}
export type TeamReferenceData = ReturnType<typeof createTeamReference>
