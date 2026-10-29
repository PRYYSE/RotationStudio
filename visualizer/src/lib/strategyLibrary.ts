import { parseStrategy } from './strategyDraft.ts'
import type { StrategyDraftV2 } from './strategyDraft.ts'

export const LEGACY_STRATEGY_STORAGE_KEY = 'rotation-studio-strategies-v1'
export const STRATEGY_STORAGE_KEY = 'rotation-studio-strategies-v2'
export type StrategyStorage = Pick<globalThis.Storage, 'getItem' | 'setItem'>

function readLibrary(raw: string, version: 1 | 2) {
  if (raw.length > 5_100_000 || new TextEncoder().encode(raw).length > 5_100_000) throw new Error('Library too large')
  const data = JSON.parse(raw)
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(k => !['schemaVersion', 'library', 'activeId'].includes(k)) ||
    data.schemaVersion !== version || !Array.isArray(data.library) || data.library.length > 50 || (data.activeId !== null && typeof data.activeId !== 'string')) throw new Error('Invalid library')
  const library: StrategyDraftV2[] = data.library.map((d: unknown) => {
    if (!d || typeof d !== 'object' || !('schemaVersion' in d) || d.schemaVersion !== version) throw new Error('Invalid library strategy version')
    return parseStrategy(JSON.stringify(d))
  })
  if (new Set(library.map(d => d.id)).size !== library.length) throw new Error('Duplicate strategy IDs')
  return { library, active: data.activeId as string | null }
}

export function loadStrategyLibrary(storage?: StrategyStorage) {
  let library: StrategyDraftV2[] = [], active: string | null = null, error = '', migrating = false
  try {
    const raw = storage?.getItem(STRATEGY_STORAGE_KEY)
    if (raw !== null && raw !== undefined) {
      try { ({ library, active } = readLibrary(raw, 2)) }
      catch {
        // Recovery is read-only. Never replace an unreadable V2, even if V1
        // happens to be intact. The user can export recovered copies.
        error = 'Could not read local V2 strategy library. Saving is paused; recover/export V1 copies if available. Existing browser data has been left untouched.'
        const legacy = storage?.getItem(LEGACY_STRATEGY_STORAGE_KEY)
        if (legacy !== null && legacy !== undefined) ({ library, active } = readLibrary(legacy, 1))
      }
    } else {
      const legacy = storage?.getItem(LEGACY_STRATEGY_STORAGE_KEY)
      if (legacy !== null && legacy !== undefined) { ({ library, active } = readLibrary(legacy, 1)); migrating = true }
    }
  } catch {
    error ||= 'Could not read local strategy library. Saving is paused; export any recovered work. Existing browser data has been left untouched.'
  }
  return { library, active, error, migrating }
}
