import type { SourceEvent } from '../lib/strategyEvents'

export function EventNavigator({ events, selectedId, onSelect }: {
  events: SourceEvent[]; selectedId?: string; onSelect: (id: string) => void
}) {
  const index = events.findIndex(e => e.id === selectedId)
  return <details className="event-navigator">
    <summary>All events · {events.length} source events</summary>
    <p>Choose an existing event to inspect its athletes. Selection saves no edit. Positions, incoming routes and coverage apply only to that occurrence.</p>
    <nav aria-label="All source events"><ol>{events.map(event => <li key={event.id}>
      <button data-event-id={event.id} aria-pressed={selectedId === event.id} onClick={() => onSelect(event.id)}>
        {event.label} · {event.time.toFixed(2)} s{event.contacts.some(c => c.kind === 'pass' && c.side === 'from') ? ` · Receive/dig occurrence ${event.occurrence}` : ''}
      </button>
    </li>)}</ol></nav>
    <div className="rotation-row">
      <button aria-label="Previous source event" disabled={index <= 0} onClick={() => onSelect(events[index - 1].id)}>Previous event</button>
      <button aria-label="Next source event" disabled={index >= events.length - 1} onClick={() => onSelect(events[index + 1].id)}>Next event</button>
    </div>
  </details>
}
