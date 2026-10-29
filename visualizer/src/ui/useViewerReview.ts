import { useMemo } from 'react'
import { createReviewModel } from '../lib/caseReview'
import { coachProjection } from '../lib/coachProjection'
import { authoredHitter } from '../lib/reviewFindings'
import { sampleTrack } from '../lib/rotationModel'
import { PLAYER_IDS, stageTimes, type PlayerId, type StrategyStage } from '../lib/strategyDraft'
import type { ReviewContext } from '../lib/reviewTypes'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'

export function useViewerReview(stage: StrategyStage) {
  const s = useRotations(), working = useStrategies(state => state.working)
  // MUST remain keyed only by immutable source and working-strategy identities.
  // No 48-case validation when playback, focus, stage or rotation changes.
  const model = useMemo(() => s.published ? createReviewModel(s.published, working) : null, [s.published, working])
  const playerId = PLAYER_IDS.includes(s.selected as PlayerId) ? s.selected as PlayerId : null
  return useMemo(() => {
    if (!model) return null
    const context: ReviewContext = { rotation: s.rotation as ReviewContext['rotation'], serve: s.serve,
      attackSide: s.opponentAttack, firstTouch: s.firstTouch, stage, playerId }
    const projection = model.project(context)
    // Samples have a separate read-only provenance. Their contact/role facts
    // must describe the actual last valid animation, not the authored template.
    const scenario = activeScenario(s), team = activeBundle(s)?.team
    const teaching = !!s.example && !!s.exampleScenario
    const advancedDraft = !!s.draft && !working
    if ((!teaching && !advancedDraft) || !scenario || !team) return projection
    const time = stageTimes(scenario)[stage]
    const hitter = authoredHitter(scenario)
    const actors = projection.actors.map(a => {
      const p = sampleTrack(scenario.tracks[a.id], time)
      const isNamedFirst = a.id === scenario.firstContact.player, isNamedSecond = a.id === scenario.secondContact.player
      const availability = !a.frontEligible ? 'back-row' : isNamedSecond ? 'second-contact' : isNamedFirst ? 'conditional-after-first' : a.id === hitter ? 'animated' : 'eligible-unmodelled'
      const availabilityText = availability === 'conditional-after-first' ? 'Conditional: needs sufficient time after passing.'
        : availability === 'eligible-unmodelled' ? 'Eligible but not modelled as a ready hitter.'
          : availability === 'second-contact' ? 'Front-eligible; makes second contact in this teaching example.'
            : availability === 'animated' ? 'Animated hitter in this teaching example.' : 'Back-row; not a front-row attack option.'
      return { ...a, point: { x: p.x, z: p.z }, role: p.role, eventTime: time, isNamedFirst, isNamedSecond,
        isAnimatedHitter: a.id === hitter, isOtherFrontHitterOption: a.frontEligible && !isNamedSecond && a.id !== hitter,
        availability: availability as typeof a.availability, availabilityText }
    })
    const notes = { team: null, player: null }
    const explanation = coachProjection(team, scenario, context, actors, hitter, notes, time)
    // Locked templates refer to authored examples; samples are explicitly named.
    if (teaching) {
      explanation.core = explanation.core.replaceAll('authored example', 'teaching example')
      explanation.team = explanation.team.replaceAll('authored example', 'teaching example')
      explanation.player = explanation.player?.replaceAll('authored example', 'teaching example') ?? null
    }
    const next = scenario.phases.find(p => p.time > time)
    return { ...projection, actors, eventTime: time, eventLabel: scenario.phases.find(p => Math.abs(p.time - time) < .001)?.label ?? stage,
      firstContact: scenario.firstContact.player as PlayerId, secondContact: scenario.secondContact.player as PlayerId,
      animatedHitter: hitter, eligibleFrontAttackers: actors.filter(a => a.frontEligible && !a.isNamedSecond).map(a => a.id),
      explanation, notes, comparison: null, nextEvent: next ? { label: next.label, time: next.time } : undefined }
  }, [model, s.rotation, s.serve, s.opponentAttack, s.firstTouch, stage, playerId, s.example, s.exampleScenario, s.draft, working])
}
