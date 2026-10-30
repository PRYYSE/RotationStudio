import { useEffect, useRef, useState } from 'react'
import type { SourceEvent } from '../lib/strategyEvents'

// The everyday workflow is the V4-style one: choose the next formation,
// drag athletes into place, and let their authored tracks draw the route.
// Full source moments remain available for later/alternate contacts.
const primaryLabels: Record<string, string> = {
  'Legal start': 'Start',
  'Defence ready': 'Defend',
  'Our dig': 'Receive / dig',
  'First pass': 'Receive / dig',
  'Second contact': 'Set',
  'Our attack': 'Attack',
  'Defend again': 'Recover',
  'Their attack': 'Block / defend',
  'Their next attack': 'Block / defend',
  'Next dig': 'Next dig',
  'Next set ready': 'Next set',
}

export function DesktopEventRail({ events, selectedId, onSelect, disabled }: {
  events: SourceEvent[]; selectedId?: string; onSelect: (id: string) => void; disabled: boolean
}) {
  const rail = useRef<HTMLOListElement>(null)
  const [allMoments, setAllMoments] = useState(false)
  const primary = events.filter(e => primaryLabels[e.label])
  const selectedIsPrimary = primary.some(e => e.id === selectedId)
  useEffect(() => {
    if (selectedId && !selectedIsPrimary) setAllMoments(true)
  }, [selectedId, selectedIsPrimary])
  useEffect(() => {
    if (allMoments) rail.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  }, [selectedId, allMoments])

  return <section className="desktop-event-rail" aria-label="Rally editing stages">
    <div className="sequence-heading">
      <strong>Build your play</strong>
      <span>Choose a stage, drag athletes. The path is automatic.</span>
      <button className="source-moments-toggle" aria-expanded={allMoments} aria-controls="source-moment-list" onClick={() => setAllMoments(v => !v)}>
        {allMoments ? 'Hide extra moments' : `More moments · ${events.length}`}
      </button>
    </div>
    <nav aria-label="Position stages">
      <ol className="stage-quick-list">{primary.map((event, i) =>
        <li key={event.id}><button data-event-id={event.id} data-stage-quick="true" aria-label={`Edit ${primaryLabels[event.label]} stage`}
          aria-pressed={selectedId === event.id} disabled={disabled} onClick={() => onSelect(event.id)}>
          <span className="event-index">{String(i + 1).padStart(2, '0')}</span>
          <strong>{primaryLabels[event.label]}</strong>
          <span className="event-caption">{event.time.toFixed(2)} s</span>
        </button></li>)}</ol>
    </nav>
    {allMoments && <nav id="source-moment-list" className="all-source-events-open" aria-label="All source rally moments">
      <ol ref={rail}>{events.map((event, i) => <li key={event.id}>
        <button data-event-id={event.id} aria-label={`Edit moment: ${event.label}`}
          aria-pressed={selectedId === event.id} disabled={disabled} onClick={() => onSelect(event.id)}>
          <span className="event-index">{String(i + 1).padStart(2, '0')}</span><strong>{event.label}</strong>
          <span className="event-caption">{event.time.toFixed(2)} s{event.contacts.some(c => c.kind === 'pass' && c.side === 'from') ? ` · Dig / receive ${event.occurrence}` : ''}</span>
        </button>
      </li>)}</ol>
    </nav>}
  </section>
}
