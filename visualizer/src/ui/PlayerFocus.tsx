import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { phaseAt, positionOf, selectScenario } from '../lib/rotationModel'
import { focusRole, playerFocusStory } from '../lib/playerFocusStory'
import type { ReviewProjection } from '../lib/reviewTypes'
import { useStrategies } from '../state/strategyStore'
import { useDesktopWorkbench } from './useDesktopWorkbench'

export function PlayerFocus({ review }: { review: ReviewProjection | null }) {
  const s = useRotations(), bundle = activeBundle(s)!, team = bundle.team
  const desktop = useDesktopWorkbench()
  const working = useStrategies(state => state.working)
  const name = (id: string | null) => team.players.find(p => p.id === id)?.name ?? 'not authored'
  const actor = review?.actors.find(a => a.id === s.selected)
  const explanation = review?.explanation
  const scenario = activeScenario(s)
  const otherTouch = s.firstTouch === 'harry' ? 'normal' : 'harry'
  const rootScenario = bundle.plans.scenarios.find(p => p.rotation === s.rotation && p.serve === s.serve)
  const otherCase = !s.example && rootScenario ? selectScenario(rootScenario, s.opponentAttack, otherTouch) : null
  const alternate = otherCase?.tactics?.firstTouch === otherTouch && otherCase.tactics.opponentAttack === s.opponentAttack ? otherCase : null
  // A stage note must not leak into a later source occurrence (e.g. Next dig).
  const noteMoment = scenario && review && Math.abs(phaseAt(scenario, s.time).time - review.eventTime) < .001
  const story = desktop && scenario && review ? playerFocusStory(team, scenario, s.time, actor?.id ?? null,
    noteMoment ? review.notes.player : null, noteMoment ? review.notes.team : null, alternate) : null
  const nextMoment = desktop ? story?.nextEvent : review?.nextEvent
  const caseKey = `${s.rotation}/${s.serve}/${s.opponentAttack}/${s.firstTouch}`
  const finding = review?.reviewFindings.find(f => f.affectedCases.some(key => key === caseKey) && (!f.playerId || f.playerId === actor?.id))
  const invalidFinding = review?.reviewFindings.find(f => f.severity === 'INVALID' && f.affectedCases.some(key => key === caseKey) && (!f.playerId || f.playerId === actor?.id))
  const meaningfulFallback = !!explanation?.fallback && !/needs coaching note|specific responsibility needs coaching review/i.test(explanation.fallback)
  const selector = <label className={desktop ? 'focus-selector focus-identity-select' : 'focus-selector'}>{!desktop && (actor ? `Focus: ${name(actor.id)}` : 'Whole team')}
      <select aria-label="Whole team or player" value={actor?.id ?? ''} onChange={e => useRotations.setState({ selected: e.target.value })}>
        <option value="">Whole team</option>
        {team.players.map(p => <option key={p.id} value={p.id}>{p.name} · P{positionOf(team, s.rotation, p.id)}</option>)}
      </select>
    </label>
  const provenance = <p className="focus-source">{s.example ? s.exampleResult?.ok === false ? 'No feasible authored example · previous animation retained' : 'Teaching example · read-only'
      : s.draft && !working ? 'Advanced V3 draft · original-source coaching prompts · Needs review'
        : review?.caseSource === 'published' ? 'Published V3 example · DRAFT' : review?.caseSource === 'case-specific' ? 'Explicitly edited case · Needs review' : 'Edited foundation · Needs review'}</p>
  return <section className="player-focus" aria-label="Player focus">
    {desktop ? selector : <>{selector}{provenance}</>}
    {review && <>
      {desktop ? <p className="focus-moment">{story?.moment ?? review.eventLabel}</p>
        : <h2>{review.eventLabel === 'Legal start' ? 'At serve contact' : review.eventLabel} · {review.eventTime.toFixed(2)}s</h2>}
      {actor && <p className="focus-position">P{actor.number} · {actor.frontEligible ? 'Front eligible' : 'Back row'} · {desktop ? focusRole(story?.current?.role ?? actor.role) : actor.role}
        {!desktop && <><br />X {actor.point.x.toFixed(2)} · Z {actor.point.z.toFixed(2)} m</>}</p>}
      {desktop && story ? <dl className="focus-story">
        <div><dt>Now</dt><dd><p className="focus-primary" data-source={story.primarySource}>{story.now}</p>
          {story.location && <p className="focus-location">{story.location}</p>}</dd></div>
        <div className="focus-next-moment"><dt>Next</dt><dd>{story.nextEvent && <strong>{story.nextEvent.label}</strong>}<p>{story.nextText}</p></dd></div>
        <div className="focus-option"><dt>If</dt><dd>{story.ifText}</dd></div>
      </dl> : <>
      <p className="focus-primary" data-source={explanation?.playerSource ?? explanation?.teamSource}>{explanation?.player || explanation?.team || explanation?.core || 'No specific action is authored for this moment.'}</p>
      {explanation?.conditional && <p><strong>If different: </strong>{explanation.conditional}</p>}
      {(!desktop || meaningfulFallback) && <p className="focus-fallback"><strong>Fallback: </strong>{explanation?.fallback || 'Specific responsibility needs coaching review.'}</p>}
      </>}
      {explanation?.teamCall && (!desktop || noteMoment) && <p>Team call: {explanation.teamCall}</p>}
      {desktop && invalidFinding && <p className="focus-invalid" role="alert">Rule issue · {invalidFinding.summary}</p>}
      {!desktop && finding && <p className="focus-fallback">{finding.severity} · {finding.summary} {finding.suggestedCheck}</p>}
      <details><summary>{desktop ? 'Tactical details' : 'Contact facts & full roster'}</summary>
        {desktop && <>{provenance}<p>R{s.rotation} · {s.serve === 'us' ? 'Our serve' : 'Their serve'} · Attack toward our {s.opponentAttack} · {s.firstTouch === 'harry' ? 'Harry first' : 'Normal first touch'}</p></>}
        {desktop && actor && <p>Precise position · X {(story?.current ?? actor.point).x.toFixed(2)} · Z {(story?.current ?? actor.point).z.toFixed(2)} m</p>}
        {desktop && finding && <p className="focus-fallback">{finding.severity} · {finding.summary} {finding.suggestedCheck}</p>}
        {desktop && <p>Displayed positions and roles describe this example; they do not establish coverage or hit readiness.</p>}
        <p>{explanation?.core}</p>
        <p>{explanation?.team}</p>
        <p>{desktop ? 'Opening first' : 'First'}: {name(review.firstContact)} · Second: {name(review.secondContact)} · Animated hitter: {name(review.animatedHitter)}</p>
        {nextMoment && <p>Next: {nextMoment.label} · {nextMoment.time.toFixed(2)}s</p>}
        <p>X: court left/right, 0 centre; Z: distance back from net in metres.</p>
        <ul className="focus-roster">{review.actors.map(a => <li key={a.id}>
          <button aria-pressed={s.selected === a.id} onClick={() => useRotations.setState({ selected: a.id })}>
            <i style={{ background: team.players.find(p => p.id === a.id)?.color }} />{name(a.id)} · P{a.number} · {a.role}
          </button><span>{a.availabilityText}</span>
        </li>)}</ul>
        {review.sourceCoachNote && <p>Source note: {review.sourceCoachNote}</p>}
        <p>This is an authored example, not the only possible first touch. DRAFT; not match-approved.</p>
      </details>
    </>}
  </section>
}
