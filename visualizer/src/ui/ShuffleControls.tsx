import { useEffect } from 'react'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { shuffleCases } from '../lib/rotationShuffle'

export function ShuffleControls() {
  const s = useRotations(), bundle = activeBundle(s), scenario = activeScenario(s)
  useEffect(() => {
    const hidden = () => { if (document.hidden) useRotations.getState().stopShuffle() }
    document.addEventListener('visibilitychange', hidden)
    return () => { document.removeEventListener('visibilitychange', hidden); useRotations.getState().stopShuffle() }
  }, [])
  const root = bundle?.plans.scenarios.find(p => p.rotation === s.rotation && p.serve === s.serve)
  if (s.editor || s.strategyMode || !scenario || shuffleCases(root, s.shuffleSeed).length !== 4) return null
  const caseId = `${s.rotation}/${s.serve}/${s.opponentAttack}/${s.firstTouch}`
  const receiver = bundle?.team.players.find(p => p.id === scenario.firstContact.player)?.name ?? scenario.firstContact.player
  return <section className="shuffle-controls" aria-label="Authored Shuffle Play">
    <div className="shuffle-row">
      <button aria-label="Shuffle Play" aria-pressed={s.shuffleEnabled} onClick={() => s.setShuffle(!s.shuffleEnabled)}>Shuffle {s.shuffleEnabled ? 'On' : 'Off'}</button>
      <button onClick={() => s.nextVariation()}>Next variation</button>
      <details className="shuffle-history">
        <summary>History</summary>
        <div>
          <label>Seed <input aria-label="Shuffle seed" type="number" min="0" max="4294967295" step="1" value={s.shuffleSeed} onChange={e => s.setShuffleSeed(Number(e.target.value))} /></label>
          <button disabled={s.shuffleCursor < 1} onClick={() => s.previousVariation()}>Previous variation</button>
          <p>Four authored cases in seeded order. R{s.rotation} / {s.serve === 'us' ? 'Us' : 'They'} serve stays fixed. On arms Shuffle; Play runs each complete track. Next restarts at source 0s. No draft is saved or approved.</p>
          <p>Teaching samples are outside this pool. History includes the starting case; the seed and starting case reproduce the order.</p>
          <ol aria-label="Shuffle case history">{s.shuffleHistory.map((key, i) => <li key={i} aria-current={i === s.shuffleCursor ? 'step' : undefined}>{key}{i === s.shuffleCursor ? ' (current)' : ''}</li>)}</ol>
        </div>
      </details>
    </div>
    <p className="shuffle-source" aria-label="Shuffle source" data-case={caseId} data-receiver={scenario.firstContact.player}>
      {s.example ? 'Teaching sample outside Shuffle' : s.draft ? 'Authored V3 + local draft' : 'Authored V3'} · {caseId} · our {s.opponentAttack} · {receiver} first · DRAFT
    </p>
    {s.shuffleNotice && <p className="shuffle-notice" role="status">{s.shuffleNotice}</p>}
  </section>
}
