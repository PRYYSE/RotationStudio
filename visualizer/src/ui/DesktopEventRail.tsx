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
  const container = useRef<HTMLElement>(null), chooser = useRef<HTMLElement>(null), toggle = useRef<HTMLButtonElement>(null)
  const [allMoments, setAllMoments] = useState(false)
  const primary = events.filter(e => primaryLabels[e.label])
  const selectedIsPrimary = primary.some(e => e.id === selectedId)
  const selected = events.find(e => e.id === selectedId)
  useEffect(() => {
    if (!allMoments) return
    const current = rail.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]') ?? rail.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
    current?.focus({ preventScroll: true })
    current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
    const outside = (e: PointerEvent) => {
      const target = e.target as Node
      if (!chooser.current?.contains(target) && !toggle.current?.contains(target)) setAllMoments(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setAllMoments(false); toggle.current?.focus({ preventScroll: true }) }
    }
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('keydown', escape, true)
    return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape, true) }
  }, [allMoments])
  const chooseMoment = (id: string) => { onSelect(id); setAllMoments(false); toggle.current?.focus({ preventScroll: true }) }

  return <section ref={container} className="desktop-event-rail" aria-label="Rally editing stages"
    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setAllMoments(false) }}>
    <div className="sequence-heading">
      <strong>Rally stages</strong>
      <span className={selected && !selectedIsPrimary ? 'selected-detail-moment' : undefined}>
        {selected && !selectedIsPrimary ? `${selected.label} · ${selected.time.toFixed(2)} s` : 'Choose a stage, then move an athlete.'}
      </span>
      <button ref={toggle} className="source-moments-toggle" aria-expanded={allMoments} aria-controls="source-moment-list" onClick={() => setAllMoments(v => !v)}>
        More moments · {events.length}
      </button>
    </div>
    <nav aria-label="Position stages">
      <ol className="stage-quick-list">{primary.map((event, i) =>
        <li key={event.id}><button data-event-id={event.id} data-stage-quick="true" aria-label={`Edit ${primaryLabels[event.label]} stage`}
          aria-pressed={selectedId === event.id} disabled={disabled} onClick={() => { onSelect(event.id); setAllMoments(false) }}>
          <span className="event-index">{String(i + 1).padStart(2, '0')}</span>
          <strong>{primaryLabels[event.label]}</strong>
          <span className="event-caption">{event.time.toFixed(2)} s</span>
        </button></li>)}</ol>
    </nav>
    {allMoments && <nav ref={chooser} id="source-moment-list" className="all-source-events-open" aria-label="All source rally moments">
      <p>All rally moments <span>{events.length} moments · choose to jump</span></p>
      <ol ref={rail}>{events.map((event, i) => <li key={event.id}>
        <button data-event-id={event.id} aria-label={`Edit moment: ${event.label}`}
          aria-pressed={selectedId === event.id} disabled={disabled} onClick={() => chooseMoment(event.id)}>
          <span className="event-index">{String(i + 1).padStart(2, '0')}</span><strong>{event.label}</strong>
          <span className="event-caption">{event.time.toFixed(2)} s{event.contacts.some(c => c.kind === 'pass' && c.side === 'from')
            ? ` · ${event.occurrence === 1 ? 'First' : event.occurrence === 2 ? 'Second' : event.occurrence} dig / receive`
            : event.contacts.length ? ` · ${event.contacts.map(c => `${c.kind[0].toUpperCase() + c.kind.slice(1)} ${c.side === 'from' ? 'contact' : 'arrival'}`).join(' · ')}` : ''}</span>
        </button>
      </li>)}</ol>
    </nav>}
  </section>
}
