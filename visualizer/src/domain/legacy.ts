import { BASE_REVISION, parseStrategy, stageTimes, type PlayerId, type StrategyStage } from '../lib/strategyDraft.ts'
import { applyStrategyOverlay, resolveStrategyRotation } from '../lib/strategyOverlay.ts'
import { sourceEndpointOwners, sourceEvents } from '../lib/strategyEvents.ts'
import { sampleTrack } from '../lib/rotationModel.ts'
import type { Bundle, Keyframe, Role, Scenario, Spot } from '../lib/rotationTypes.ts'
import { newId, reference, sha256, stableJson, validateLibrary } from './authoring.ts'
import type { Case, Contact, Library, Lineup, Moment, Strategy } from './contracts.ts'
import { ttgva } from './fixture.ts'

const v = { schemaVersion: 1, revision: 1 } as const
const duties: Record<Role, Moment['athletes'][number]['duty']> = {
  start: 'ready', serve: 'serve', receive: 'receive', pass: 'receive', set: 'set', attack: 'attack',
  block: 'block', help: 'cover', defend: 'defend', recover: 'recover',
}
const metres = (n: number) => +n.toFixed(4)
const asMs = (n: number) => Math.round(n * 1000)
const contactKind = { serve: 'serve', return: 'attack', pass: 'pass', set: 'set', attack: 'attack' } as const
const scenarioList = (b: Bundle): Scenario[] => b.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])

// All original track frames are included in the case's moment list. When
// another athlete or a contact splits this interval, keep each waypoint in the
// matching sub-interval of the original eased path.
function incomingBends(track: Keyframe[], previous: number, time: number): Spot[] {
  if (time <= previous || time <= track[0].time) return []
  const to = track.findIndex(frame => asMs(frame.time) >= asMs(time))
  if (to <= 0) return []
  const a = track[to - 1], b = track[to]
  if (!b.via?.length) return []
  const path = [a, ...b.via, b]
  const lengths = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.z - path[i].z))
  const total = lengths.reduce((sum, d) => sum + d, 0)
  if (!total) return []
  const distanceAt = (t: number) => {
    const u = Math.max(0, Math.min(1, (t - a.time) / (b.time - a.time)))
    return total * u * u * (3 - 2 * u)
  }
  const start = distanceAt(previous), end = distanceAt(time)
  let distance = 0
  return b.via.filter((_, i) => {
    distance += lengths[i]
    return distance > start + 1e-7 && distance < end - 1e-7
  })
}

export async function importLegacy(l: Library, base: Bundle, raw: string) {
  const draft = parseStrategy(raw)
  const sha = await sha256(raw)
  const receipt: Library['sources'][number] = { id: newId(), sha256: sha, baseSha256: await sha256(stableJson(base)), raw, issues: [], eventMap: [] }
  const readOnly = (issue: string) => {
    receipt.issues.push(issue)
    return { library: validateLibrary({ ...l, sources: [...l.sources, receipt] }), plan: undefined, issues: receipt.issues }
  }
  if (draft.baseRevision !== BASE_REVISION) return readOnly('Original saved for recovery. Its declared source revision does not match the available base.')
  let compiled: ReturnType<typeof applyStrategyOverlay>
  try { compiled = applyStrategyOverlay(base, draft) } catch (e) {
    return readOnly('Original saved for recovery. Source mapping failed: ' + (e as Error).message.slice(0, 500))
  }
  const players = base.team.players.map(p => ({
    ...v, id: newId(), name: p.name, appearance: /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : undefined, assessments: {},
  }))
  const leagueRef = reference(ttgva)
  const team = { ...v, id: newId(), name: 'Imported legacy roster', league: leagueRef, roster: players.map(reference) }
  const ids = new Map(base.team.initialOrder.map((old, index) => [old, 'slot-' + (index + 1)]))
  const lineup: Lineup = { ...v, id: newId(), name: 'Original six', adaptation: 'original', team: reference(team),
    slots: base.team.initialOrder.map(old => {
      const i = base.team.players.findIndex(p => p.id === old)
      return { id: ids.get(old)!, player: reference(players[i]), role: base.team.players[i].setter ? 'setter' : 'utility' }
    }) }
  const sourceCases = scenarioList(base)
  const cases: Case[] = []
  for (const [index, scenario] of scenarioList(compiled.bundle).entries()) {
    const original = sourceCases[index]
    const caseId = 'legacy-case-' + (index + 1)
    const olds = sourceEvents(original)
    const times = [...new Set([0, asMs(scenario.duration), ...olds.map(e => asMs(e.time)),
      ...scenario.phases.map(p => asMs(p.time)), ...scenario.ball.flatMap(f => [asMs(f.start), asMs(f.end)]),
      ...Object.values(scenario.tracks).flatMap(t => t.map(f => asMs(f.time)))])].sort((a, b) => a - b)
    const momentIds = new Map(times.map((time, i) => [time, 'm-' + (i + 1)]))
    receipt.eventMap.push(...olds.map(e => ({ caseId, old: e.id, moment: momentIds.get(asMs(e.time))! })))
    const stages = stageTimes(scenario)
    const key = (scenario.rotation + '/' + scenario.serve) as keyof NonNullable<NonNullable<typeof draft.notes>['team']>
    const changes = resolveStrategyRotation(draft, scenario)
    if (Object.values(scenario.tracks).some(track => track.some((frame, index) => frame.via?.length && index > 0 &&
      times.some(time => time > asMs(track[index - 1].time) && time < asMs(frame.time))))) {
      receipt.issues.push('R' + scenario.rotation + ' ' + scenario.serve + ', case ' + (index + 1) +
        ': intermediate moments preserve route bends but retime easing. Review motion before use.')
    }
    const moments: Moment[] = times.map((ms, i) => {
      const time = ms / 1000
      const phase = scenario.phases.find(p => asMs(p.time) === ms)
      const oldEvent = olds.find(event => asMs(event.time) === ms)
      const stage = (Object.keys(stages) as StrategyStage[]).find(s => asMs(stages[s]) === ms)
      const cue = [phase?.cue, stage && draft.notes?.team?.[key]?.[stage]].filter(Boolean).join(' · ').slice(0, 600)
      return { id: momentIds.get(ms)!, name: phase?.label ?? oldEvent?.label ?? (i ? 'Transition' : 'Start'), ms,
        ...(cue ? { cue } : {}), athletes: base.team.initialOrder.map(old => {
          const track = scenario.tracks[old], frame = sampleTrack(track, time)
          const oldId = old as PlayerId
          const oldCue = stage ? draft.notes?.players?.[key]?.[stage]?.[oldId] : undefined
          const instruction = oldCue && Object.values(oldCue).join(' · ').slice(0, 600)
          const patch = oldEvent && changes.eventOverrides?.[oldEvent.id]
          const area = (patch || undefined)?.coverage?.[oldId] ?? (stage ? changes.coverage?.[stage]?.[oldId] : undefined)
          const action = (patch || undefined)?.actions?.[oldId]
          const route = i ? incomingBends(track, times[i - 1] / 1000, time) : []
          return { slot: ids.get(old)!, position: { x: metres(frame.x), z: metres(frame.z) },
            duty: action ?? duties[frame.role], ...(instruction ? { cue: instruction } : {}), ...(route?.length ? { route } : {}),
            ...(area ? { coverage: area.vertices ? { kind: 'polygon' as const, vertices: area.vertices } : {
              kind: 'ellipse' as const, center: { x: Math.min(4.5, Math.max(-4.5, frame.x + (area.offsetX ?? 0))),
                z: Math.min(12, Math.max(0, frame.z + (area.offsetZ ?? 0))) }, radiusX: area.radiusX, radiusZ: area.radiusZ,
            } } : {}),
          }
        }) }
    })
    const endpointOwners = sourceEndpointOwners(scenario)
    const contacts = new Map<number, Contact>()
    const name = 'R' + scenario.rotation + ' · ' + (scenario.serve === 'us' ? 'We serve' : 'They serve') +
      ' · ' + (scenario.tactics?.opponentAttack ?? 'left') + (scenario.tactics?.firstTouch === 'harry' ? ' · setter first' : '')
    const flights = scenario.ball.map((f, i) => {
      const end = (side: 'from' | 'to') => {
        const ms = asMs(side === 'from' ? f.start : f.end)
        const point = f[side], owner = endpointOwners[i][side === 'from' ? 0 : 1], slot = owner && ids.get(owner)
        const following = scenario.ball[i + 1]
        const linked = side === 'to' && following?.start === f.end
        const outgoing = linked ? following : side === 'from' ? f : undefined
        const kind = outgoing?.kind === 'pass' && (scenario.serve === 'us' || ms > asMs(scenario.firstContact.time))
          ? 'dig' : outgoing ? contactKind[outgoing.kind] : f.kind === 'pass' && slot ? 'set' : 'land'
        const actor: Contact['actor'] = slot ? { kind: 'slot', slot, y: point.y }
          : { kind: point.z < 0 ? 'opponent' : 'court', point }
        const existing = contacts.get(ms)
        if (existing) {
          if (actor.kind === 'slot' && existing.actor.kind !== 'slot') {
            existing.actor = actor
            existing.kind = kind
          } else if (actor.kind === 'slot' && existing.actor.kind === 'slot' && actor.slot !== existing.actor.slot) {
            existing.actor = { kind: 'court', point }; existing.kind = 'unresolved'
          }
          return existing.id
        }
        const unresolved = !slot && point.z >= 0 && kind !== 'land'
        const c: Contact = { id: 'ball-' + (contacts.size + 1), moment: momentIds.get(ms)!, kind: unresolved ? 'unresolved' : kind, actor }
        contacts.set(ms, c)
        return c.id
      }
      return { from: end('from'), to: end('to'), apex: f.height }
    })
    const firstContactSlot = scenario.tactics?.firstTouch === 'harry' ? ids.get(original.firstContact.player) : undefined
    cases.push({ id: caseId, name, rotation: scenario.rotation, serve: scenario.serve,
      conditions: { attackSide: scenario.tactics?.opponentAttack, firstContactSlot }, moments, contacts: [...contacts.values()], flights, status: 'draft' })
    if ([...contacts.values()].some(c => c.kind === 'unresolved')) receipt.issues.push(name + ': some ball contacts need a mapped actor.')
  }
  const plan: Strategy = { ...v, id: newId(), name: draft.name, lineup: reference(lineup), league: leagueRef, status: 'draft',
    source: { id: receipt.id, sha256: receipt.sha256 }, cases }
  try {
    const library = validateLibrary({ ...l, players: [...l.players, ...players], teams: [...l.teams, team],
      lineups: [...l.lineups, lineup], leagues: l.leagues.some(x => x.id === ttgva.id) ? l.leagues : [...l.leagues, ttgva],
      sources: [...l.sources, receipt], plans: [...l.plans, plan] })
    return { library, plan: library.plans.at(-1)!, issues: receipt.issues }
  } catch (e) {
    receipt.eventMap = []
    receipt.issues = []
    return readOnly('Original saved for recovery. Conversion could not be validated: ' + (e as Error).message.slice(0, 500))
  }
}
