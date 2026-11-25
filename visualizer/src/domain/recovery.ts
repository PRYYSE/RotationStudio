import { newId, reference, requireRef, sameRef, stableJson, validateLibrary } from './authoring.ts'
import type { Library, Lineup, Ref, Strategy, Team } from './contracts.ts'

// Import a divergent private plan as a new draft. Only its exact dependencies
// follow it. The current library history and private assessments stay intact.
export function recoverPlan(library: Library, source: Library, plan: Strategy) {
  const next: Library = { ...library, players: [...library.players], teams: [...library.teams],
    leagues: [...library.leagues], lineups: [...library.lineups], plans: [...library.plans], sources: [...library.sources] }
  const chain: Lineup[] = []
  for (let value: Lineup | undefined = requireRef(source.lineups, plan.lineup, 'recovery lineup'); value;) {
    chain.unshift(value)
    value = value.parent ? requireRef(source.lineups, value.parent, 'parent lineup') : undefined
  }
  const exact = <T extends Ref>(all: T[], value: T) => all.find(item =>
    sameRef(item, value) && stableJson(item) === stableJson(value))
  const key = (value: Ref) => value.id + '/' + value.revision
  const players = new Map<string, Ref>()
  const copyPlayer = (ref: Ref) => {
    const cached = players.get(key(ref))
    if (cached) return cached
    const person = requireRef(source.players, ref, 'recovery player')
    const existing = exact(next.players, person)
    const saved = existing ?? { ...person, id: newId(), revision: 1 }
    if (!existing) next.players.push(saved)
    const copied = reference(saved)
    players.set(key(ref), copied)
    return copied
  }
  const copyLeague = (ref: Ref) => {
    const original = requireRef(source.leagues, ref, 'recovery league')
    const existing = exact(next.leagues, original)
    if (existing) return reference(existing)
    const copy = { ...original, id: original.revision === 1 && !next.leagues.some(l => l.id === ref.id) ? ref.id : newId(), revision: 1 }
    next.leagues.push(copy)
    return reference(copy)
  }
  const teamId = newId()
  const teams = new Map<string, Team>()
  let previous: Lineup | undefined
  for (const lineup of chain) {
    const original = requireRef(source.teams, lineup.team, 'recovery team')
    let team = teams.get(key(original))
    if (!team) {
      team = { ...original, id: teamId, revision: teams.size + 1,
        roster: original.roster.map(copyPlayer), league: copyLeague(original.league) }
      teams.set(key(original), team)
      next.teams.push(team)
    }
    const recovered: Lineup = { ...lineup, id: newId(), revision: 1, team: reference(team),
      slots: lineup.slots.map(s => ({ ...s, player: copyPlayer(s.player) })), parent: previous && reference(previous) }
    next.lineups.push(recovered)
    previous = recovered
  }
  const lineup = previous!
  let sourceRef = plan.source
  if (sourceRef) {
    const receipt = source.sources.find(s => s.id === sourceRef?.id)!
    const existing = next.sources.find(s => stableJson(s) === stableJson(receipt))
    if (!existing) {
      const copy = { ...receipt, id: newId() }
      next.sources.push(copy)
      sourceRef = { id: copy.id, sha256: copy.sha256 }
    }
  }
  const copy: Strategy = { ...plan, id: newId(), revision: 1, name: plan.name.slice(0, 87) + ' (recovered)', status: 'draft',
    lineup: reference(lineup), league: requireRef(next.teams, lineup.team, 'recovered team').league, source: sourceRef,
    cases: plan.cases.map(c => ({ ...c, status: 'draft' })) }
  next.plans.push(copy)
  return { library: validateLibrary(next), plan: copy }
}
