import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createStrategyStore, STRATEGY_STORAGE_KEY } from './strategyStore.ts'
import { createStrategy, exportStrategy, readStrategyLink, strategyLink } from '../lib/strategyDraft.ts'
import { createReviewPacket, exportReviewPacket } from '../lib/strategyShare.ts'

const base = { team: JSON.parse(readFileSync(new URL('../../public/plans/team.json', import.meta.url))), plans: JSON.parse(readFileSync(new URL('../../public/plans/rotations.json', import.meta.url))) }
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) } }
const comparable = ({ id, name, ...rest }) => rest
const covered = () => {
  const d = createStrategy('All coverage scopes', 'Coach')
  const zone = { role:'tip', radiusX:.1234, radiusZ:4.4321, offsetX:-4.4321, offsetZ:3.1234 }
  d.overrides['3/us'] = { coverage:{ Receive:{ harry:zone } }, laterDefend:{ coverage:{ georgia:{...zone,role:'deep'} } } }
  d.caseOverrides = {'3/us/right/harry':{coverage:{Defend:{caleb:{...zone,role:'custom'}}},laterDefend:{coverage:{jaz:{...zone,role:'attack-cover'}}}}}
  d.notes={players:{'3/us':{Defend:{harry:{primary:'My own plain text'}}}}}
  return d
}

test('every coverage scope survives preview/save-copy, reload, duplicate, JSON, fragment and Review packet with independent identities', () => {
  const d = covered(), storage = memory(), store = createStrategyStore(storage), get = store.getState
  get().previewImport(exportStrategy(d)); assert.equal(storage.getItem(STRATEGY_STORAGE_KEY),null)
  get().save(); assert.notEqual(get().working.id,d.id); const savedId=get().working.id
  assert.deepEqual(comparable(createStrategyStore(storage).getState().working),comparable(d))
  get().newStrategy(true); assert.notEqual(get().working.id,savedId)
  assert.deepEqual(comparable(get().working),comparable(d)); get().save()
  const json = exportStrategy(get().working), count = get().library.length
  const link = strategyLink('https://example.test/?mode=rotations',get().working)
  get().previewImport(JSON.stringify(readStrategyLink(new URL(link).hash)))
  get().metadata('Recipient preview','Recipient')
  assert.equal(get().preview,true); assert.equal(get().library.length,count)
  assert.equal(JSON.stringify(get().library.at(-1)),JSON.stringify(JSON.parse(json)))
  get().save(); assert.equal(get().library.length,count+1)
  const context={rotation:3,serve:'us',attackSide:'right',firstTouch:'harry',stage:'Defend',playerId:'harry'}
  get().previewImport(exportReviewPacket(createReviewPacket(base,d,context)))
  assert.equal(get().preview,true); assert.deepEqual(comparable(get().working),comparable(d))
  get().save(); assert.equal(get().library.length,count+2)
  const ids=get().library.map(d=>d.id);assert.equal(new Set(ids).size,ids.length)
  assert.deepEqual(comparable(createStrategyStore(storage).getState().working),comparable(d))
})

test('failed packet and file imports never replace working data, history or persisted library', () => {
  const storage=memory(), store=createStrategyStore(storage), get=store.getState
  get().previewImport(exportStrategy(covered()));get().save();get().metadata('Keep me','Author')
  const before=get(), saved=storage.getItem(STRATEGY_STORAGE_KEY)
  for(const json of ['{','null',' '.repeat(100001),JSON.stringify({...covered(),schemaVersion:9}),
    '{"kind":"rotation-studio-review-packet","schemaVersion":1,"draft":{"__proto__":{}}}']) {
    get().previewImport(json)
    assert.equal(get().working,before.working); assert.equal(get().library,before.library);assert.equal(get().past,before.past)
    assert.equal(storage.getItem(STRATEGY_STORAGE_KEY),saved); assert.ok(get().error)
  }
})

test('V1 backup is never mutated by duplicate, copy, import, metadata, deletion or V2 reload', () => {
  const storage=memory(), d={...createStrategy('V1 fixture','Coach'),schemaVersion:1}
  d.overrides={'1/they':{anchors:{Receive:{caleb:{x:1.23,z:5.67}}}}}
  const key='rotation-studio-strategies-v1', raw=JSON.stringify({schemaVersion:1,library:[d],activeId:d.id})
  storage.setItem(key,raw)
  const store=createStrategyStore(storage),get=store.getState
  assert.deepEqual(get().working.overrides,d.overrides); assert.equal(storage.getItem(STRATEGY_STORAGE_KEY),null)
  get().newStrategy(true);get().save();get().metadata('Copy','Coach');get().previewImport(exportStrategy(d));get().save()
  get().remove(d.id); createStrategyStore(storage)
  assert.equal(storage.getItem(key),raw)
})
