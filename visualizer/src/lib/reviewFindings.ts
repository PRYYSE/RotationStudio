import type { Bundle, Scenario } from './rotationTypes.ts'
import type { CaseKey, PlayerId, RotationKey, StrategyDraft, StrategyStage } from './strategyDraft.ts'
import { PLAYER_IDS, scenarioCaseKey, stageTimes } from './strategyDraft.ts'
import type { GroupedReviewFinding, ReviewDetail, ReviewFinding } from './reviewTypes.ts'
import { serviceDiagnostics, validateBundle } from './rotationValidation.ts'
import { movementIssue } from './receiveExample.ts'
import { isFront, positionOf, sampleTrack } from './rotationModel.ts'
import { eventLabel, metresBetween, timelinePath } from './reviewGeometry.ts'

export const authoredCases = (b: Bundle): Scenario[] => b.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])
export function authoredHitter(s: Scenario): PlayerId | null {
  const time = stageTimes(s).Attack
  const attack = s.ball.find(b => b.kind === 'attack' && b.start === time && b.from.z >= 0)
  const set = s.ball.find(b => b.kind === 'set' && b.end === time)
  if (!attack || !set || metresBetween(set.to, attack.from) > .01) return null
  const candidates = PLAYER_IDS.filter(id => {
    if (!s.tracks[id]?.length) return false
    const p = sampleTrack(s.tracks[id], time)
    return p.role === 'attack' && metresBetween(p, attack.from) < .1
  })
  // Ambiguous co-located attack roles do not author a named ball owner.
  return candidates.length === 1 ? candidates[0] : null
}

type FindingInput = Omit<ReviewFinding, 'affectedCases'>
type DetailInput = Partial<Omit<ReviewDetail, 'caseKey'>>
export function collectReviewFindings(bundle: Bundle, draft: StrategyDraft | null, overlayWarnings: string[] = [], published?: Bundle): GroupedReviewFinding[] {
  const cases = authoredCases(bundle), keys = cases.map(scenarioCaseKey).filter((k): k is CaseKey => !!k)
  const groups = new Map<string, GroupedReviewFinding>()
  function add(finding: FindingInput, affected: CaseKey[], detail?: DetailInput, cause = finding.summary) {
    const key = JSON.stringify([finding.code, finding.category, finding.severity, finding.source, finding.affectedStage, finding.playerId, cause])
    let group = groups.get(key)
    if (!group) { group = { ...finding, affectedCases: [], details: [] }; groups.set(key, group) }
    for (const caseKey of affected) {
      if (!group.affectedCases.includes(caseKey)) group.affectedCases.push(caseKey)
      const item = { caseKey, stage: finding.affectedStage, playerId: finding.playerId, message: finding.summary, ...detail }
      if (!group.details.some(d => JSON.stringify(d) === JSON.stringify(item))) group.details.push(item)
    }
  }
  const inferPlayer = (message: string) => PLAYER_IDS.find(id => message.toLowerCase().startsWith(id) || message.toLowerCase().startsWith(`${id}:`))
  function validator(message: string, affected: CaseKey[], raw: string) {
    const rule = /service contact|service-contact|service flight|back-row|cannot block|takes off inside/.test(message)
    const contact = /contact|pass must|ball segments|serve must|serve must originate/.test(message)
    const code = /service contact/.test(message) ? 'service-order' : /hold service-contact/.test(message) ? 'service-hold'
      : /second-contact athlete/.test(message) ? 'setter-target-link' : /pass must connect/.test(message) ? 'pass-link'
        : /share endpoints/.test(message) ? 'ball-continuity' : rule ? 'row-rule' : contact ? 'contact-link' : 'bundle-structure'
    const s = affected.length === 1 ? cases.find(s => scenarioCaseKey(s) === affected[0]) : undefined
    const stage: StrategyStage | undefined = rule && /service/.test(message) ? 'Start'
      : code === 'setter-target-link' ? 'Set' : code === 'pass-link' ? 'Receive'
        : /cannot block/.test(message) ? 'Defend' : /back-row attack/.test(message) ? 'Attack' : undefined
    const playerId = inferPlayer(message) ?? (code === 'setter-target-link' ? s?.secondContact.player : code === 'pass-link' ? s?.firstContact.player : undefined) as PlayerId | undefined
    add({ code, category: rule ? 'RULE' : contact ? 'CONTACT' : 'GEOMETRY_TIME', severity: 'INVALID',
      ...(stage ? { affectedStage: stage } : {}), ...(playerId ? { playerId } : {}),
      summary: rule && /service/.test(message) ? `Centre-point service screen: ${message}` : message,
      suggestedCheck: rule ? 'Check the required overlap and referee foot positions; use Reset or Undo to restore the draft.'
        : contact ? 'Check the named contact, target and route, or reset the affected stage.' : 'Inspect the source fields and affected case before using this draft.', source: 'validator' }, affected, { message: raw })
  }
  // All validator output is retained, including global structural messages.
  const validation = validateBundle(bundle)
  for (const raw of validation) {
    const match = /^R([1-6]) \/ (they|us) \/ (base|right|harry|harryRight): (.*)$/.exec(raw)
    if (match) {
      const [, rotation, serve, variant, message] = match
      const side = ['right', 'harryRight'].includes(variant) ? 'right' : 'left'
      const touch = ['harry', 'harryRight'].includes(variant) ? 'harry' : 'normal'
      validator(message, [`${rotation}/${serve}/${side}/${touch}` as CaseKey], raw)
    } else validator(raw, keys, raw)
  }
  for (let rotation = 1; rotation <= 6; rotation++) for (const serve of ['they', 'us'] as const)
    for (const side of ['left', 'right'] as const) for (const touch of ['normal', 'harry'] as const) {
      const key = `${rotation}/${serve}/${side}/${touch}` as CaseKey
      if (!keys.includes(key)) add({ code: 'case-not-authored', category: 'COVERAGE', severity: 'REVIEW',
        summary: 'Not authored for this case. No alternate has been generated.',
        suggestedCheck: 'Review the missing source coverage; select an existing authored example.', source: 'authored-data' }, [key])
    }
  for (const s of cases) {
    const key = scenarioCaseKey(s)
    if (!key) continue
    const affected = [key], times = stageTimes(s), hitter = authoredHitter(s)
    // Call independently: validateBundle may stop early after another error.
    for (const raw of serviceDiagnostics(bundle.team, s)) validator(raw, affected, raw)
    const movement = movementIssue(s)
    if (movement) add({ code: /spacing/.test(movement) ? 'teaching-spacing-screen' : 'teaching-movement-screen',
      category: 'GEOMETRY_TIME', severity: 'CAUTION', summary: movement,
      suggestedCheck: 'Inspect the timed paths. This teaching screen is not a measured athlete capability or a tactical verdict.', source: 'sampled-timeline' }, affected)
    // Identify each actor/interval without hiding a later travel cause behind
    // the teaching helper's first whole-scenario issue.
    for (const id of PLAYER_IDS) {
      const track = s.tracks[id]
      for (let i = 1; i < track.length; i++) {
        const a = track[i - 1], b = track[i]
        if (!movementIssue({ ...s, duration: b.time, tracks: { [id]: [a, b] } })) continue
        const path = timelinePath([a, b], a.time, b.time)
        path.from.label = eventLabel(s, a.time); path.to.label = eventLabel(s, b.time)
        const name = bundle.team.players.find(p => p.id === id)?.name ?? id
        const message = `${name}'s shown route covers ${path.pathMetres.toFixed(2)} m over ${path.availableSeconds.toFixed(2)} s in this example (${path.from.label} to ${path.to.label}).`
        const stage = (Object.keys(times) as StrategyStage[]).find(stage => Math.abs(times[stage] - b.time) < 1e-6)
        add({ code: 'actor-travel-screen', category: 'GEOMETRY_TIME', severity: 'CAUTION', playerId: id, affectedStage: stage,
          summary: `${name}'s shown route is flagged by the teaching movement screen. Inspect each affected timed interval.`,
          suggestedCheck: id === s.secondContact.player ? 'Check pass height and whether a nearby setter should take contact two.' : 'Check the authored time and route before the next contact.', source: 'sampled-timeline' },
        affected, { message, time: b.time, interval: path }, 'actor-travel-screen')
      }
      if (!isFront(positionOf(bundle.team, s.rotation, id)) || id === s.secondContact.player || id === hitter) continue
      const first = id === s.firstContact.player
      add({ code: first ? 'first-to-attack-review' : 'hitter-route-unmodelled', category: 'TACTICAL_REVIEW', severity: 'REVIEW', affectedStage: 'Attack', playerId: id,
        summary: first ? 'Conditional: needs sufficient time after passing.' : 'Eligible but not modelled as a ready hitter.',
        suggestedCheck: 'Review a separate second-contact-to-approach route before calling this athlete available.', source: 'authored-data' }, affected)
    }
    if (!hitter) add({ code: 'hitter-not-authored', category: 'TACTICAL_REVIEW', severity: 'REVIEW', affectedStage: 'Attack',
      summary: 'Shown third contact: Not authored for this case.', suggestedCheck: 'Check the source ball endpoint and named attack route; do not select a hitter from coordinates alone.', source: 'authored-data' }, affected)
    const original = published && authoredCases(published).find(v => scenarioCaseKey(v) === key)
    if (original) for (const stage of ['Receive', 'Set', 'Defend'] as const) for (const id of PLAYER_IDS) {
      const before = sampleTrack(original.tracks[id], times[stage]), after = sampleTrack(s.tracks[id], times[stage])
      if (metresBetween(before, after) < 1e-9) continue
      if (stage !== 'Set') add({ code: 'cover-placement-review', category: 'COVERAGE', severity: 'REVIEW', affectedStage: stage, playerId: id,
        summary: 'This edit changes a placement relative to the authored short/deep cover. Coverage areas are illustrative.',
        suggestedCheck: 'Check who takes the affected lane in this case; a coverage ellipse is not reach probability.', source: 'human-review' }, affected)
      if (id !== (stage === 'Receive' ? s.firstContact.player : stage === 'Set' ? s.secondContact.player : null)) continue
      add({ code: 'contact-placement-changed', category: 'CONTACT', severity: 'REVIEW', affectedStage: stage, playerId: id,
        summary: `The named ${stage === 'Receive' ? 'first' : 'second'} contact placement changed; ball endpoints follow the source contact identity.`,
        suggestedCheck: 'Check the linked ball and named actor at the authored event time.', source: 'authored-data' }, affected)
      if (draft?.schemaVersion === 2 && (draft.notes?.team?.[`${s.rotation}/${s.serve}` as RotationKey]?.[stage] || draft.notes?.players?.[`${s.rotation}/${s.serve}` as RotationKey]?.[stage]?.[id])) {
        add({ code: 'note-contact-review', category: 'TACTICAL_REVIEW', severity: 'REVIEW', affectedStage: stage, playerId: id,
          summary: `User-written notes need review against the changed ${id} contact placement; the named contact remains source-backed.`,
          suggestedCheck: 'Compare the exact user note with the displayed contact; notes do not change the source contact job.', source: 'human-review' }, affected)
      }
    }
  }
  for (const raw of overlayWarnings) {
    // Validator copies are already represented with complete original evidence.
    if (validation.includes(raw)) continue
    const exact = /^([1-6]\/(?:they|us)\/(?:left|right)\/(?:normal|harry)): (.*)$/.exec(raw)
    const coverage = exact && /assigned block coverage at (Start|Receive|Set|Attack|Defend|Later Defend) needs review\./.exec(exact[2])
    if (coverage) {
      add({ code: 'back-row-coverage-review', category: 'COVERAGE', severity: 'REVIEW',
        affectedStage: coverage[1] === 'Later Defend' ? 'Defend' : coverage[1] as StrategyStage,
        playerId: inferPlayer(exact![2]), summary: exact![2],
        suggestedCheck: 'Review this coach-assigned area and front/back-row eligibility. Coverage does not change source contact, ball or track roles.',
        source: 'human-review' }, [exact![1] as CaseKey], { message: raw })
      continue
    }
    const missing = !!exact && /missing/.test(exact[2])
    add({ code: missing ? 'later-defence-not-authored' : exact ? 'later-defence-screen' : /base revision/.test(raw) ? 'source-revision-review' : 'draft-template-review',
      category: missing ? 'COVERAGE' : exact ? 'GEOMETRY_TIME' : 'TACTICAL_REVIEW', severity: exact && !missing ? 'CAUTION' : 'REVIEW',
      ...(exact ? { affectedStage: 'Defend' as const, playerId: inferPlayer(exact[2]) } : {}),
      summary: exact ? exact[2] : raw, suggestedCheck: 'Review each affected authored case and its existing contact times before team use.', source: missing ? 'authored-data' : exact ? 'sampled-timeline' : 'human-review' },
    exact ? [exact[1] as CaseKey] : keys, { message: raw })
  }
  if (draft) for (const [rotationKey, changes] of Object.entries(draft.overrides)) {
    if (!changes || !Object.keys(changes).length) continue
    add({ code: 'shared-case-review', category: 'TACTICAL_REVIEW', severity: 'REVIEW',
      summary: 'This placement applies to four authored cases, but other receivers or hitters have not been newly optimised. Review each case before team use.',
      suggestedCheck: 'Inspect all four authored alternatives; other ball locations still need coaching review.', source: 'human-review' }, keys.filter(k => k.startsWith(`${rotationKey}/`)))
  }
  return [...groups.values()]
}
