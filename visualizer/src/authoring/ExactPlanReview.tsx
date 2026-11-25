import { useState } from 'react'
import { compile, playbackAt } from '../domain/playback'
import type { Review } from '../domain/contracts'
import { AuthoringCourt } from './AuthoringCourt'

export function ExactPlanReview({ review, onClose, onCopy }: { review: Review; onClose(): void; onCopy(): void }) {
  const scenario = review.snapshot.cases[0]
  const [momentId, setMoment] = useState(review.momentId)
  const compiled = compile(scenario)
  const moment = compiled.moments.find(m => m.id === momentId)!
  const frame = playbackAt(compiled, moment.ms / 1000)
  return <section className="s1-card s1-form" aria-label="Exact plan review">
    <h2>{review.snapshot.name} · For review</h2>
    <p>{scenario.name} · revision {review.strategy.revision} · read-only</p>
    <label>Review moment<select value={momentId} onChange={e => setMoment(e.target.value)}>
      {compiled.moments.map(m => <option value={m.id} key={m.id}>{m.name} · {m.ms / 1000}s</option>)}
    </select></label>
    <AuthoringCourt players={review.snapshot.slots} positions={frame.positions} slot="" route={[]} ball={frame.ball}
      exhibit onSelect={() => {}} onMove={() => {}} />
    <div className="s1-row"><button onClick={onClose}>Close exact review</button><button onClick={onCopy}>Make my own draft copy</button></div>
  </section>
}
