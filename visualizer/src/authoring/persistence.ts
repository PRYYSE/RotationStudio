import { emptyLibrary, newId, validateLibrary } from '../domain/authoring'
import { MAX_LIBRARY_BYTES, parseJSON, type Library } from '../domain/contracts'

const localKey = 'rotation-studio-authoring-v1'
const cloudRecovery = 'rotation-studio-authoring-cloud-recovery-v1'

export function readLocal() {
  const raw = localStorage.getItem(localKey)
  return { raw, library: raw ? validateLibrary(parseJSON(raw, MAX_LIBRARY_BYTES)) : emptyLibrary() }
}

export async function saveLocal(library: Library, expected: string | null) {
  const raw = JSON.stringify(validateLibrary(library))
  const write = () => {
    if (localStorage.getItem(localKey) !== expected) throw new Error('Another tab saved first. Export your library to keep these edits before reloading.')
    localStorage.setItem(localKey, raw)
    return raw
  }
  return navigator.locks ? navigator.locks.request(localKey, write) : write()
}

export type CloudPending = { requestId: string; expectedRevision: number; document: Library }
export function stageCloudSave(document: Library, expectedRevision: number): CloudPending {
  const payload = { requestId: newId(), expectedRevision, document }
  try { localStorage.setItem(cloudRecovery, JSON.stringify(payload)) } catch { /* in-memory retry remains available */ }
  return payload
}
export function getCloudRecovery(): CloudPending | undefined {
  try {
    const raw = localStorage.getItem(cloudRecovery)
    if (raw) {
      const value = JSON.parse(raw) as CloudPending
      if (typeof value.requestId === 'string' && Number.isSafeInteger(value.expectedRevision) && value.expectedRevision >= 0) {
        return { ...value, document: validateLibrary(value.document) }
      }
    }
  } catch { /* invalid local recovery remains untouched */ }
}
export function clearCloudRecovery(requestId: string) {
  try {
    const raw = localStorage.getItem(cloudRecovery)
    if (raw && (JSON.parse(raw) as CloudPending).requestId === requestId) localStorage.removeItem(cloudRecovery)
  } catch { /* recovery remains available if device storage denies changes */ }
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
    body: JSON.stringify(payload), redirect: 'error' })
  if (r.status === 409) throw new Error('Cloud revision conflict. Your edits are still here. Export a backup before opening the latest cloud version.')
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
