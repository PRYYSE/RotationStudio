import { useRef, useState } from 'react'
import { useStrategies } from '../state/strategyStore'
import { useRotations } from '../state/rotationStore'
import { exportStrategy, MAX_STRATEGY_BYTES, strategyLink } from '../lib/strategyDraft'

export function StrategyLibrary() {
  const s = useStrategies(), published = useRotations(r => r.published)
  const file = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState(''), [naming, setNaming] = useState(false)
  const [name, setName] = useState(''), [author, setAuthor] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pendingSelect, setPendingSelect] = useState<string | null | undefined>(undefined)
  const working = s.working, stored = !!working && !s.preview && s.library.some(d => d.id === working.id)
  const choose = (id: string | null) => {
    if (working && !s.saved) { setPendingSelect(id); return }
    s.select(id)
  }
  const beginName = () => { setName(working?.name ?? ''); setAuthor(working?.author ?? ''); setNaming(true) }
  return <section className="strategy-library" aria-label="Strategy library">
    <label>Strategy<select aria-label="Saved strategy" value={s.preview ? '__preview' : working ? stored ? working.id : '__new' : ''} onChange={e => choose(e.target.value || null)}>
      <option value="">Team V3 · read-only baseline</option>
      {working && !stored && <option value={s.preview ? '__preview' : '__new'}>{working.name} · {s.preview ? 'preview' : 'unsaved'}</option>}
      {s.library.map(d => <option value={d.id} key={d.id}>{d.name} · {d.author}</option>)}
    </select></label>
    <p className="strategy-status" role="status">{working ? `${working.author} · ${s.preview ? 'Preview — Save a copy to keep' : s.saved ? 'Saved locally' : 'Unsaved'} · Needs review` : 'Team V3 · immutable published tactics'}</p>
    <p>Stored in this browser only. Share JSON or a link for another coach to make a copy; changes do not sync.</p>
    <div className="rotation-row">
      <button onClick={() => { if (working && !s.saved) { setMessage('Save or export the current unsaved strategy before starting another.'); return } s.newStrategy(false, published ?? undefined) }}>New from baseline</button>
      <button onClick={() => { if (working && !s.saved) { setMessage('Save or export the current unsaved strategy before making a copy.'); return } s.newStrategy(true, published ?? undefined) }}>New from current</button>
      <button disabled={!working} onClick={() => { if (!s.saved) { setMessage('Save or export this strategy before duplicating.'); return } s.newStrategy(true) }}>Duplicate</button>
      <button disabled={!working} onClick={beginName}>Rename / author</button>
      <button disabled={!working || !!s.gesture} onClick={s.save}>{s.preview ? 'Save a copy' : 'Save'}</button>
      <button disabled={!stored} onClick={() => setConfirmDelete(true)}>Delete</button>
    </div>
    {naming && <form className="strategy-form" onSubmit={e => {
      e.preventDefault(); s.metadata(name.trim(), author.trim()); if (name.trim() && author.trim()) setNaming(false)
    }}>
      <label>Name<input aria-label="Strategy name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Author<input aria-label="Strategy author" required maxLength={80} value={author} onChange={e => setAuthor(e.target.value)} /></label>
      <button type="submit">Apply name</button><button type="button" onClick={() => setNaming(false)}>Cancel</button>
    </form>}
    {pendingSelect !== undefined && <div role="alert" className="strategy-confirm">This strategy has unsaved changes. Save or export to keep them.
      <button onClick={() => { s.select(pendingSelect); setPendingSelect(undefined) }}>Discard and switch</button><button onClick={() => setPendingSelect(undefined)}>Keep editing</button>
    </div>}
    {confirmDelete && working && <div role="alert" className="strategy-confirm">Delete “{working.name}” from this browser?
      <button onClick={() => { s.remove(working.id); setConfirmDelete(false) }}>Confirm delete</button><button onClick={() => setConfirmDelete(false)}>Cancel</button>
    </div>}
    <div className="rotation-row">
      <button onClick={() => file.current?.click()}>Import strategy</button>
      <button disabled={!working} onClick={() => {
        if (!working) return
        try {
          const url = URL.createObjectURL(new Blob([exportStrategy(working)], { type: 'application/json' }))
          const a = document.createElement('a'); a.href = url; a.download = 'strategy-' + working.id + '.json'; a.click()
          setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage('Exported sparse foundation. Needs tactical review.')
        } catch (e) { setMessage(String(e)) }
      }}>Export strategy</button>
      <button disabled={!working} onClick={async () => {
        if (!working) return
        const url = strategyLink(window.location.href, working)
        if (!url) { setMessage('Link would be too long. Export strategy JSON instead.'); return }
        try { await navigator.clipboard.writeText(url); setMessage('Strategy link copied. Opens as preview; recipient saves a copy.') }
        catch { setMessage(url) }
      }}>Share strategy</button>
    </div>
    <input ref={file} hidden type="file" accept=".json,application/json" aria-label="Import sparse strategy JSON" onChange={async e => {
      const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
      if (working && !s.saved) { setMessage('Save or export your current work before importing another strategy.'); return }
      if (f.size > MAX_STRATEGY_BYTES) { useStrategies.setState({ error: 'Strategy file must be at most 100 KB.' }); return }
      s.previewImport(await f.text())
    }} />
    {s.error && <p role="alert">{s.error}</p>}
    {message && <p role="status" className="strategy-message">{message}<button onClick={() => setMessage('')}>Dismiss</button></p>}
  </section>
}
