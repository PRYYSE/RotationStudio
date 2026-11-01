import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { createTeamReference, referencePath } from './teamReference.ts'
import { applyStrategy, createStrategy } from './strategyDraft.ts'
import { sampleTrack } from './rotationModel.ts'

const source = new URL('../ui/TeamReference.tsx', import.meta.url)
const code = ts.transpileModule(readFileSync(source, 'utf8'), { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
} }).outputText.replace(/from (["'])([^"']+)\1/g, (_, quote, specifier) =>
  `from ${JSON.stringify(specifier.startsWith('.') ? new URL(specifier + '.ts', source).href : import.meta.resolve(specifier))}`)
const { referenceSnapshots, MiniCourt } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))),
  plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }

test('quick snapshots retain all supplied stages and every authored phase across 48 cases without mutation', () => {
  const before = JSON.stringify(base)
  for (const root of base.plans.scenarios) for (const s of [root, ...Object.values(root.alternates ?? {})]) {
    const data = createTeamReference(base.team, s, null, null), original = JSON.stringify(data)
    const stages = referenceSnapshots(data, s)
    assert.ok(stages.length > data.stages.length, 'later play must be represented')
    for (const phase of s.phases) assert.ok(stages.some(p => p.time === phase.time))
    assert.deepEqual(stages.filter(p => data.stages.some(d => d.time === p.time)).map(p => p.stage), data.stages.map(p => p.stage))
    assert.ok(stages.some(p => /next dig/i.test(p.stage)))
    for (const [index, stage] of stages.entries()) {
      assert.equal(stage.pathFrom, stages[index - 1]?.stage ?? null)
      if (index) assert.ok(stage.time > stages[index - 1].time)
      for (const a of stage.actors) {
        const p = sampleTrack(s.tracks[a.id], stage.time)
        assert.deepEqual(a.point, { x: p.x, z: p.z })
        assert.equal(a.role, p.role)
      }
      const markup = renderToStaticMarkup(createElement(MiniCourt, { stage, path: [], player: '' }))
      assert.equal((markup.match(/data-reference-player=/g) ?? []).length, 6)
      for (let n = 1; n <= 6; n++) assert.match(markup, new RegExp(`>P${n}</text>`))
      for (const a of stage.actors) assert.ok(markup.includes(`data-position-anchor="true" cx="${150 + a.point.x * 24}" cy="${36 + a.point.z * 24}"`), 'position dot never moves with a crowded label')
      const labels = [...markup.matchAll(/<text x="([^"]+)" y="([^"]+)"[^>]+class="reference-mini-number"/g)].map(m => ({ x: Number(m[1]), y: Number(m[2]) }))
      assert.equal(labels.length, 6)
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) assert.ok(Math.hypot(labels[i].x - labels[j].x, labels[i].y - labels[j].y) >= 28, 'six distinct readable badges')
      assert.match(markup, /NET ↑/); assert.match(markup, /OUR ENDLINE ↓/)
    }
    assert.equal(JSON.stringify(data), original)
  }
  assert.equal(JSON.stringify(base), before)
})

test('local authored positions, roles, literal notes and bent incoming paths survive focus changes', () => {
  const draft = createStrategy('Quick reference', 'Coach')
  draft.overrides['3/they'] = { anchors: { Set: { logan: { x: -3.125, z: 3.875 } } }, routes: { Set: { logan: [{ x: -2, z: 4.25 }] } } }
  draft.notes = { players: { '3/they': { Set: { logan: { primary: '<script>literal</script>', ifDifferent: 'Read', fallback: 'Reset', teamCall: 'Mine' } } } } }
  const bundle = applyStrategy(base, draft).bundle, scenario = bundle.plans.scenarios.find(s => s.rotation === 3 && s.serve === 'they')
  const data = createTeamReference(bundle.team, scenario, draft, 'logan'), before = JSON.stringify({ data, scenario, draft })
  const stages = referenceSnapshots(data, scenario), index = stages.findIndex(s => s.stage === 'Set'), stage = stages[index]
  assert.deepEqual(stage.actors.find(a => a.id === 'logan').notes, draft.notes.players['3/they'].Set.logan)
  assert.ok(stages.filter(s => /next/i.test(s.stage)).every(s => s.actors.every(a => a.notes === null)), 'never borrow first-dig notes for later events')
  for (const player of ['', ...stage.actors.map(a => a.id)]) {
    const path = player ? referencePath(scenario.tracks[player], stages[index - 1].time, stage.time) : []
    const markup = renderToStaticMarkup(createElement(MiniCourt, { stage, path, player }))
    assert.equal((markup.match(/data-focused="true"/g) ?? []).length, player ? 1 : 0)
    if (player) assert.ok(markup.includes(`points="${path.map(p => `${150 + p.x * 24},${36 + p.z * 24}`).join(' ')}"`))
    if (player === 'logan') assert.ok(path.some(p => p.x === -2 && p.z === 4.25))
  }
  assert.equal(JSON.stringify({ data, scenario, draft }), before)
})
