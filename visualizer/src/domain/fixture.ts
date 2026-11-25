import { emptyLibrary, reference } from './authoring.ts'
import type { Case, Contact, League, Library, Lineup, Moment, Player, Proposal, Spot, Strategy, Team } from './contracts.ts'

export const unknownLeague: League = { schemaVersion: 1, id: 'unverified-rules', revision: 1,
  name: 'Rules unverified', rules: [] }
const bylaws = 'https://www.ttgva.com.au/Site/documents/Bylaws.pdf'
export const ttgva: League = { schemaVersion: 1, id: 'ttgva-c-2025-03', revision: 1, name: 'TTGVA C Grade · March 2025',
  rules: [
    { clause: '3.4.7', source: bylaws, checkedOn: '2026-11-25', summary: 'Both teams maintain rotational order at the service hit. This overrides FIVB 7.4.' },
    { clause: '3.4.6', source: bylaws, checkedOn: '2026-11-25', summary: 'No libero in C Grade.' },
    { clause: '3.2', source: bylaws, checkedOn: '2026-11-25', summary: 'Continuous substitutions permitted under the C/D conditions. Named variants do not track live substitutions.' },
  ] }
const v = { schemaVersion: 1, revision: 1 } as const
const colours = ['#74c5ff', '#ffaf64', '#5ee4b4', '#fed36f', '#bea9ff', '#f895a8']
const serviceSpots = [{ x: 2.9, z: 7.8 }, { x: 2.9, z: 1.9 }, { x: 0, z: 1.9 }, { x: -2.9, z: 1.9 }, { x: -2.9, z: 7.8 }, { x: 0, z: 7.8 }]

export function initialMoment(lineup: Lineup, rotation: number, serve: Case['serve']): Moment {
  return { id: 'start', name: 'Starting positions', ms: 0, athletes: lineup.slots.map((s, i) => {
    const position = serviceSpots[(i - rotation + 7) % 6]
    return { slot: s.id, position: { ...position, z: serve === 'us' && position === serviceSpots[0] ? 9.7 : position.z },
      duty: serve === 'us' && position === serviceSpots[0] ? 'serve' : 'ready' }
  }) }
}

export function draftCases(lineup: Lineup): Case[] {
  return Array.from({ length: 6 }, (_, i) => i + 1).flatMap(rotation => (['they', 'us'] as const).map(serve => ({
    id: 'r' + rotation + '-' + serve, name: 'R' + rotation + ' · ' + (serve === 'they' ? 'They serve' : 'We serve'),
    rotation, serve, conditions: {}, status: 'draft', moments: [initialMoment(lineup, rotation, serve)], contacts: [], flights: [],
  })))
}

function authoredCase(c: Case, lineup: Lineup): Case {
  const start = c.moments[0]
  const setter = lineup.slots.find(s => s.role === 'setter')!.id
  const serveSlot = start.athletes.find(a => a.duty === 'serve')?.slot
  const passer = start.athletes.find(a => a.slot !== setter && a.slot !== serveSlot && a.position.z > 5)!.slot
  const hitter = start.athletes.find(a => a.slot !== setter && a.position.z < 3)!.slot
  const stage = (id: string, name: string, ms: number, slot: string, position: Spot, duty: Moment['athletes'][number]['duty']): Moment => ({
    id, name, ms, athletes: start.athletes.map((a, index) => ({
      slot: a.slot, position: a.slot === slot ? position : { x: +(a.position.x * .86).toFixed(2), z: +(a.position.z > 5 ? 7.2 + index * .11 : 2.15 + index * .17).toFixed(2) },
      duty: a.slot === slot ? duty : duty === 'attack' ? 'cover' : 'defend',
    })),
  })
  const reception = stage('receive', c.serve === 'us' ? 'First dig' : 'Serve receive', 1800, passer, { x: -1.6, z: 5.8 }, 'receive')
  const set = stage('set', 'First set', 2800, setter, { x: .7, z: 1.3 }, 'set')
  const hit = stage('hit', 'Our attack', 3800, hitter, { x: -2.8, z: .9 }, 'attack')
  const defend = stage('dig', 'Later dig', 6400, passer, { x: 1.2, z: 6.2 }, 'receive')
  const next = stage('later-set', 'Later set', 7600, setter, { x: -.7, z: 1.7 }, 'set')
  const end = stage('recover', 'Recover', 9000, hitter, { x: -2.1, z: 2.6 }, 'recover')
  const opponentMoment = { ...structuredClone(reception), id: 'return', name: 'Opponent return', ms: 5000 }
  const initialReturn = { ...structuredClone(reception), id: 'first-return', name: 'Opponent first attack', ms: 900 }
  const playerContact = (m: Moment, kind: Contact['kind'], slot: string, y: number): Contact =>
    ({ id: 'ball-' + m.id, moment: m.id, kind, actor: { kind: 'slot', slot, y } })
  const opponent = (m: Moment, kind: Contact['kind'], x: number, z: number, y: number): Contact =>
    ({ id: 'ball-' + m.id, moment: m.id, kind, actor: { kind: 'opponent', point: { x, z, y } } })
  const contacts: Contact[] = [
    serveSlot ? playerContact(start, 'serve', serveSlot, 2.1) : opponent(start, 'serve', -2, -9.8, 2.1),
    ...(serveSlot ? [opponent(initialReturn, 'attack', -.8, -2.7, 2.5)] : []),
    playerContact(reception, serveSlot ? 'dig' : 'pass', passer, 1.15),
    playerContact(set, 'set', setter, 2.25), playerContact(hit, 'attack', hitter, 2.6),
    opponent(opponentMoment, 'attack', 2.1, -.9, 2.5), playerContact(defend, 'dig', passer, 1.15),
    playerContact(next, 'set', setter, 2.25),
    { id: 'ball-recover', moment: end.id, kind: 'land', actor: { kind: 'court', point: { x: 2.5, z: -4.7, y: 0 } } },
  ]
  return { ...c, moments: [start, ...(serveSlot ? [initialReturn] : []), reception, set, hit, opponentMoment, defend, next, end],
    contacts, flights: contacts.slice(1).map((to, i) => ({ from: contacts[i].id, to: to.id, apex: 3.6 })) }
}

export function fixture(): Library {
  const players: Player[] = ['Ari', 'Bo', 'Cleo', 'Dara', 'Emi', 'Finn', 'Gio', 'Hana', 'Indi', 'Jules', 'Kai', 'Lee'].map((name, i) => ({
    ...v, id: 'sample-person-' + (i + 1), name, appearance: colours[i % colours.length],
    assessments: { receive: { rating: null } },
  }))
  const teams: Team[] = [
    { ...v, id: 'sample-aurora', name: 'Aurora (sample)', league: reference(unknownLeague), roster: players.slice(0, 7).map(reference) },
    { ...v, id: 'sample-harbour', name: 'Harbour (sample)', league: reference(unknownLeague), roster: [players[0], ...players.slice(7)].map(reference) },
  ]
  const initial: Lineup = { ...v, id: 'sample-six', name: 'Starting six', team: reference(teams[0]), adaptation: 'original',
    slots: teams[0].roster.slice(0, 6).map((player, i) => ({
      id: 'aurora-slot-' + (i + 1), player, role: i === 0 ? 'setter' : i === 3 ? 'opposite' : i % 2 ? 'outside' : 'middle',
    })) }
  const fillIn: Lineup = { ...initial, id: 'sample-gio', name: 'Gio fills in at setter', parent: reference(initial), adaptation: 'needs-review',
    slots: initial.slots.map((s, i) => i ? s : { ...s, player: teams[0].roster[6] }) }
  const plan: Strategy = { ...v, id: 'sample-aurora-plan', name: 'Aurora practice', lineup: reference(initial), league: reference(unknownLeague),
    status: 'draft', cases: draftCases(initial).map(c => authoredCase(c, initial)) }
  return { ...emptyLibrary(), players, teams, leagues: [unknownLeague, ttgva], lineups: [initial, fillIn], plans: [plan] }
}

export function sampleProposal(l = fixture()): Proposal {
  const plan = l.plans[0], lineup = l.lineups[0], caseId = plan.cases[0].id, slotId = lineup.slots[0].id
  return { kind: 'rotation-proposal', schemaVersion: 1, proposalId: 'sample-proposal', operationId: 'sample-move-1',
    plan: reference(plan), lineup: reference(lineup), league: plan.league, assessments: lineup.slots.map(s => s.player),
    scope: [{ caseId, momentId: 'receive', slotId }],
    operations: [{ type: 'move', caseId, momentId: 'receive', slotId, position: { x: 1.4, z: 4.9 } }],
    rationale: 'Show an exact-case transition adjustment for the selected slot.',
    assumptions: ['Synthetic teaching scenario.'], questions: [], sources: [], completeness: 'all-base-cases' }
}
