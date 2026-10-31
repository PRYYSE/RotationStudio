import { activeBundle, useRotations } from '../state/rotationStore'
import { positionOf } from '../lib/rotationModel'
import type { ReviewProjection } from '../lib/reviewTypes'
import { useStrategies } from '../state/strategyStore'
import { useDesktopWorkbench } from './useDesktopWorkbench'

export function PlayerFocus({ review }: { review: ReviewProjection | null }) {
  const s = useRotations(), team = activeBundle(s)!.team
  const desktop = useDesktopWorkbench()
  const working = useStrategies(state => state.working)
  const name = (id: string | null) => team.players.find(p => p.id === id)?.name ?? 'not authored'
  const actor = review?.actors.find(a => a.id === s.selected)
  const explanation = review?.explanation
  const caseKey = `${s.rotation}/${s.serve}/${s.opponentAttack}/${s.firstTouch}`
  const finding = review?.reviewFindings.find(f => f.affectedCases.some(key => key === caseKey) && (!f.playerId || f.playerId === actor?.id))
  const meaningfulFallback = !!explanation?.fallback && !/needs coaching note|specific responsibility needs coaching review/i.test(explanation.fallback)
  return <section className="player-focus" aria-label="Player focus">
    <label className="focus-selector">{actor ? `Focus: ${name(actor.id)}` : 'Whole team'}
      <select aria-label="Whole team or player" value={actor?.id ?? ''} onChange={e => useRotations.setState({ selected: e.target.value })}>
        <option value="">Whole team</option>
        {team.players.map(p => <option key={p.id} value={p.id}>{p.name} · P{positionOf(team, s.rotation, p.id)}</option>)}
      </select>
    </label>
    <p className="focus-source">{s.example ? s.exampleResult?.ok === false ? 'No feasible authored example · previous animation retained' : 'Teaching example · read-only'
      : s.draft && !working ? 'Advanced V3 draft · original-source coaching prompts · Needs review'
        : review?.caseSource === 'published' ? 'Published V3 example · DRAFT' : review?.caseSource === 'case-specific' ? 'Explicitly edited case · Needs review' : 'Edited foundation · Needs review'}</p>
    {review && <>
      <h2>{review.eventLabel === 'Legal start' ? 'At serve contact' : review.eventLabel} · {review.eventTime.toFixed(2)}s</h2>
      {actor && <p className="focus-position">P{actor.number} · {actor.frontEligible ? 'Front eligible' : 'Back row'} · {actor.role}
        {!desktop && <><br />X {actor.point.x.toFixed(2)} · Z {actor.point.z.toFixed(2)} m</>}</p>}
      {desktop && <p className="focus-now-label">Now · Your responsibility</p>}
      <p className="focus-primary" data-source={explanation?.playerSource ?? explanation?.teamSource}>{explanation?.player || explanation?.team || explanation?.core || 'No specific action is authored for this moment.'}</p>
      {desktop && review.nextEvent && <p className="focus-next-moment"><strong>Coming up</strong> · {review.nextEvent.label}</p>}
      {explanation?.conditional && <p><strong>If different: </strong>{explanation.conditional}</p>}
      {(!desktop || meaningfulFallback) && <p className="focus-fallback"><strong>Fallback: </strong>{explanation?.fallback || 'Specific responsibility needs coaching review.'}</p>}
      {explanation?.teamCall && <p>Team call: {explanation.teamCall}</p>}
      {finding && <p className="focus-fallback">{finding.severity} · {finding.summary} {finding.suggestedCheck}</p>}
      <details><summary>{desktop ? 'Tactical details & full roster' : 'Contact facts & full roster'}</summary>
        {desktop && actor && <p>Precise position · X {actor.point.x.toFixed(2)} · Z {actor.point.z.toFixed(2)} m</p>}
        {desktop && !meaningfulFallback && <p>Alternative not yet coached for this moment. This play remains a tactical draft.</p>}
        <p>{explanation?.core}</p>
        <p>{explanation?.team}</p>
        <p>First: {name(review.firstContact)} · Second: {name(review.secondContact)} · Animated hitter: {name(review.animatedHitter)}</p>
        {review.nextEvent && <p>Next: {review.nextEvent.label} · {review.nextEvent.time.toFixed(2)}s</p>}
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
