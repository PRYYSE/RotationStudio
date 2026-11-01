import { phaseAt, sampleTrack } from './rotationModel.ts'
import { timelinePath } from './reviewGeometry.ts'
import type { CoachInstruction } from './strategyDraft.ts'
import type { Keyframe, Scenario, Spot, Team } from './rotationTypes.ts'

const substantive = (text?: string) => text?.trim() && !/needs coaching note|specific responsibility needs coaching review/i.test(text) ? text.trim() : null
export const focusRole = (role: string) => role === 'help' ? 'support position' : role
const where = (p: Spot) => `${p.z < 3 ? 'near-net' : p.z < 6 ? 'midcourt' : 'deep'} ${p.x < -1.5 ? 'left' : p.x > 1.5 ? 'right' : 'middle'}`
const distance = (a: Spot, b: Spot) => Math.hypot(a.x - b.x, a.z - b.z)

/** Display facts only: no eligibility-to-readiness or coverage inference. */
export function playerFocusStory(team: Team, scenario: Scenario, time: number, playerId: string | null, notes?: CoachInstruction | null, teamNote?: string | null, otherFirstTouch?: Scenario | null) {
  const name = (id: string | null) => team.players.find(p => p.id === id)?.name ?? 'not authored'
  const phase = phaseAt(scenario, time)
  const nextEvent = scenario.phases.find(p => p.time > time + 1e-6)
  const track = playerId ? scenario.tracks[playerId] : undefined
  const current = track?.length ? sampleTrack(track, time) : null
  const next = track?.length && nextEvent ? sampleTrack(track, nextEvent.time) : null
  // Later dig/set contacts are separate from the opening named pair. Only
  // identify a later owner when the ball and a unique matching track agree.
  const owner = (point: Spot, at: number, role: string) => {
    const ids = Object.keys(scenario.tracks).filter(id => {
      const p = sampleTrack(scenario.tracks[id], at)
      return p.role === role && distance(p, point) < .1
    })
    return ids.length === 1 ? ids[0] : null
  }
  const passes = scenario.ball.filter(b => b.kind === 'pass')
  const pass = [...passes].reverse().find(b => b.start <= time + 1e-6) ?? passes[0]
  const opening = !pass || Math.abs(pass.start - scenario.firstContact.time) < .001
  const first = opening ? scenario.firstContact.player : owner(pass.from, pass.start, 'pass')
  const second = opening ? scenario.secondContact.player : owner(pass.to, pass.end, 'set')
  const action = (p: Keyframe, at: number) => {
    if (playerId === scenario.firstContact.player && Math.abs(at - scenario.firstContact.time) < .001)
      return 'Named first contact in this example.'
    if (playerId === scenario.secondContact.player && Math.abs(at - scenario.secondContact.time) < .001)
      return 'Makes second contact in this example.'
    const contact = scenario.ball.find(b => Math.abs(b.start - at) < .001 && b.from.z >= 0 &&
      ((b.kind === 'pass' && p.role === 'pass') || (b.kind === 'set' && p.role === 'set') || (b.kind === 'attack' && p.role === 'attack')))
    if (contact && owner(contact.from, at, p.role) === playerId)
      return contact.kind === 'attack' ? 'Shown hitter on this ball.' : contact.kind === 'set' ? 'Makes second contact in this example.' : 'Named first contact in this example.'
    switch (p.role) {
      case 'start': {
        const serve = scenario.phases.find(p => p.label === 'Serve hit')
        return track && serve && sampleTrack(track, serve.time).role === 'serve'
          ? 'You serve in this example. Wait behind the endline until serve contact.'
          : 'Hold the displayed starting position until serve contact.'
      }
      case 'serve': return 'Serves from behind the endline in this example.'
      case 'help': return 'Shown in a support position.'
      case 'block': return 'Shown blocker.'
      case 'receive': return 'Shown in a receive position.'
      case 'pass': return 'Shown in a passing role.'
      case 'set': return playerId === second ? 'Second contact is yours in this example; shown in a setting role.' : 'Shown in a setting role.'
      case 'attack': return 'Shown in an attack role; a hit on this ball is not authored for you.'
      case 'defend': return 'Shown in a defensive position.'
      case 'recover': return 'Shown recovering.'
      default: return 'No specific player action is authored for this moment.'
    }
  }
  const primary = playerId ? substantive(notes?.primary) : substantive(teamNote ?? undefined)
  const teamFacts = `First contact: ${name(first)}. Second contact: ${name(second)} in this example sequence.`
  const now = playerId ? primary || (current ? action(current, time) : 'No specific player action is authored for this moment.')
    : primary ? `${primary} ${teamFacts}` : teamFacts
  const stationary = track && nextEvent && timelinePath(track, time, nextEvent.time).pathMetres < .01
  const destination = next && current ? `${stationary ? 'Hold that position; displayed ' + where(next) : 'Displayed destination: ' + where(next)} · ${focusRole(next.role)}.` : null
  const nextText = nextEvent ? destination || 'Next authored team phase.' : 'Rally example ends here.'
  const options = playerId ? [substantive(notes?.ifDifferent), substantive(notes?.fallback)].filter((v): v is string => !!v) : []
  // An If action is useful only when genuinely different from the selected branch.
  // Compare the opposite authored first-touch scenario, not the already selected contacts.
  const different = otherFirstTouch?.tactics && otherFirstTouch.rotation === scenario.rotation && otherFirstTouch.serve === scenario.serve &&
    otherFirstTouch.tactics.opponentAttack === scenario.tactics?.opponentAttack &&
    otherFirstTouch.tactics.firstTouch !== scenario.tactics?.firstTouch ? otherFirstTouch : null
  const alternative = opening && time <= scenario.secondContact.time && different
    ? `If ${name(different.firstContact.player)} takes first contact instead, ${name(different.secondContact.player)} makes second contact in the other authored branch.` : null
  const ifText = [...new Set(options)].join(' ') || alternative || 'No other specific option is authored for this moment.'
  return { now, primarySource: primary ? 'user-authored' : 'authored-data', nextEvent, nextText, ifText, current,
    moment: phase.label === 'Legal start' ? 'Before serve contact' : phase.label, location: current ? `Displayed position: ${where(current)}.` : null }
}
