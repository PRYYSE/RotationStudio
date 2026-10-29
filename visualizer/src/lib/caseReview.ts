import type { Bundle, Scenario } from './rotationTypes.ts'
import type { CaseKey, PlayerId, RotationKey, StrategyDraft } from './strategyDraft.ts'
import { laterDefendTime, PLAYER_IDS, scenarioCaseKey, stageTimes, validateStrategy } from './strategyDraft.ts'
import { applyStrategyOverlay } from './strategyOverlay.ts'
import { isFront, positionOf, sampleTrack } from './rotationModel.ts'
import { coachProjection } from './coachProjection.ts'
import { authoredCases, authoredHitter, collectReviewFindings } from './reviewFindings.ts'
import { eventLabel, metresBetween, playerComparisonAt, reviewPoint } from './reviewGeometry.ts'
import type { ReviewActor, ReviewContext, ReviewProjection } from './reviewTypes.ts'
export type { ReviewActor, ReviewContext, ReviewFinding, GroupedReviewFinding, ReviewProjection } from './reviewTypes.ts'

function exactCase(bundle: Bundle, key: CaseKey): Scenario {
  const s = authoredCases(bundle).find(s => scenarioCaseKey(s) === key)
  if (!s || s.teachingOnly) throw new Error(`Not authored for this case: ${key}. Teaching examples require their separate read-only projection.`)
  return s
}
// {} is not an edit; [] and false are explicit route/scalar instructions.
function hasEdit(value: unknown): boolean {
  return Array.isArray(value) || (value !== null && typeof value === 'object'
    ? Object.values(value).some(hasEdit) : value !== undefined)
}
const ownScenario = ({ alternates: _alternates, ...s }: Scenario) => s
const routeGeometry = (s: Scenario, id: PlayerId, start: number, end: number) => JSON.stringify([
  reviewPoint(sampleTrack(s.tracks[id], start)),
  ...s.tracks[id].filter(k => k.time > start && k.time <= end).map(k => ({ time: k.time, ...reviewPoint(k), via: k.via ?? [] }))
])

/** Pure read model. Supply immutable published V3, never a previously overlaid
 * bundle or teaching sample. The effective draft is derived here exactly once.
 * Findings cover all authored cases; affectedCases/details carry their scope.
 * laterDefend selects the nested own-serve event, not a sixth editor stage.
 */
export function createReviewProjection(published: Bundle, draft: StrategyDraft | null, context: ReviewContext,
  options: { laterDefend?: boolean } = {}): ReviewProjection {
  return createReviewModel(published, draft).project(context, options)
}

/** Derive once per immutable source/draft value, then select any case/stage.
 * The returned selector owns no mutable scenario state or global cache.
 */
export function createReviewModel(published: Bundle, draft: StrategyDraft | null) {
  if (draft) validateStrategy(draft)
  const derived = draft ? applyStrategyOverlay(published, draft) : { bundle: published, warnings: [] }
  const findings = collectReviewFindings(derived.bundle, draft, derived.warnings, published)
  return { project }

  function project(context: ReviewContext, options: { laterDefend?: boolean } = {}): ReviewProjection {
    const key: CaseKey = `${context.rotation}/${context.serve}/${context.attackSide}/${context.firstTouch}`
    const rotationKey: RotationKey = `${context.rotation}/${context.serve}`
    const source = exactCase(published, key)
    const s = exactCase(derived.bundle, key), time = options.laterDefend ? laterDefendTime(s) : stageTimes(s)[context.stage]
    if (time === undefined || (options.laterDefend && context.stage !== 'Defend')) throw new Error('Later defence requires the authored own-serve Defend again event and Defend stage.')
    for (const contact of [s.firstContact, s.secondContact]) if (!PLAYER_IDS.includes(contact.player as PlayerId)) throw new Error('Named contact: Not authored for this case.')
    const hitter = authoredHitter(s)
    const actors: ReviewActor[] = PLAYER_IDS.map(id => {
      const number = positionOf(published.team, s.rotation, id) as ReviewActor['number']
      const p = sampleTrack(s.tracks[id], time), frontEligible = isFront(number)
      const isNamedFirst = id === s.firstContact.player, isNamedSecond = id === s.secondContact.player, isAnimatedHitter = id === hitter
      const availability = !frontEligible ? 'back-row' : isNamedSecond ? 'second-contact' : isNamedFirst ? 'conditional-after-first'
        : isAnimatedHitter ? 'animated' : 'eligible-unmodelled'
      const availabilityText = availability === 'back-row' ? 'Back-row; not a front-row attack option.'
        : availability === 'second-contact' ? 'Front-eligible; makes second contact in this authored example.'
          : availability === 'conditional-after-first' ? 'Conditional: needs sufficient time after passing.'
            : availability === 'animated' ? 'Animated hitter in this authored example.' : 'Eligible but not modelled as a ready hitter.'
      return { id, number, frontEligible, role: p.role, point: reviewPoint(p), eventTime: time,
        isNamedFirst, isNamedSecond, isAnimatedHitter, isOtherFrontHitterOption: frontEligible && !isNamedSecond && !isAnimatedHitter,
        availability, availabilityText }
    })
    const notes = { team: draft?.schemaVersion === 2 ? draft.notes?.team?.[rotationKey]?.[context.stage] ?? null : null,
      player: draft?.schemaVersion === 2 && context.playerId ? structuredClone(draft.notes?.players?.[rotationKey]?.[context.stage]?.[context.playerId] ?? null) : null }
    const phase = s.phases.find(p => p.time > time)
    const exact = draft?.schemaVersion === 2 && hasEdit(draft.caseOverrides?.[key])
    const reviewFindings = structuredClone(findings)
    let comparison: ReviewProjection['comparison'] = null
    if (context.playerId) {
      const id = context.playerId, baseline = playerComparisonAt(source, context.stage, id, time, !!options.laterDefend)
      const current = playerComparisonAt(s, context.stage, id, time, !!options.laterDefend)
      const siblings = authoredCases(derived.bundle).filter(v => v.rotation === s.rotation && v.serve === s.serve)
      const affectedCases: CaseKey[] = [], caseChanges: NonNullable<ReviewProjection['comparison']>['caseChanges'] = []
      for (const v of siblings) {
        const caseKey = scenarioCaseKey(v)!, original = exactCase(published, caseKey)
        if (JSON.stringify(ownScenario(v)) !== JSON.stringify(ownScenario(original))) affectedCases.push(caseKey)
        // All variants sampled at the same selected occurrence in their own
        // authored timeline; baseline/current within a case use identical times.
        const eventTime = options.laterDefend ? laterDefendTime(v) : stageTimes(v)[context.stage]
        if (eventTime === undefined) continue
        const before = playerComparisonAt(original, context.stage, id, eventTime, !!options.laterDefend)
        const after = playerComparisonAt(v, context.stage, id, eventTime, !!options.laterDefend)
        caseChanges.push({ caseKey, pointChanged: metresBetween(before.point, after.point) > 1e-9,
          pathChanged: routeGeometry(original, id, before.incoming.from.time, eventTime) !== routeGeometry(v, id, after.incoming.from.time, eventTime) })
      }
      comparison = { baseline, current, displacementMetres: metresBetween(baseline.point, current.point),
        delta: { x: current.point.x - baseline.point.x, z: current.point.z - baseline.point.z },
        pathDeltaMetres: current.incoming.pathMetres - baseline.incoming.pathMetres, affectedCases,
        scopeCases: draft ? exact ? [key] : siblings.map(v => scenarioCaseKey(v)!) : [], caseChanges }
    }
    return { caseSource: exact ? 'case-specific' : draft ? 'shared-draft' : 'published',
      eventLabel: eventLabel(s, time), eventTime: time, actors,
      firstContact: s.firstContact.player as PlayerId, secondContact: s.secondContact.player as PlayerId, animatedHitter: hitter,
      eligibleFrontAttackers: actors.filter(a => a.frontEligible && !a.isNamedSecond).map(a => a.id), setterTarget: reviewPoint(s.setterTarget),
      notes, reviewFindings, ...(phase ? { nextEvent: { label: phase.label, time: phase.time } } : {}),
      explanation: coachProjection(derived.bundle.team, s, context, actors, hitter, notes, time), sourceCoachNote: s.tactics?.coachNote ?? null,
      noteScope: { rotationKey, stage: context.stage, playerId: context.playerId, provenance: 'user-authored' }, comparison }
  }
}
