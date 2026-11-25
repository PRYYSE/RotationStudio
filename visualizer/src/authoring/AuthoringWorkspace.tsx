import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { AuthoringCourt } from './AuthoringCourt'
import { ExactPlanReview } from './ExactPlanReview'
import { TeamSetup } from './TeamSetup'
import { clearCloudRecovery, download, getCloudRecoveries, privateSession, readCloud, readLocal, saveCloud, saveLocal, stageCloudSave, type CloudPending } from './persistence'
import {
  addFillIn, addSharedCopy, applyProposal, contactIssues, currentPlan, emptyLibrary, exportPack, leagueIssues, makeProposal, makeReview, newId, openReview, planIssues,
  previewProposal, reference, requireRef, sharePlan, undo, undoTarget, validateAppend, validateLibrary,
} from '../domain/authoring'
import { fixture } from '../domain/fixture'
import { importLegacy } from '../domain/legacy'
import { recoverPlan } from '../domain/recovery'
import { compile, playbackAt } from '../domain/playback'
import { MAX_LIBRARY_BYTES, MAX_PROPOSAL_BYTES, MAX_SHARE_BYTES, duties, encodeLibrary, parseJSON, proposal, type Library, type Moment, type Operation, type Scope, type Proposal, type Review, type Spot, type Strategy } from '../domain/contracts'
import { loadBundle } from '../lib/rotationValidation'
import { MAX_STRATEGY_BYTES } from '../lib/strategyDraft'
import './authoring.css'

const errorText = (e: unknown) => e instanceof Error ? e.message : 'The change could not be completed.'
function initialState() {
  try { return { ...readLocal(), error: '' } }
  catch { return { raw: null, library: emptyLibrary(), error: 'This browser copy could not be read. Its data is still present. Export any new work before leaving.' } }
}

export function AuthoringWorkspace() {
  const [initial] = useState(initialState)
  const [library, setLibrary] = useState(initial.library)
  const [localBase, setLocalBase] = useState(initial.raw)
  const [planId, setPlan] = useState(initial.library.plans.at(-1)?.id ?? '')
  const [caseId, setCase] = useState('')
  const [momentId, setMoment] = useState('')
  const [slotId, setSlot] = useState('')
  const [error, setError] = useState(initial.error)
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [creating, setCreating] = useState(false)
  const [cloudAvailable, setAvailable] = useState(false)
  const [cloudRevision, setCloudRevision] = useState<number>()
  const [recoveries, setRecoveries] = useState(getCloudRecoveries)
  const [recoveryId, setRecoveryId] = useState('')
  const [backup, setBackup] = useState<Library>()
  const [backupPlan, setBackupPlan] = useState('')
  const [saveFailed, setSaveFailed] = useState(false)
  const [pending, setPending] = useState<CloudPending>()
  const [preview, setPreview] = useState<ReturnType<typeof previewProposal> & { proposal: Proposal }>()
  const [review, setReview] = useState<Review>()
  const [before, setBefore] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const [includeSkills, setIncludeSkills] = useState(false)

  useEffect(() => { let active = true; void privateSession().then(value => { if (active) setAvailable(value) }); return () => { active = false } }, [])
  useEffect(() => {
    const refresh = () => setRecoveries(getCloudRecoveries())
    addEventListener('storage', refresh)
    return () => removeEventListener('storage', refresh)
  }, [])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    addEventListener('beforeunload', warn)
    return () => removeEventListener('beforeunload', warn)
  }, [dirty])

  const authoringPlan = planId && library.plans.some(p => p.id === planId) ? currentPlan(library, planId) : undefined
  const plan = preview && !before ? preview.plan : authoringPlan
  const lineup = plan && requireRef(library.lineups, plan.lineup, 'lineup')
  const team = lineup && requireRef(library.teams, lineup.team, 'team')
  const scenario = plan?.cases.find(c => c.id === caseId) ?? (before && preview && caseId ? undefined : plan?.cases[0])
  const compiled = useMemo(() => scenario && compile(scenario), [scenario])
  const moment = compiled?.moments.find(m => m.id === momentId) ?? (before && preview && momentId ? undefined : compiled?.moments[0])
  const athlete = moment?.athletes.find(a => a.slot === slotId) ?? moment?.athletes[0]
  const issues = useMemo(() => plan ? [...planIssues(plan), ...contactIssues(library, plan), ...leagueIssues(library, plan)] : [], [library, plan])
  const players = lineup?.slots.map(s => {
    const p = requireRef(library.players, s.player, 'player')
    return { slot: s.id, name: p.name, appearance: p.appearance }
  }) ?? []
  const recovery = recoveries.find(r => r.requestId === recoveryId) ?? recoveries[0]
  const resumes = !!recovery && cloudAvailable && cloudRevision === undefined
  const refreshRecovery = () => setRecoveries(getCloudRecoveries())
  const canUndo = !!authoringPlan && !!undoTarget(library, authoringPlan)
  const readOnly = busy || playing || !!preview || plan?.status === 'approved' || scenario?.status === 'approved'
  const reserves = team?.roster.filter(p => !lineup?.slots.some(s => s.player.id === p.id)) ?? []
  const notices = [status, dirty && 'Unsaved changes'].filter(Boolean).join(' · ')
  const titles = [...new Map(library.plans.map(p => [p.id, p])).values()]

  useEffect(() => {
    if (!playing || !compiled || !moment) return
    let frame = 0
    const start = performance.now(), from = moment.ms / 1000
    const step = (now: number) => {
      const time = from + (now - start) / 1000
      if (time >= compiled.duration) { setMoment(compiled.moments.at(-1)!.id); setPlaying(false); return }
      setPlayhead(time)
      frame = requestAnimationFrame(step)
    }
    const pauseHidden = () => { if (document.hidden) setPlaying(false) }
    document.addEventListener('visibilitychange', pauseHidden)
    frame = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', pauseHidden) }
  }, [compiled, moment, playing])

  function change(next: Library, focus?: Strategy) {
    setLibrary(next); setDirty(true); setPending(undefined)
    if (focus && focus.id !== planId) { setPlan(focus.id); setCase(''); setMoment(''); setSlot('') }
  }
  const focusPlan = (l: Library, id?: string) => l.plans.some(p => p.id === id) ? id! : l.plans.at(-1)?.id ?? ''
  async function perform(work: () => void | Promise<void>) {
    if (lock.current) return
    lock.current = true
    setBusy(true); setError(''); setStatus('')
    try { await work() } catch (e) { setError(errorText(e)) }
    finally { lock.current = false; setBusy(false) }
  }
  function save() {
    return perform(async () => {
      if (cloudRevision === undefined) {
        setLocalBase(await saveLocal(library, localBase))
        setStatus('Saved on this browser')
      } else {
        const retry = pending?.document === library ? pending : stageCloudSave(library, cloudRevision, planId)
        setPending(retry); setRecoveryId(retry.requestId); refreshRecovery()
        try { setCloudRevision(await saveCloud(retry)) } catch (e) {
          setSaveFailed(true)
          if (!retry.durable) throw new Error(errorText(e) + ' Device storage is full or inaccessible. Download this private backup before leaving.')
          throw e
        }
        clearCloudRecovery(retry.requestId)
        setPending(undefined); refreshRecovery(); setSaveFailed(false)
        setStatus('Saved privately in cloud storage')
      }
      setDirty(false)
    })
  }
  function openCloud(restore: boolean) {
    return perform(async () => {
      if (restore && recovery) {
        setLibrary(recovery.document); setPlan(focusPlan(recovery.document, recovery.planId))
        setCloudRevision(recovery.expectedRevision); setPending(recovery); setDirty(true); setSaveFailed(true); setStatus('Recovered unsent cloud edits')
      } else {
        if (dirty && cloudRevision !== undefined) {
          const saved = pending?.document === library ? pending : stageCloudSave(library, cloudRevision, planId)
          if (!saved.durable) throw new Error('Device storage cannot keep this branch. Download your private backup before switching.')
          setRecoveryId(saved.requestId); refreshRecovery()
        }
        const opened = await readCloud()
        setCloudRevision(opened.revision); setSaveFailed(false)
        if (opened.revision === 0) {
          setDirty(library.plans.length > 0); setStatus('Private library is empty. Save to make an explicit cloud copy.')
        } else {
          setLibrary(opened.library); setPlan(opened.library.plans.at(-1)?.id ?? '')
          setPending(undefined); setDirty(false); setStatus('Opened saved cloud library')
        }
      }
      setCase(''); setMoment(''); setSlot('')
    })
  }
  function move(slot: string, position: Spot) {
    if (readOnly || !plan || !scenario || !moment) return
    const original = moment.athletes.find(a => a.slot === slot)?.position
    if (!original || (original.x === position.x && original.z === position.z)) return
    void perform(async () => {
      const scope = { caseId: scenario.id, momentId: moment.id, slotId: slot }
      change(await applyProposal(library, makeProposal(library, plan, [{ type: 'move', ...scope, position }], [scope], 'Place player on court.')))
      setSlot(slot); setStatus('Placement updated')
    })
  }
  function editMoment(event: FormEvent<HTMLFormElement>, action: 'add' | 'teach') {
    event.preventDefault()
    if (readOnly || !plan || !scenario || !moment || !athlete) return
    const fields = new FormData(event.currentTarget), caseId = scenario.id
    const scope: Scope = action === 'add' ? { caseId } : { caseId, momentId: moment.id, slotId: athlete.slot }
    let op: Operation
    if (action === 'add') {
      const extra: Moment = { id: newId(), name: String(fields.get('name')), ms: Math.round(Number(fields.get('seconds')) * 1000),
        athletes: moment.athletes.map(a => ({ ...a, route: undefined })) }
      op = { type: 'addMoment', caseId, moment: extra }
    } else {
      const duty = duties.find(d => d === fields.get('duty'))
      if (!duty) return
      op = { type: 'teach', caseId, momentId: moment.id, slotId: athlete.slot, duty, cue: String(fields.get('cue')) }
    }
    void perform(async () => {
      change(await applyProposal(library, makeProposal(library, plan, [op], [scope], 'Edit the selected case.')))
      if (op.type === 'addMoment') setMoment(op.moment.id)
      setStatus(op.type === 'addMoment' ? 'Moment added to this case' : 'Teaching instruction updated')
    })
  }
  function fillIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!lineup || !plan) return
    const form = new FormData(event.currentTarget)
    void perform(() => {
      const p = reserves.find(p => p.id === form.get('reserve'))
      if (!p) throw new Error('Choose a reserve player.')
      const name = String(form.get('variant')).trim()
      const result = addFillIn(library, lineup, String(form.get('replace')), p, name)
      const { source: _source, ...original } = plan
      const copy: Strategy = { ...original, id: newId(), revision: 1, name, lineup: reference(result.variant), status: 'draft',
        cases: original.cases.map(c => ({ ...c, status: 'draft' })) }
      change(validateLibrary({ ...result.library, plans: [...result.library.plans, copy] }), copy)
      setStatus('Fill-in draft created. Adapt the tactics for this lineup.')
    })
  }
  async function loadFile(event: ChangeEvent<HTMLInputElement>, format: 'proposal' | 'plan' | 'backup' | 'review') {
    const input = event.currentTarget, file = input.files?.[0]
    input.value = ''
    if (!file) return
    await perform(async () => {
      const limit = format === 'proposal' ? MAX_PROPOSAL_BYTES : format === 'backup' ? MAX_LIBRARY_BYTES : Math.max(MAX_STRATEGY_BYTES, MAX_SHARE_BYTES)
      if (file.size > limit) throw new Error('File exceeds the size limit.')
      const raw = await file.text(), value = parseJSON(raw, limit)
      if (format === 'review') {
        setReview(await openReview(value)); setPlaying(false)
      } else if (format === 'proposal') {
        const p = proposal.parse(value)
        if (p.plan.id !== planId) throw new Error('Open the exact plan for this proposal first.')
        const checked = previewProposal(library, p)
        const first = p.scope[0]
        const operation = p.operations[0]
        if (first) setSlot(first.slotId ?? '')
        if (operation.type !== 'useLineup') {
          setCase(operation.type === 'copyCase' ? operation.copyId : operation.caseId)
          setMoment(operation.type === 'addMoment' ? operation.moment.id : 'momentId' in operation ? operation.momentId : '')
        }
        setPlaying(false); setBefore(false); setPreview({ ...checked, proposal: p }); setStatus('Preview ready')
      } else if (format === 'backup') {
        const next = validateLibrary(value)
        try {
          await validateAppend(library, next)
          change(next, next.plans.at(-1))
          setStatus('Library backup opened')
        } catch (e) {
          if (!next.plans.length) throw e
          setBackup(next); setBackupPlan(focusPlan(next))
          setStatus('Backup contains a separate history. Choose a plan to recover as a new draft.')
        }
      } else if (typeof value === 'object' && value && 'kind' in value && value.kind === 'rotation-studio-strategy') {
        const result = await importLegacy(library, await loadBundle(import.meta.env.BASE_URL), raw)
        change(result.library, result.plan)
        setStatus(result.plan ? 'Imported legacy plan as a new draft' : result.issues[0])
      } else {
        const result = addSharedCopy(library, value)
        change(result.library, result.plan); setStatus('Opened an independent editable copy')
      }
    })
  }
  const previous = compiled && moment && compiled.moments[compiled.moments.indexOf(moment) - 1]
  const from = previous && previous.athletes.find(a => a.slot === athlete?.slot)?.position
  const view = compiled && moment && playbackAt(compiled, playing ? playhead : moment.ms / 1000)
  const route = from && athlete ? [from, ...(athlete.route ?? [])] : []
  const mode = cloudRevision !== undefined ? 'Private cloud' : 'This browser'
  const caseLocked = !!review || !!preview || busy || playing
  return <main className="s1-workspace" aria-label="Team plans">
    <header className="s1-header">
      <div><a href={import.meta.env.BASE_URL}>RotationStudio</a><h1>Team plans</h1></div>
      <div className="s1-row"><span className="s1-chip">{mode}</span>
        <button className="s1-primary" disabled={!dirty || busy || !!preview || !!review} onClick={() => void save()}>Save library</button>
      </div>
    </header>
    <div className="s1-body">
      {(notices || error) && <div className="s1-status">{notices && <p role="status">{notices}</p>}{error && <p role="alert">{error}</p>}</div>}
      <section className="s1-library" aria-label="Plan library">
        {!!titles.length && <label>Plan<select aria-label="Plan" value={planId} disabled={caseLocked} onChange={e => { setPlan(e.target.value); setCase(''); setMoment(''); setSlot('') }}>
          {titles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>}
        <div className="s1-row">
          <button disabled={caseLocked} onClick={() => setCreating(value => !value)}>New team plan</button>
          {!library.plans.length && <button disabled={caseLocked} onClick={() => void perform(() => {
            const sample = fixture()
            const next = validateLibrary({ ...library, players: [...library.players, ...sample.players],
              teams: [...library.teams, ...sample.teams], lineups: [...library.lineups, ...sample.lineups],
              leagues: [...library.leagues, ...sample.leagues.filter(s => !library.leagues.some(x => x.id === s.id))], plans: sample.plans })
            change(next, next.plans[0]); setStatus('Synthetic sample opened')
          })}>Open sample</button>}
          {cloudAvailable && cloudRevision === undefined && <button disabled={caseLocked || dirty} onClick={() => void openCloud(false)}>Open private library</button>}
          {resumes && <button disabled={caseLocked || dirty} onClick={() => void openCloud(true)}>Recover cloud edits</button>}
          {cloudRevision !== undefined && saveFailed && <button disabled={caseLocked} onClick={() => void openCloud(false)}>Keep draft and open latest</button>}
        </div>
        {cloudAvailable && recoveries.length > 0 && <label>Unsaved cloud branch<select aria-label="Unsaved cloud branch"
          value={recovery?.requestId} onChange={e => setRecoveryId(e.target.value)} disabled={caseLocked}>
          {recoveries.map(r => <option key={r.requestId} value={r.requestId}>{r.document.plans.length ? currentPlan(r.document, focusPlan(r.document, r.planId)).name : 'Private library'} · {new Date(r.savedAt).toLocaleTimeString()} · {r.requestId.slice(0, 6)}</option>)}
        </select></label>}
        {!!recovery?.document.plans.length && cloudRevision !== undefined && !saveFailed && <button disabled={caseLocked} onClick={() => void perform(() => {
          const result = recoverPlan(library, recovery.document, currentPlan(recovery.document, focusPlan(recovery.document, recovery.planId)))
          change(result.library, result.plan); setStatus('Recovered a new private draft. Save when ready.')
        })}>Recover branch as new draft</button>}
      </section>
      {backup && <section className="s1-card s1-form" aria-label="Recover backup plan">
        <h2>Recover a plan from this backup</h2>
        <label>Backup plan<select value={backupPlan} onChange={e => setBackupPlan(e.target.value)}>
          {[...new Map(backup.plans.map(p => [p.id, p])).values()].map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>
        <div className="s1-row"><button disabled={caseLocked} onClick={() => void perform(() => {
          const result = recoverPlan(library, backup, currentPlan(backup, backupPlan))
          change(result.library, result.plan); setBackup(undefined); setStatus('Recovered a new draft from the backup')
        })}>Recover as new draft</button><button onClick={() => setBackup(undefined)}>Close backup</button></div>
      </section>}
      {creating && <TeamSetup library={library} onCancel={() => setCreating(false)} onCreate={(next, created) => {
        change(next, created); setCreating(false); setStatus('Team and draft created')
      }} />}
      {review && <ExactPlanReview review={review} onClose={() => setReview(undefined)} onCopy={() => void perform(() => {
        const result = addSharedCopy(library, review.snapshot)
        change(result.library, result.plan); setReview(undefined); setStatus('Made an independent draft copy')
      })} />}
      {!review && plan && lineup && team && <div className="s1-grid">
        <section className="s1-card s1-court-card" aria-label="Court editor">
          <div className="s1-card-heading">
            <div><p className="s1-context">{team.name} / {lineup.name}</p><h2>{plan.name}</h2></div>
            <span className="s1-chip">{preview ? before ? 'Before' : 'Preview' : 'Revision ' + plan.revision}</span>
          </div>
          {lineup.adaptation === 'needs-review' && <p className="s1-adaptation">Fill-in lineup · tactics need review</p>}
          {scenario && moment && view ? <>
            <div className="s1-jump">
              <label>Case<select aria-label="Case" value={scenario.id} disabled={busy || playing} onChange={e => { setCase(e.target.value); setMoment('') }}>
                {plan.cases.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label>Moment<select aria-label="Moment" value={moment.id} disabled={busy || playing} onChange={e => setMoment(e.target.value)}>
                {compiled?.moments.map(m => <option key={m.id} value={m.id}>{m.name} · {m.ms / 1000}s</option>)}</select></label>
            </div>
            <AuthoringCourt key={scenario.id + '/' + moment.id} players={players} positions={view.positions} slot={athlete?.slot ?? ''}
              route={playing ? [] : route} coverage={playing ? undefined : athlete?.coverage} ball={view.ball} exhibit={readOnly} onSelect={setSlot} onMove={move} />
            <div className="s1-row s1-transport">
              <button disabled={!compiled?.duration || busy} onClick={() => {
                if (!playing) {
                  if (moment.ms >= (compiled?.duration ?? 0) * 1000) { setMoment(compiled!.moments[0].id); setPlayhead(0) }
                  else setPlayhead(moment.ms / 1000)
                }
                setPlaying(value => !value)
              }}>{playing ? 'Pause' : 'Play rally'}</button>
              <span>{(playing ? playhead : moment.ms / 1000).toFixed(2)} s</span>
            </div>
            {moment.cue && <p>{moment.cue}</p>}
          </> : <p role="status">{before && preview ? 'The selected case or moment did not exist before the proposal.' : 'This plan has no authored cases.'}</p>}
        </section>
        <aside className="s1-sidepanel" aria-label="Plan controls">
          {preview ? <section className="s1-card s1-form">
            <h2>Proposal preview</h2><p>{preview.proposal.rationale}</p>
            <ul>{preview.diff.map((line, i) => <li key={i}>{line}</li>)}</ul>
            {!!preview.proposal.assumptions.length && <p>Assumptions · {preview.proposal.assumptions.join(' · ')}</p>}
            {!!preview.proposal.questions.length && <p>Open questions · {preview.proposal.questions.join(' · ')}</p>}
            <div className="s1-row">
              <button disabled={busy || playing} onClick={() => setBefore(value => !value)}>{before ? 'Show proposed placement' : 'Show original placement'}</button>
              <button className="s1-primary" disabled={busy || playing} onClick={() => void perform(async () => {
                change(await applyProposal(library, preview.proposal)); setPreview(undefined); setBefore(false); setStatus('Proposal applied as one edit')
              })}>Apply proposal</button>
              <button disabled={busy || playing} onClick={() => { setPreview(undefined); setBefore(false); setStatus('Proposal rejected') }}>Reject</button>
            </div>
          </section> : <section className="s1-card s1-form">
            <h2>Place a player</h2>
            <label>Player<select aria-label="Player" value={athlete?.slot ?? ''} disabled={readOnly} onChange={e => setSlot(e.target.value)}>
              {players.map(p => <option key={p.slot} value={p.slot}>{p.name}</option>)}</select></label>
            {athlete && <>
              <output aria-label="Placement">X {athlete.position.x.toFixed(2)} m · Z {athlete.position.z.toFixed(2)} m</output>
              <p>Drag the player, tap a destination, or nudge by 25 cm.</p>
              <div className="s1-row">
                {([['Left', -.25, 0], ['Right', .25, 0], ['Toward net', 0, -.25], ['Back', 0, .25]] as const).map(([name, x, z]) =>
                  <button key={name} type="button" disabled={readOnly} onClick={() => move(athlete.slot, {
                    x: +Math.min(4.5, Math.max(-4.5, athlete.position.x + x)).toFixed(2),
                    z: +Math.min(12, Math.max(0, athlete.position.z + z)).toFixed(2),
                  })}>{name}</button>)}
              </div>
            </>}
            <button disabled={busy || playing || !canUndo} onClick={() => void perform(async () => {
              if (!authoringPlan) return
              change(await undo(library, authoringPlan.id, authoringPlan.revision, newId())); setStatus('Last edit restored')
            })}>Undo edit</button>
          </section>}
          {!preview && moment && athlete && <details className="s1-card">
            <summary>Edit timeline</summary>
            <form key={moment.id} className="s1-form" onSubmit={event => editMoment(event, 'add')}>
              <label>New moment name<input name="name" required maxLength={100} /></label>
              <label>Time in seconds<input name="seconds" type="number" min=".001" max="120" step=".001" required defaultValue={Math.min(120, moment.ms / 1000 + 1)} /></label>
              <button disabled={readOnly}>Add moment from this formation</button>
            </form>
            <form key={moment.id + athlete.slot} className="s1-form s1-instruction" onSubmit={event => editMoment(event, 'teach')}>
              <label>Player responsibility<select name="duty" defaultValue={athlete.duty}>{duties.map(duty => <option key={duty}>{duty}</option>)}</select></label>
              <label>Teaching cue<input name="cue" defaultValue={athlete.cue} maxLength={600} /></label>
              <button disabled={readOnly}>Update instruction</button>
            </form>
          </details>}
          {!preview && reserves.length > 0 && <details className="s1-card">
            <summary>Make a fill-in copy</summary>
            <form className="s1-form" onSubmit={fillIn}>
              <label>Variant name<input name="variant" required maxLength={100} /></label>
              <label>Replace slot<select name="replace">{players.map(p => <option key={p.slot} value={p.slot}>{p.name}</option>)}</select></label>
              <label>Reserve<select name="reserve">{reserves.map(p => <option key={p.id} value={p.id}>{requireRef(library.players, p, 'player').name}</option>)}</select></label>
              <button disabled={busy || playing}>Create fill-in draft</button>
            </form>
          </details>}
          <details className="s1-card">
            <summary>{issues.length ? 'Draft issues (' + issues.length + ')' : 'Base cases authored'}</summary>
            {!!issues.length && <ul>{issues.map(s => <li key={s}>{s}</li>)}</ul>}
            {!issues.length && <p>League and tactical suitability require coaching review.</p>}
          </details>
        </aside>
      </div>}
      <details className="s1-card s1-exchange">
        <summary>Import and export</summary>
        <div className="s1-form">
          <label>Import editable or legacy plan<input disabled={caseLocked} type="file" accept=".json,application/json" onChange={e => void loadFile(e, 'plan')} /></label>
          <label>Open exact plan review<input disabled={caseLocked} type="file" accept=".json,application/json" onChange={e => void loadFile(e, 'review')} /></label>
          <label>Open library backup<input disabled={caseLocked} type="file" accept=".json,application/json" onChange={e => void loadFile(e, 'backup')} /></label>
          {plan && scenario && moment && !preview && !review && <>
            <label className="s1-inline"><input type="checkbox" checked={includeSkills} onChange={e => setIncludeSkills(e.target.checked)} />Include active players’ skill ratings in AI pack</label>
            <div className="s1-row">
              <button disabled={busy || playing} onClick={() => void perform(() => download('rotation-edit-pack.json',
                exportPack(library, plan, { caseId: scenario.id, momentId: moment.id, slotId: athlete?.slot }, includeSkills)))}>Export AI editing pack</button>
              <button disabled={busy || playing} onClick={() => void perform(() => download('rotation-editable-copy.json', sharePlan(library, plan)))}>Export redacted editable copy</button>
              <button disabled={busy || playing} onClick={() => void perform(async () => download('rotation-exact-review.json',
                await makeReview(library, plan, scenario.id, moment.id)))}>Export exact plan review</button>
            </div>
            <label>Import AI proposal<input disabled={busy || playing} type="file" accept=".json,application/json" onChange={e => void loadFile(e, 'proposal')} /></label>
          </>}
          <button disabled={busy} onClick={() => download('rotation-library-private.json', encodeLibrary(library))}>Download private library backup</button>
          {library.sources.map(s => <div key={s.id}><button onClick={() => download('legacy-' + s.sha256.slice(0, 10) + '.json', s.raw, true)}>Download original legacy file</button>
            {!!s.issues.length && <p>{s.issues[0]}</p>}</div>)}
        </div>
      </details>
    </div>
  </main>
}
