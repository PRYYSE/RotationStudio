import { useState, type FormEvent } from 'react'
import { newId, reference, validateLibrary } from '../domain/authoring'
import { type League, type Library, type Lineup, type Player, type Strategy, type Team } from '../domain/contracts'
import { draftCases, ttgva, unknownLeague } from '../domain/fixture'

const v = { schemaVersion: 1, revision: 1 } as const
const slotRoles = ['setter', 'outside', 'middle', 'opposite', 'outside', 'middle'] as const
type Props = { library: Library; onCreate(library: Library, plan: Strategy): void; onCancel(): void }

export function TeamSetup({ library, onCreate, onCancel }: Props) {
  const [reuse, setReuse] = useState<string[]>([])
  const [problem, setProblem] = useState('')
  const available = [...new Map(library.players.map(p => [p.id, p])).values()]
  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const form = new FormData(event.currentTarget)
      const names = String(form.get('players')).split(/[,\n]/).map(n => n.trim()).filter(Boolean)
      const players: Player[] = names.map(name => ({ ...v, id: newId(), name, assessments: {} }))
      const roster = [...reuse.map(id => available.find(p => p.id === id)!), ...players]
      if (roster.length < 6) throw new Error('Choose at least six players for the roster.')
      const selectedLeague: League = form.get('league') === 'ttgva' ? ttgva : unknownLeague
      const league = library.leagues.find(item => item.id === selectedLeague.id && item.revision === 1) ?? selectedLeague
      const team: Team = { ...v, id: newId(), name: String(form.get('team')), league: reference(league), roster: roster.map(reference) }
      const lineup: Lineup = { ...v, id: newId(), name: String(form.get('lineup')), team: reference(team), adaptation: 'original',
        slots: roster.slice(0, 6).map((person, index) => ({ id: newId(), player: reference(person), role: slotRoles[index] })) }
      const plan: Strategy = { ...v, id: newId(), name: String(form.get('plan')), league: reference(league),
        lineup: reference(lineup), status: 'draft', cases: draftCases(lineup) }
      onCreate(validateLibrary({ ...library, players: [...library.players, ...players],
        leagues: library.leagues.includes(league) ? library.leagues : [...library.leagues, league],
        teams: [...library.teams, team], lineups: [...library.lineups, lineup], plans: [...library.plans, plan] }), plan)
    } catch (e) { setProblem(e instanceof Error ? e.message : 'Unable to create team.') }
  }
  return <form className="s1-card s1-form" onSubmit={create}>
    <h2>Create team and plan</h2>
    <label>Team name<input name="team" required maxLength={100} /></label>
    <label>Lineup name<input name="lineup" defaultValue="Starting six" required maxLength={100} /></label>
    <label>Plan name<input name="plan" required maxLength={100} /></label>
    <label>League profile<select name="league"><option value="unknown">Rules unverified</option><option value="ttgva">TTGVA C Grade · March 2025</option></select></label>
    {!!available.length && <fieldset><legend>Reuse players</legend><div className="s1-checks">{available.map(p => <label key={p.id}>
      <input type="checkbox" checked={reuse.includes(p.id)} onChange={e => setReuse(e.target.checked ? [...reuse, p.id] : reuse.filter(id => id !== p.id))} />{p.name}</label>)}</div></fieldset>}
    <label>New player names<textarea name="players" rows={3} maxLength={4000} placeholder="One name per line, or comma-separated" /></label>
    <p>Selected players come first in selection order, followed by new names. The first six start in P1–P6 order, with the setter in P1. Remaining players are reserves.</p>
    {problem && <p role="alert">{problem}</p>}
    <div className="s1-row"><button className="s1-primary">Create draft</button><button type="button" onClick={onCancel}>Cancel</button></div>
  </form>
}
