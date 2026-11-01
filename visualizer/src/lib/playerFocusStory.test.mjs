import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { playerFocusStory } from './playerFocusStory.ts'
import { sampleTrack } from './rotationModel.ts'

const team = JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url)))
const plans = JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url)))
const cases = plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})])
const get = (rotation, serve) => plans.scenarios.find(s => s.rotation === rotation && s.serve === serve)
const freeze = o => { Object.freeze(o); Object.values(o).forEach(v => { if(v && typeof v === 'object') freeze(v) }) }
freeze(team); freeze(plans)

test('48 branches: every player and phase samples the actual next phase, ends honestly, never mutates source', () => {
  assert.equal(cases.length, 48)
  const before = JSON.stringify(plans)
  for (const s of cases) for (const [i, phase] of s.phases.entries()) for (const p of team.players) {
    const story = playerFocusStory(team, s, phase.time, p.id)
    assert.deepEqual(story.current, sampleTrack(s.tracks[p.id], phase.time))
    assert.equal(story.nextEvent, s.phases[i + 1])
    if (story.nextEvent) {
      const next = sampleTrack(s.tracks[p.id], story.nextEvent.time)
      assert.ok(story.nextText.includes(next.role === 'help' ? 'support position' : next.role))
      assert.match(story.nextText, /near-net|midcourt|deep/)
      assert.match(story.nextText, /left|middle|right/)
    } else assert.equal(story.nextText, 'Rally example ends here.')
    assert.doesNotMatch(story.now + story.nextText + story.ifText, /may be a front-row|ready hitter|cover your|Needs coaching note/)
  }
  assert.equal(JSON.stringify(plans), before)
})

test('R1 own serve identifies server and stationary next phase without fabricating movement', () => {
  const s = get(1, 'us'), story = playerFocusStory(team, s, 0, 'harry')
  assert.match(story.now, /You serve/)
  assert.equal(story.moment, 'Before serve contact')
  assert.equal(story.nextEvent.label, 'Serve hit')
  assert.match(story.nextText, /Hold that position.*deep right.*serve/)
})

test('contact ownership, hitter and blocker differ from mere attack role or eligibility', () => {
  const s = get(1, 'they')
  assert.match(playerFocusStory(team, s, s.firstContact.time, 'caleb').now, /Named first contact/)
  assert.match(playerFocusStory(team, s, s.secondContact.time, 'harry').now, /Makes second contact/)
  const attack = s.phases.find(p => p.label === 'Our attack').time
  assert.match(playerFocusStory(team, s, attack, 'logan').now, /Shown hitter/)
  assert.match(playerFocusStory(team, s, attack, 'georgia').now, /hit on this ball is not authored/)
  assert.match(playerFocusStory(team, s, s.phases.find(p => p.label === 'Defence ready').time, 'logan').now, /Shown blocker/)
})

test('authored notes take priority; placeholders never become authority; missing options are singular', () => {
  const s = get(3, 'they').alternates.harry
  const notes = { primary: 'My primary', ifDifferent: 'My conditional', fallback: 'My fallback' }
  const story = playerFocusStory(team, s, s.firstContact.time, 'harry', notes)
  assert.equal(story.now, notes.primary)
  assert.equal(story.ifText, 'My conditional My fallback')
  assert.equal(story.primarySource, 'user-authored')
  const normal = get(3, 'they')
  const alternative = playerFocusStory(team, s, s.firstContact.time, 'trent', { fallback: 'Needs coaching note' }, null, normal)
  assert.match(alternative.ifText, new RegExp(team.players.find(p => p.id === normal.firstContact.player).name))
  assert.match(alternative.ifText, /Harry makes second contact in the other authored branch/)
  assert.doesNotMatch(alternative.ifText, /Trent makes second contact|best|always/)
  const reverse = playerFocusStory(team, normal, normal.firstContact.time, 'caleb', null, null, s)
  assert.match(reverse.ifText, /If Harry takes first contact instead, Trent makes second contact/)
  assert.equal(playerFocusStory(team, s, s.secondContact.time, 'trent', null, null, s).ifText, 'No other specific option is authored for this moment.')
  assert.equal(playerFocusStory(team, get(1, 'they'), 0, 'jaz').ifText, 'No other specific option is authored for this moment.')
})

test('whole team gives real sequence facts and never personal instructions; later contacts are separate', () => {
  for (const s of cases) {
    const teamStory = playerFocusStory(team, s, 0, null)
    assert.match(teamStory.now, /First contact:.*Second contact:/)
    assert.doesNotMatch(teamStory.now + teamStory.nextText, /your|You |Hold/)
    const openingAttack = playerFocusStory(team, s, s.phases.find(p => p.label === 'Our attack').time, null)
    assert.ok(openingAttack.now.includes(`Second contact: ${team.players.find(p => p.id === s.secondContact.player).name}`))
    const later = s.phases.find(p => p.label === 'Next dig')
    const pass = s.ball.find(b => b.kind === 'pass' && Math.abs(b.start - later.time) < .001)
    if (pass) {
      const id = Object.keys(s.tracks).find(id => {
        const p = sampleTrack(s.tracks[id], later.time)
        return p.role === 'pass' && Math.hypot(p.x - pass.from.x, p.z - pass.from.z) < .1
      })
      if (id) assert.match(playerFocusStory(team, s, later.time, id).now, /Named first contact/)
    }
  }
})

test('current point and next destination follow changed active tracks, including intermediate times', () => {
  const s = structuredClone(get(1, 'they'))
  s.tracks.jaz[2] = { ...s.tracks.jaz[2], x: 3, z: 4, role: 'help' }
  const story = playerFocusStory(team, s, 1.8, 'jaz')
  assert.deepEqual(story.current, sampleTrack(s.tracks.jaz, 1.8))
  assert.equal(story.nextEvent.time, 2.75)
  assert.equal(story.nextText, 'Displayed destination: midcourt right · support position.')
  const loop = structuredClone(get(1, 'us'))
  loop.tracks.harry[1].via = [{ x: 0, z: 10 }]
  assert.doesNotMatch(playerFocusStory(team, loop, 0, 'harry').nextText, /Hold that position/)
})
