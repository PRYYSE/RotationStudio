import { emptyLibrary, newId, validateLibrary } from '../domain/authoring'
import { MAX_LIBRARY_BYTES, encodeLibrary, parseJSON, serializeLibrary, type Library } from '../domain/contracts'

const localKey = 'rotation-studio-authoring-v1'
const cloudRecovery = 'rotation-studio-authoring-cloud-recovery-v1'

export function readLocal() {
  const raw = localStorage.getItem(localKey)
  return { raw, library: raw ? validateLibrary(parseJSON(raw, MAX_LIBRARY_BYTES)) : emptyLibrary() }
}

export async function saveLocal(library: Library, expected: string | null) {
  const raw = serializeLibrary(validateLibrary(library))
  const write = () => {
    if (localStorage.getItem(localKey) !== expected) throw new Error('Another tab saved first. Export your library to keep these edits before reloading.')
    localStorage.setItem(localKey, raw)
    return raw
  }
  return navigator.locks ? navigator.locks.request(localKey, write) : write()
}

export type CloudPending = {
  requestId: string; expectedRevision: number; document: Library; planId?: string; savedAt: number; durable: boolean
}
export function stageCloudSave(document: Library, expectedRevision: number, planId?: string): CloudPending {
  const payload = { requestId: newId(), expectedRevision, document, planId, savedAt: Date.now(), durable: true }
  try { localStorage.setItem(cloudRecovery + ':' + payload.requestId, JSON.stringify({ ...payload, document: encodeLibrary(document) })) }
  catch { payload.durable = false }
  return payload
}
export function getCloudRecoveries(): CloudPending[] {
  const recoveries = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(cloudRecovery + ':')) continue
      const raw = localStorage.getItem(key)
      if (!raw || raw.length > MAX_LIBRARY_BYTES + 1024) continue
      try {
        const value = parseJSON(raw, MAX_LIBRARY_BYTES + 1024) as CloudPending
        if (value?.requestId === key.slice(cloudRecovery.length + 1) && Number.isSafeInteger(value.expectedRevision) &&
          value.expectedRevision >= 0 && Number.isFinite(value.savedAt)) {
          recoveries.push({ ...value, document: validateLibrary(value.document), durable: true })
        }
      } catch { /* leave invalid data available for browser-level recovery */ }
    }
  } catch { /* storage may be unavailable */ }
  return recoveries.sort((a, b) => b.savedAt - a.savedAt)
}
export function clearCloudRecovery(requestId: string) {
  try { localStorage.removeItem(cloudRecovery + ':' + requestId) } catch { /* backup remains on the device */ }
}
export async function privateSession() {
  try {
    const r = await fetch('/api/v1/session', { cache: 'no-store', redirect: 'error' })
    return r.ok && (await r.json()).privateSave === true
  } catch { return false }
}
export async function readCloud() {
  const r = await fetch('/api/v1/library', { cache: 'no-store', redirect: 'error' })
  if (!r.ok) throw new Error('Owner sign-in or private storage is unavailable.')
  const value = await r.json()
  if (!Number.isSafeInteger(value.revision) || value.revision < 0) throw new Error('Unable to verify the server revision.')
  return { revision: value.revision as number, library: validateLibrary(value.document) }
}
export async function saveCloud(payload: CloudPending) {
  const r = await fetch('/api/v1/library', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: payload.requestId, expectedRevision: payload.expectedRevision, document: encodeLibrary(payload.document) }), redirect: 'error' })
  if (r.status === 409) throw new Error('Cloud revision conflict. Your edits are still here. Keep this draft and open the latest version to recover it as a copy.')
  if (!r.ok) throw new Error('Private save failed. Your edits are still here. Retry or export a backup.')
  const saved = await r.json()
  if (!Number.isSafeInteger(saved.revision) || saved.revision !== payload.expectedRevision + 1) throw new Error('Unable to verify the cloud save.')
  return saved.revision as number
}

export function download(name: string, content: unknown, raw = false) {
  const blob = new Blob([raw ? String(content) : JSON.stringify(content)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = name; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
