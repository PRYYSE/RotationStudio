import type { Scenario, Team } from './rotationTypes.ts'
import type { CoachInstruction, PlayerId } from './strategyDraft.ts'
import type { ReviewActor, ReviewContext, ReviewExplanation } from './reviewTypes.ts'

/** Locked, data-bound copy. User notes are separate evidence, never a verdict. */
export function coachProjection(team: Team, s: Scenario, context: ReviewContext, actors: ReviewActor[], hitter: PlayerId | null,
  notes: { team: string | null; player: CoachInstruction | null }, eventTime: number): ReviewExplanation {
  const name = (id: string | null) => team.players.find(p => p.id === id)?.name ?? 'not authored'
  const actor = actors.find(a => a.id === context.playerId)
  const others = actors.filter(a => a.isOtherFrontHitterOption).map(a => name(a.id)).join(', ') || 'none'
  let core: string, player: string | null = null
  switch (context.stage) {
    case 'Start':
      core = `R${context.rotation}, ${context.serve === 'they' ? 'They' : 'Us'} serve. Hold your rotational order until service contact.`
      if (actor) player = `${name(actor.id)} begins P${actor.number}. After contact you may move to your next displayed responsibility.` +
        (context.serve === 'us' && actor.number === 1 ? ' Serve from behind the baseline, then recover to the displayed role.' : '')
      break
    case 'Receive':
      core = `Sample first touch: ${name(s.firstContact.player)}. Pass toward the marked setter window.`
      if (actor) player = actor.isNamedFirst
        ? 'You are the named first passer in this authored example, not necessarily every serve/dig.'
        : 'Stay available for your nearby seam/next role; the shown sample does not cover all ball locations.'
      if (s.firstContact.player === 'harry') core += ` A named backup, ${name(s.secondContact.player)}, makes contact two.`
      break
    case 'Set':
      core = `Second contact: ${name(s.secondContact.player)}; shown setter target is the gold ring.`
      if (actor) player = actor.isNamedSecond ? 'Get to the shown setting window, if the ball and time allow.'
        : actor.frontEligible ? 'You may be a front-row attack option, even if another athlete is animated to hit.'
          : 'Keep your covering role; do not pretend you can make a front-row attack.'
      break
    case 'Attack':
      core = `Shown third contact: ${name(hitter)}. Other eligible front athletes: ${others}.`
      if (actor) player = actor.isAnimatedHitter ? 'Approach the displayed ball; teammates cover a possible block.'
        : actor.isNamedSecond ? `${name(actor.id)} makes second contact in this authored example.`
          : !actor.frontEligible ? 'Keep your covering role; do not pretend you can make a front-row attack.'
            : actor.availabilityText
      break
    case 'Defend':
      core = 'Defend this shown opponent attack. Follow your marked local lane and read the actual ball.'
      if (actor) player = actor.frontEligible && actor.role === 'block' ? 'Shown blocker: watch their hitter.'
        : !actor.frontEligible ? 'Stay ready for deep/tip/cover as assigned by this draft example.'
          : 'Specific responsibility needs coaching review.'
      break
  }
  // Do not let a generic front-hitter template erase a first-touch constraint.
  if (actor?.availability === 'conditional-after-first' && ['Set', 'Attack'].includes(context.stage)) player = actor.availabilityText
  const cue = s.phases.find(p => Math.abs(p.time - eventTime) < 1e-6)?.cue
  const teamText = notes.team || (context.stage === 'Attack' && !hitter ? `${core}${cue ? ` ${cue}` : ''}` : cue || core)
  return { core, team: teamText, player: notes.player?.primary || player,
    conditional: notes.player?.ifDifferent || (actor?.availability === 'conditional-after-first' ? actor.availabilityText : null),
    fallback: notes.player?.fallback || (actor && !notes.player?.primary ? 'Needs coaching note' : null),
    teamCall: notes.player?.teamCall || null,
    teamSource: notes.team ? 'user-authored' : cue ? 'authored-data' : 'template',
    playerSource: notes.player?.primary ? 'user-authored' : actor ? 'template' : null,
    needsCoachingNote: !!actor && !notes.player?.primary }
}
