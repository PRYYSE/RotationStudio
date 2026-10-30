import { create } from 'zustand'
import { createStrategy, exportStrategy, isCaseKey, laterDefendTime, PLAYER_IDS } from '../lib/strategyDraft.ts'
import { parseStrategyImport } from '../lib/strategyShare.ts'
import type { AthleteAction, CaseKey, CoverageZone, PlayerId, RotationKey, StrategyDraftV2, StrategyStage } from '../lib/strategyDraft.ts'
import type { Bundle, Scenario, Spot } from '../lib/rotationTypes.ts'
import { loadStrategyLibrary, STRATEGY_STORAGE_KEY } from '../lib/strategyLibrary.ts'
import type { StrategyStorage } from '../lib/strategyLibrary.ts'
import { requireSourceEvent, validateEventPatch, validateStrategyEvents } from '../lib/strategyEvents.ts'
import { coverageStage } from '../lib/coverage.ts'
import type { LaterDefend } from '../lib/strategyDraft.ts'

export { STRATEGY_STORAGE_KEY }
type StrategyDraft = StrategyDraftV2
type State = {
  library: StrategyDraft[]; working: StrategyDraft | null; preview: boolean; saved: boolean; error: string
  editing: boolean; stage: StrategyStage; routeVisible: boolean
  routeDirection: 'into' | 'out'
  scope: CaseKey | null; laterDefend: boolean
  event: { id: string; source: Scenario; contexts: Scenario[] } | null
  setEvent: (source: Scenario, id: string, base?: Bundle) => void; resetEvent: (key: RotationKey) => void
  setScope: (scope: CaseKey | null) => void; setLaterDefend: (scenario: Scenario | null) => void
  resetCase: (key: CaseKey) => void
  coverageDisplay: 'all' | 'selected' | 'off'; coverageHidden: PlayerId[]
  cameraCommand: { action: 'in' | 'out' | 'fit'; serial: number } | null
  zoomCamera: (action: 'in' | 'out' | 'fit') => void
  setCoverage: (key: RotationKey, player: PlayerId, zone: CoverageZone) => void
  resetCoverage: (key: RotationKey, player: PlayerId) => void
  past: StrategyDraft[]; future: StrategyDraft[]; gesture: StrategyDraft | null
  newStrategy: (fromCurrent: boolean, base?: Bundle) => void; select: (id: string | null) => void
  metadata: (name: string, author: string) => void; save: () => void; remove: (id: string) => void
  previewImport: (json: string, base?: Bundle) => void; setStage: (stage: StrategyStage) => void
  beginGesture: () => void; endGesture: (cancel?: boolean) => void
  move: (key: RotationKey, player: string, spot: Spot, preservePath?: boolean) => void
  setAction: (key: RotationKey, player: PlayerId, action: AthleteAction | null) => void
  bend: (key: RotationKey, player: string, points: Spot[]) => void
  bendAt: (key: RotationKey, player: string, id: string, points: Spot[]) => void
  prepareHitters: (key: RotationKey) => void
  resetStage: (key: RotationKey) => void; resetRotation: (key: RotationKey) => void
  undo: () => void; redo: () => void
}
export function createStrategyStore(storage?: StrategyStorage) {
  const { library, active, error } = loadStrategyLibrary(storage)
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
        storage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify({ schemaVersion: 2, library: next, activeId }))
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
        const working = structuredClone(s.working); mutate(working); exportStrategy(working)
        if (JSON.stringify(working) === JSON.stringify(s.working)) return
        set({ working, saved: false, error: '', future: s.gesture ? s.future : [], past: s.gesture ? s.past : [...s.past.slice(-49), s.working] })
        if (!s.gesture) autosave()
      } catch (e) { set({ error: e instanceof Error ? e.message : 'Invalid edit.' }) }
    }
    const rotation = (d: StrategyDraft, key: RotationKey, create = true) => {
      const scope = get().scope
      if (scope && !scope.startsWith(`${key}/`)) throw new Error('Selected case does not match this rotation/serve.')
      const overrides = scope ? (d.caseOverrides ?? (create ? d.caseOverrides = {} : {})) : d.overrides
      const k = scope ?? key
      // Both sparse maps contain the same rotation change shape.
      const map = overrides as Record<string, NonNullable<StrategyDraft['overrides'][RotationKey]>>
      return create ? map[k] ??= {} : map[k]
    }
    const eventPatch = (d: StrategyDraft, key: RotationKey, patch: LaterDefend, id?: string) => {
      const event = get().event!
      if (`${event.source.rotation}/${event.source.serve}` !== key || (get().scope && get().scope !== `${key}/${event.source.tactics?.opponentAttack}/${event.source.tactics?.firstTouch}`)) throw new Error('Source event does not match this case.')
      const scope = get().scope
      if (!scope && event.contexts.length !== 4) throw new Error('Shared event editing requires all four authored source cases. Select an exact case or reload the source.')
      const selectedId = id ?? event.id
      for (const source of scope ? [event.source] : event.contexts) validateEventPatch(source, selectedId, patch)
      const map = rotation(d, key).eventOverrides ??= {}, current = map[selectedId] ??= {}
      for (const field of ['anchors', 'routes', 'coverage', 'actions', 'preservePath'] as const) if (patch[field]) Object.assign(current, { [field]: { ...current[field], ...patch[field] } })
    }
    const freshId = (excluded?: string) => {
      for (let i = 0; i < 10; i++) {
        const id = crypto.randomUUID()
        if (id !== excluded && !get().library.some(d => d.id === id)) return id
      }
      throw new Error('Could not create an independent strategy ID. Export JSON to keep your work.')
    }
    return {
      library, working: initial ? structuredClone(initial) : null, preview: false, saved: !!initial && !error, error,
      editing: false, stage: 'Start', routeVisible: true, routeDirection: 'into', scope: null, laterDefend: false, event: null, past: [], future: [], gesture: null,
      coverageDisplay: 'all', coverageHidden: [], cameraCommand: null,
      zoomCamera: action => set({ cameraCommand: { action, serial: (get().cameraCommand?.serial ?? 0) + 1 } }),
      newStrategy: (fromCurrent, base) => {
        const previous = get().working
        const working = fromCurrent && previous ? structuredClone(previous) : createStrategy('My strategy', 'Coach', base)
        if (fromCurrent && previous) {
          working.name = `${previous.name.slice(0, 73)} copy`
        }
        try { working.id = freshId(previous?.id) } catch (e) { set({ error: String(e) }); return }
        set({ working, preview: false, saved: false, error: '', scope: null, laterDefend: false, event: null, past: [], future: [], gesture: null })
      },
      select: (id) => {
        const working = get().library.find(d => d.id === id) ?? null
        set({ working: working ? structuredClone(working) : null, preview: false, saved: !!working && !error, scope: null, laterDefend: false, event: null, past: [], future: [], gesture: null, error })
      },
      metadata: (name, author) => update(d => { d.name = name; d.author = author }),
      save: () => {
        const s = get()
        if (!s.working) return
        const working = structuredClone(s.working)
        try { if (s.preview) working.id = freshId(working.id); exportStrategy(working) }
        catch (e) { set({ error: e instanceof Error ? e.message : 'Invalid strategy.' }); return }
        const next = s.library.some(d => d.id === working.id) ? s.library.map(d => d.id === working.id ? working : d) : [...s.library, working]
        if (persist(next, working.id)) set({ library: next, working, preview: false, saved: true, past: [], future: [], gesture: null })
      },
      remove: (id) => {
        const s = get(), next = s.library.filter(d => d.id !== id), selected = s.working?.id === id && !s.preview
        if (!persist(next, selected ? null : s.working?.id ?? null)) return
        set({ library: next, ...(selected ? { working: null, saved: false, past: [], future: [], gesture: null } : {}) })
      },
      previewImport: (json, base) => {
        try { const working = parseStrategyImport(json); if (base) validateStrategyEvents(base, working)
          set({ working, preview: true, saved: false, scope: null, laterDefend: false, event: null, past: [], future: [], gesture: null, error: '' }) }
        catch (e) { set({ error: e instanceof Error ? e.message : 'Invalid strategy JSON.' }) }
      },
      setStage: stage => { if (!get().gesture) set({ stage, event: null, ...(stage !== 'Defend' ? { laterDefend: false } : {}) }) },
      setEvent: (source, id, base) => {
        if (get().gesture) return
        try {
          const event = requireSourceEvent(source, id)
          const contexts = (base ? base.plans.scenarios.flatMap(s => [s, ...Object.values(s.alternates ?? {})]) : [source, ...Object.values(source.alternates ?? {})])
            .filter(s => s.rotation === source.rotation && s.serve === source.serve)
          set({ event: { id, source, contexts }, stage: coverageStage(source, event.time), laterDefend: false, error: '' })
        } catch (e) { set({ error: e instanceof Error ? e.message : 'Invalid source event.' }) }
      },
      resetEvent: key => update(d => {
        if (!get().event) return
        const r = rotation(d, key, false)
        if (!r?.eventOverrides) return
        delete r.eventOverrides[get().event!.id]
        if (!Object.keys(r.eventOverrides).length) delete r.eventOverrides
      }),
      setScope: scope => {
        if (get().gesture) return
        if (scope !== null && !isCaseKey(scope)) { set({ error: 'Invalid case scope.' }); return }
        set({ scope, laterDefend: false })
      },
      setLaterDefend: scenario => {
        if (get().gesture) return
        if (scenario && (get().stage !== 'Defend' || laterDefendTime(scenario) === undefined)) { set({ error: 'Later defence requires our authored Defend again event.' }); return }
        set({ laterDefend: !!scenario, event: null })
      },
      beginGesture: () => { const s = get(); if (s.working && !s.gesture) set({ gesture: structuredClone(s.working) }) },
      endGesture: (cancel = false) => {
        const s = get(), before = s.gesture
        if (!before) return
        const wasSaved = !s.preview && !s.error && s.library.some(d => d.id === before.id && JSON.stringify(d) === JSON.stringify(before))
        if (cancel) { set({ working: before, gesture: null, saved: wasSaved }); return }
        const changed = JSON.stringify(before) !== JSON.stringify(s.working)
        set({ gesture: null, ...(changed ? { past: [...s.past.slice(-49), before], future: [] } : { saved: wasSaved }) })
        if (changed) autosave()
      },
      move: (key, player, point, preservePath = false) => update(d => {
        const r = rotation(d, key), p = { x: point.x, z: point.z }
        if (get().event) {
          if (!PLAYER_IDS.includes(player as PlayerId)) throw new Error('Select an athlete; event timing and touch ownership are read-only.')
          if (preservePath) d.coachingVersion = 1
          eventPatch(d, key, { anchors: { [player]: p }, ...(preservePath ? { preservePath: { [player]: true } } : {}) }); return
        }
        if (get().laterDefend) {
          if (player === 'target' || key.split('/')[1] !== 'us' || !PLAYER_IDS.includes(player as PlayerId)) throw new Error('Choose an athlete in our later defence.')
          const anchors = (r.laterDefend ??= {}).anchors ??= {}
          anchors[player as PlayerId] = p
          return
        }
        if (player === 'target') r.setterTarget = p
        else {
          if (!PLAYER_IDS.includes(player as PlayerId)) throw new Error('Unknown athlete.')
          const anchors = r.anchors ??= {}, stage = anchors[get().stage] ??= {}
          stage[player as PlayerId] = p
        }
      }),
      setAction: (key, player, action) => update(d => {
        if (!get().event || !PLAYER_IDS.includes(player)) throw new Error('Choose an athlete and moment first.')
        d.coachingVersion = 1; eventPatch(d, key, { actions: { [player]: action } })
      }),
      bend: (key, player, points) => update(d => {
        if (!PLAYER_IDS.includes(player as PlayerId)) throw new Error('Choose an athlete for a route.')
        if (get().event) { eventPatch(d, key, { routes: { [player]: points.map(p => ({ x: p.x, z: p.z })) } }); return }
        const r = rotation(d, key)
        if (get().laterDefend) {
          if (key.split('/')[1] !== 'us') throw new Error('Later defence requires our serve.')
          const routes = (r.laterDefend ??= {}).routes ??= {}
          routes[player as PlayerId] = points.map(p => ({ x: p.x, z: p.z }))
          return
        }
        const routes = r.routes ??= {}, stage = routes[get().stage] ??= {}
        stage[player as PlayerId] = points.map(p => ({ x: p.x, z: p.z }))
      }),
      bendAt: (key, player, id, points) => update(d => {
        if (!get().event || !PLAYER_IDS.includes(player as PlayerId)) throw new Error('Choose an athlete and moment first.')
        d.coachingVersion = 1
        eventPatch(d, key, { routes: { [player]: points.map(p => ({ x: p.x, z: p.z })) }, preservePath: { [player]: true } }, id)
      }),
      prepareHitters: key => update(d => { rotation(d, key).readyOptions = true }),
      setCoverage: (key, player, zone) => update(d => {
        if (!PLAYER_IDS.includes(player)) throw new Error('Choose an athlete for coverage.')
        if (get().event) { eventPatch(d, key, { coverage: { [player]: { ...zone } } }); return }
        const r = rotation(d, key)
        if (get().laterDefend) {
          if (key.split('/')[1] !== 'us' || get().stage !== 'Defend') throw new Error('Later coverage requires our serve and Defend.')
          ;((r.laterDefend ??= {}).coverage ??= {})[player] = { ...zone }
        } else ((r.coverage ??= {})[get().stage] ??= {})[player] = { ...zone }
      }),
      resetCoverage: (key, player) => update(d => {
        const r = rotation(d, key, false); if (!r) return
        if (get().event) {
          const id = get().event!.id, patch = r.eventOverrides?.[id]
          if (!patch?.coverage?.[player]) return
          delete patch.coverage[player]
          if (!Object.keys(patch.coverage).length) delete patch.coverage
          if (!Object.keys(patch).length) delete r.eventOverrides![id]
          if (!Object.keys(r.eventOverrides!).length) delete r.eventOverrides
          return
        }
        const map = get().laterDefend ? r.laterDefend?.coverage : r.coverage?.[get().stage]
        if (!map || !Object.hasOwn(map, player)) return
        delete map[player]
        if (!Object.keys(map).length) {
          if (get().laterDefend) delete r.laterDefend?.coverage
          else delete r.coverage?.[get().stage]
        }
        if (r.coverage && !Object.keys(r.coverage).length) delete r.coverage
        if (r.laterDefend && !Object.keys(r.laterDefend).length) delete r.laterDefend
      }),
      resetStage: key => update(d => {
        const r = rotation(d, key, false); if (!r) return
        if (get().laterDefend) { delete r.laterDefend; return }
        delete r.anchors?.[get().stage]; delete r.routes?.[get().stage]; delete r.coverage?.[get().stage]
        if (get().stage === 'Set') { delete r.setterTarget; delete r.readyOptions }
      }),
      resetRotation: key => update(d => { delete d.overrides[key] }),
      resetCase: key => update(d => { if (!isCaseKey(key)) throw new Error('Invalid case scope.'); delete d.caseOverrides?.[key] }),
      undo: () => { const s = get(), working = s.past.at(-1); if (!working || !s.working || s.gesture) return
        set({ working, past: s.past.slice(0, -1), future: [s.working, ...s.future].slice(0, 50) }); autosave() },
      redo: () => { const s = get(), working = s.future[0]; if (!working || !s.working || s.gesture) return
        set({ working, past: [...s.past, s.working].slice(-50), future: s.future.slice(1) }); autosave() },
    }
  })
}
function localStorageOrUndefined() { try { return window.localStorage } catch { return undefined } }
export const useStrategies = createStrategyStore(localStorageOrUndefined())
