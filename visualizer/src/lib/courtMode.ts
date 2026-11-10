import type { Phase } from './rotationTypes.ts'
export type Workspace = 'court' | 'studio'
export function initialWorkspace(search: string, saved: string | null, agent: string, touches: number): Workspace {
  const p = new URLSearchParams(search)
  if (p.has('review')) return 'court'
  if (p.get('workspace') === 'court' || p.get('workspace') === 'studio') return p.get('workspace') as Workspace
  if (p.get('mode') === 'sets' || p.has('s')) return 'studio'
  if (saved === 'court' || saved === 'studio') return saved
  return /Android|iPhone|iPad|iPod/i.test(agent) || (/Macintosh/.test(agent) && touches > 1) ? 'court' : 'studio'
}
export function annotationScope(context: { source: string; strategy: string; rotation: number; serve: string; attack: string; touch: string; event: string }) {
  return JSON.stringify([context.source, context.strategy, context.rotation, context.serve, context.attack, context.touch, context.event])
}
export function chronologicalPhases(phases: Phase[]): Phase[] { return [...phases].sort((a,b) => a.time-b.time) }
export async function fingerprint(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value))
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2,'0')).join('')
}
export function downloadCourtFile(text: string, filename: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], {type}))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
