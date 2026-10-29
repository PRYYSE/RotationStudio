import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { sourceEvents } from './strategyEvents.ts'

test('nested event navigator renders actual first/next source events, selected identity and accessible stepping', async () => {
  const file = new URL('../ui/EventNavigator.tsx', import.meta.url)
  assert.ok(existsSync(file), 'Event navigator must be implemented')
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
    .replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  const { EventNavigator } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
  const source = JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))).scenarios.find(s => s.rotation === 1 && s.serve === 'us')
  const events = sourceEvents(source), markup = renderToStaticMarkup(createElement(EventNavigator, { events, selectedId: 'p8:next-dig', onSelect: () => assert.fail('render must never select or edit') }))
  assert.match(markup, /<details/); assert.match(markup, /All events/)
  assert.match(markup, /Our dig.*5\.40 s.*occurrence 1/)
  assert.match(markup, /Next dig.*12\.29 s.*occurrence 2/)
  assert.match(markup, /Next set ready.*14\.71 s/)
  assert.match(markup, /data-event-id="p8:next-dig"[^>]*aria-pressed="true"/)
  assert.match(markup, /aria-label="Previous source event"/); assert.match(markup, /aria-label="Next source event"/)
  assert.equal((markup.match(/data-event-id=/g) ?? []).length, events.length)
})
