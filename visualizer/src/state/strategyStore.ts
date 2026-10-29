import { create } from 'zustand'
import { createStrategy, exportStrategy, parseStrategy, PLAYER_IDS, validateStrategy } from '../lib/strategyDraft.ts'
import type { PlayerId, RotationKey, StrategyDraft, StrategyStage } from '../lib/strategyDraft.ts'
import type { Bundle, Spot } from '../lib/rotationTypes.ts'

export const STRATEGY_STORAGE_KEY = 'rotation-studio-strategies-v1'
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>
type State = {
  library: StrategyDraft[]; working: StrategyDraft | null; preview: boolean; saved: boolean; error: string
  editing: boolean; stage: StrategyStage; routeVisible: boolean
  past: StrategyDraft[]; future: StrategyDraft[]; gesture: StrategyDraft | null
  newStrategy: (fromCurrent: boolean, base?: Bundle) => void; select: (id: string | null) => void
  metadata: (name: string, author: string) => void; save: () => void; remove: (id: string) => void
  previewImport: (json: string) => void; setStage: (stage: StrategyStage) => void
  beginGesture: () => void; endGesture: (cancel?: boolean) => void
  move: (key: RotationKey, player: string, spot: Spot) => void
  bend: (key: RotationKey, player: string, points: Spot[]) => void
  resetStage: (key: RotationKey) => void; resetRotation: (key: RotationKey) => void
  undo: () => void; redo: () => void
}
export function createStrategyStore(storage?: Storage) {
  let library: StrategyDraft[] = [], active: string | null = null, error = ''
  try {
    const raw = storage?.getItem(STRATEGY_STORAGE_KEY)
    if (raw) {
      if (raw.length > 5_100_000) throw new Error('Library too large')
      const data = JSON.parse(raw)
      if (data.schemaVersion !== 1 || !Array.isArray(data.library) || data.library.length > 50) throw new Error('Invalid library')
      library = data.library.map((d: unknown) => parseStrategy(JSON.stringify(d)))
      if (new Set(library.map(d => d.id)).size !== library.length) throw new Error('Duplicate strategy IDs')
      active = typeof data.activeId === 'string' ? data.activeId : null
    }
  } catch { library = []; error = 'Could not read local strategy library. Existing browser data has been left untouched; export any recovered work before replacing it.' }
  const initial = library.find(d => d.id === active) ?? null
  return create<State>((set, get) => {
    const persist = (next: StrategyDraft[], activeId: string | null): boolean => {
      if (error) {
        set({ saved: false, error: 'Local library is unreadable. Saving is paused to protect the existing data. Export your strategy JSON to keep new work.' })
        return false
      }
      try {
        if (!storage) throw new Error('Storage unavailable')
        if (next.length > 50) throw new Error('Library limit: 50 strategies')
        next.forEach(d => exportStrategy(d))
        storage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, library: next, activeId }))
        set({ error: '' }); return true
      } catch { set({ saved: false, error: 'Could not save locally (storage unavailable, full, or 50-strategy limit). Your work is still here; export JSON to keep it.' }); return false }
    }
    const autosave = () => {
      const s = get(), working = s.working
      if (!working || s.preview || !s.library.some(d => d.id === working.id)) { set({ saved: false }); return }
      const next = s.library.map(d => d.id === working.id ? structuredClone(working) : d)
      const saved = persist(next, working.id)
      set({ ...(saved ? { library: next } : {}), saved })
    }
    const update = (mutate: (draft: StrategyDraft) => void) => {
      const s = get()
      if (!s.working) return
      try {
        const working = structuredClone(s.working); mutate(working); validateStrategy(working)
        if (JSON.stringify(working) === JSON.stringify(s.working)) return
        set({ working, saved: false, error: '', future: s.gesture ? s.future : [], past: s.gesture ? s.past : [...s.past.slice(-49), s.working] })
        if (!s.gesture) autosave()
      } catch (e) { set({ error: e instanceof Error ? e.message : 'Invalid edit.' }) }
    }
    const rotation = (d: StrategyDraft, key: RotationKey) => d.overrides[key] ??= {}
    return {
      library, working: initial ? structuredClone(initial) : null, preview: false, saved: !!initial, error,
      editing: false, stage: 'Start', routeVisible: true, past: [], future: [], gesture: null,
      newStrategy: (fromCurrent, base) => {
        const previous = get().working, working = createStrategy('My strategy', 'Coach', base)
        if (fromCurrent && previous) { working.overrides = structuredClone(previous.overrides); working.baseRevision = previous.baseRevision; working.name = `${previous.name.slice(0, 73)} copy`; working.author = previous.author }
        set({ working, preview: false, saved: false, error: '', past: [], future: [], gesture: null })
      },
      select: (id) => {
        const working = get().library.find(d => d.id === id) ?? null
        set({ working: working ? structuredClone(working) : null, preview: false, saved: !!working, past: [], future: [], gesture: null, error: '' })
        persist(get().library, working?.id ?? null)
      },
      metadata: (name, author) => update(d => { d.name = name; d.author = author }),
      save: () => {
        const s = get()
        if (!s.working) return
        const working = structuredClone(s.working)
        if (s.preview) working.id = crypto.randomUUID()
        try { validateStrategy(working) } catch { set({ error: 'Enter a name and author before saving.' }); return }
        const next = s.library.some(d => d.id === working.id) ? s.library.map(d => d.id === working.id ? working : d) : [...s.library, working]
        if (persist(next, working.id)) set({ library: next, working, preview: false, saved: true, past: [], future: [], gesture: null })
      },
      remove: (id) => {
        const s = get(), next = s.library.filter(d => d.id !== id), selected = s.working?.id === id && !s.preview
        if (!persist(next, selected ? null : s.working?.id ?? null)) return
        set({ library: next, ...(selected ? { working: null, saved: false, past: [], future: [], gesture: null } : {}) })
      },
      previewImport: (json) => {
        try { const working = parseStrategy(json); set({ working, preview: true, saved: false, past: [], future: [], gesture: null, error: '' }) }
        catch (e) { set({ error: e instanceof Error ? e.message : 'Invalid strategy JSON.' }) }
      },
      setStage: stage => set({ stage }),
      beginGesture: () => { const s = get(); if (s.working && !s.gesture) set({ gesture: structuredClone(s.working) }) },
      endGesture: (cancel = false) => {
        const s = get(), before = s.gesture
        if (!before) return
        if (cancel) { set({ working: before, gesture: null }); autosave(); return }
        set({ gesture: null, ...(JSON.stringify(before) !== JSON.stringify(s.working) ? { past: [...s.past.slice(-49), before], future: [] } : {}) })
        autosave()
      },
      move: (key, player, point) => update(d => {
        const r = rotation(d, key), p = { x: point.x, z: point.z }
        if (player === 'target') r.setterTarget = p
        else {
          if (!PLAYER_IDS.includes(player as PlayerId)) throw new Error('Unknown athlete.')
          const anchors = r.anchors ??= {}, stage = anchors[get().stage] ??= {}
          stage[player as PlayerId] = p
        }
      }),
      bend: (key, player, points) => update(d => {
        if (!PLAYER_IDS.includes(player as PlayerId)) throw new Error('Choose an athlete for a route.')
        const r = rotation(d, key), routes = r.routes ??= {}, stage = routes[get().stage] ??= {}
        stage[player as PlayerId] = points.map(p => ({ x: p.x, z: p.z }))
      }),
      resetStage: key => update(d => {
        const r = d.overrides[key]; if (!r) return
        delete r.anchors?.[get().stage]; delete r.routes?.[get().stage]
        if (get().stage === 'Set') { delete r.setterTarget; delete r.readyOptions }
      }),
      resetRotation: key => update(d => { delete d.overrides[key] }),
      undo: () => { const s = get(), working = s.past.at(-1); if (!working || !s.working || s.gesture) return
        set({ working, past: s.past.slice(0, -1), future: [s.working, ...s.future].slice(0, 50) }); autosave() },
      redo: () => { const s = get(), working = s.future[0]; if (!working || !s.working || s.gesture) return
        set({ working, past: [...s.past, s.working].slice(-50), future: s.future.slice(1) }); autosave() },
    }
  })
}
function localStorageOrUndefined() { try { return window.localStorage } catch { return undefined } }
export const useStrategies = createStrategyStore(localStorageOrUndefined())
