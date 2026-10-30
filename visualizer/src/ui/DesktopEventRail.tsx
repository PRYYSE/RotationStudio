import { useEffect, useRef } from 'react'
import type { SourceEvent } from '../lib/strategyEvents'

export function DesktopEventRail({ events, selectedId, onSelect, disabled }: {
  events: SourceEvent[]; selectedId?: string; onSelect: (id: string) => void; disabled: boolean
}) {
  const rail = useRef<HTMLOListElement>(null)
  const index = events.findIndex(e => e.id === selectedId)
  useEffect(() => {
    rail.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  }, [selectedId])
  return <section className="desktop-event-rail" aria-label="Rally source event sequence">
    <div className="sequence-heading"><strong>Rally sequence</strong><span>Choose a moment to edit</span><output>{index + 1} / {events.length}</output></div>
    <nav aria-label="Source event rail"><ol ref={rail}>{events.map((event, i) => <li key={event.id}>
      <button data-event-id={event.id} aria-pressed={selectedId === event.id} disabled={disabled} onClick={() => onSelect(event.id)}>
        <span className="event-index">{String(i + 1).padStart(2, '0')}</span><strong>{event.label}</strong>
        <span className="event-caption">{event.time.toFixed(2)} s{event.contacts.some(c => c.kind === 'pass' && c.side === 'from') ? ` · Dig / receive ${event.occurrence}` : ''}</span>
      </button>
    </li>)}</ol></nav>
  </section>
}
