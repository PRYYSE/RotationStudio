import type { Spot } from './rotationTypes.ts'
import type { CaseKey, CoachInstruction, PlayerId, RotationKey, StrategyStage } from './strategyDraft.ts'
import type { playerComparisonAt } from './reviewGeometry.ts'
import type { TimedPath } from './reviewGeometry.ts'

export type ReviewContext = {
  rotation: 1 | 2 | 3 | 4 | 5 | 6
  serve: 'they' | 'us'
  attackSide: 'left' | 'right'
  firstTouch: 'normal' | 'harry'
  stage: StrategyStage
  playerId: PlayerId | null
}
export type ReviewActor = {
  id: PlayerId
  number: 1 | 2 | 3 | 4 | 5 | 6
  frontEligible: boolean
  role: string
  point: Spot
  eventTime: number
  isNamedFirst: boolean
  isNamedSecond: boolean
  isAnimatedHitter: boolean
  isOtherFrontHitterOption: boolean
  // Legality does not certify route readiness. Only the animated ball has an
  // authored hitter trajectory; even a role=attack alternate can be unmodelled.
  availability: 'back-row' | 'second-contact' | 'conditional-after-first' | 'animated' | 'eligible-unmodelled'
  availabilityText: string
}
export type ReviewFinding = {
  code: string
  category: 'RULE' | 'GEOMETRY_TIME' | 'CONTACT' | 'COVERAGE' | 'TACTICAL_REVIEW'
  severity: 'INVALID' | 'CAUTION' | 'REVIEW'
  affectedCases: CaseKey[]
  affectedStage?: StrategyStage
  playerId?: PlayerId
  summary: string
  suggestedCheck: string
  source: 'validator' | 'sampled-timeline' | 'authored-data' | 'human-review'
}
export type ReviewDetail = {
  caseKey: CaseKey
  stage?: StrategyStage
  playerId?: PlayerId
  message: string
  time?: number
  interval?: TimedPath
}
// Expanded raw evidence survives grouping, including variant-specific wording.
export type GroupedReviewFinding = ReviewFinding & { details: ReviewDetail[] }
export type ReviewExplanation = {
  core: string
  team: string
  player: string | null
  conditional: string | null
  fallback: string | null
  teamCall: string | null
  teamSource: 'user-authored' | 'authored-data' | 'template'
  playerSource: 'user-authored' | 'template' | null
  needsCoachingNote: boolean
}
export type PlayerComparison = ReturnType<typeof playerComparisonAt>
export type ReviewProjection = {
  caseSource: 'published' | 'shared-draft' | 'case-specific'
  eventLabel: string
  eventTime: number
  actors: ReviewActor[]
  firstContact: PlayerId
  secondContact: PlayerId
  animatedHitter: PlayerId | null
  eligibleFrontAttackers: PlayerId[]
  setterTarget: Spot
  notes: { team: string | null; player: CoachInstruction | null }
  reviewFindings: GroupedReviewFinding[]
  nextEvent?: { label: string; time: number }
  explanation: ReviewExplanation
  sourceCoachNote: string | null
  noteScope: { rotationKey: RotationKey; stage: StrategyStage; playerId: PlayerId | null; provenance: 'user-authored' }
  comparison: null | {
    baseline: PlayerComparison
    current: PlayerComparison
    displacementMetres: number
    delta: Spot
    pathDeltaMetres: number
    // Actual changed authored timelines, distinct from nominal edit scope.
    affectedCases: CaseKey[]
    scopeCases: CaseKey[]
    caseChanges: { caseKey: CaseKey; pointChanged: boolean; pathChanged: boolean }[]
  }
}
