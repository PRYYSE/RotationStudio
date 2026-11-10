import type { Bundle, Scenario, ServeOwner, OpponentAttack, FirstTouch, Spot } from './rotationTypes.ts'
import { validateBundle } from './rotationValidation.ts'
import { selectScenario } from './rotationModel.ts'
export type Workspace = 'court' | 'studio'
export const reviewIdFrom = (search:string) => { const p=new URLSearchParams(search); return p.has('review') ? p.get('review') || '!invalid-empty-review' : null }
export function initialWorkspace(ua: string, search: string, saved: string | null, ipad = false): Workspace {
  const ui = new URLSearchParams(search).get('ui')
  if (ui === 'court' || ui === 'studio') return ui
  if (new URLSearchParams(search).has('review')) return 'court'
  if (saved === 'court' || saved === 'studio') return saved
  return /Android|iPhone|iPad|iPod/i.test(ua) || ipad ? 'court' : 'studio'
}
export const groundPan = (target: Spot, delta: Spot): Spot => ({x:Math.max(-12,Math.min(12,target.x+delta.x)),z:Math.max(-15,Math.min(15,target.z+delta.z))})
export const annotationScope = (source: string, rotation: number, serve: string, attack: string, first: string) => JSON.stringify([source, rotation, serve, attack, first])
export type Mark = {id:string; scope:string; time:number; whole:boolean; tool:'pen'|'arrow'|'circle'|'highlight'|'text'; points:Spot[]; text:string; owner:string}
export function validateNotes(value: unknown): Mark[] {
  const v = value as {schemaVersion?:unknown; notes?:Mark[]}
  if (!v || v.schemaVersion !== 1 || !Array.isArray(v.notes) || v.notes.length > 3000) throw new Error('Expected a Court Mode notes export (up to 3000 marks).')
  const ids = new Set<string>()
  for (const n of v.notes) {
    if (!n || typeof n.id !== 'string' || n.id.length > 100 || ids.has(n.id) || typeof n.scope !== 'string' || n.scope.length > 300 ||
      !Number.isFinite(n.time) || n.time < 0 || n.time > 600 || typeof n.whole !== 'boolean' || !['pen','arrow','circle','highlight','text'].includes(n.tool) ||
      !Array.isArray(n.points) || !n.points.length || n.points.length > 5000 || n.points.some(p=>!p || !Number.isFinite(p.x) || !Number.isFinite(p.z) || Math.abs(p.x)>20 || Math.abs(p.z)>20) ||
      typeof n.text !== 'string' || n.text.length > 2000 || typeof n.owner !== 'string' || n.owner.length > 80) throw new Error('Invalid or oversized note. Existing notes were kept.')
    try { const scope = JSON.parse(n.scope); if (!Array.isArray(scope) || scope.length !== 5 || typeof scope[0] !== 'string' || !Number.isInteger(scope[1]) || scope[1]<1 || scope[1]>6 || !['us','they'].includes(scope[2]) || !['left','right'].includes(scope[3]) || !['normal','harry'].includes(scope[4])) throw 0 }
    catch { throw new Error('Invalid note source or rotation scope.') }
    ids.add(n.id)
  }
  return v.notes
}
// Source identity includes all working geometry. A revision cannot inherit old notes.
export function sourceFingerprint(bundle: Bundle) {
  const text = JSON.stringify(bundle)
  let a = 2166136261, b = 5381
  for (let i=0;i<text.length;i++) { a = Math.imul(a ^ text.charCodeAt(i),16777619); b = Math.imul(b,33)^text.charCodeAt(i) }
  return `source-${(a>>>0).toString(16)}-${(b>>>0).toString(16)}-${text.length}`
}
export type ReviewEntry = {rotation:number;version:string;data:string;plan:string;sha256:string}
export function reviewEntry(manifest: unknown, id: string): ReviewEntry {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw new Error('Invalid review ID.')
  const m = manifest as {schemaVersion?:number;reviews?:Record<string,ReviewEntry>}
  const e = m?.schemaVersion === 1 && m.reviews && Object.hasOwn(m.reviews,id) ? m.reviews[id] : null
  if (!e || !Number.isInteger(e.rotation) || e.rotation<1 || e.rotation>6 || typeof e.version !== 'string' || !e.version.length || e.version.length>80 ||
    !new RegExp(`^${id}/[a-zA-Z0-9_-]+\\.json$`).test(e.data) || !new RegExp(`^${id}/[a-zA-Z0-9_-]+\\.md$`).test(e.plan) || !/^[0-9a-f]{64}$/.test(e.sha256)) throw new Error('Review ID is missing or its manifest entry is invalid.')
  return e
}
export function reviewPacket(value: unknown, base: Bundle, id:string, rotation:number, serve:ServeOwner, attack:OpponentAttack, first:FirstTouch): Bundle {
  const p = value as {schemaVersion:number;id:string;rotation:number;version:string;scenarios:Scenario[]}
  if (!p || p.schemaVersion!==1 || p.id!==id || p.rotation!==rotation || !Array.isArray(p.scenarios) || !p.scenarios.length || p.scenarios.length>2 ||
    p.scenarios.some(s=>!s || s.rotation!==rotation || !['us','they'].includes(s.serve) || s.teachingOnly) || new Set(p.scenarios.map(s=>s.serve)).size!==p.scenarios.length) throw new Error('Review packet must contain only its declared rotation and distinct serve cases.')
  const root = p.scenarios.find(s=>s.serve===serve)
  if (!root || (attack==='right' || first==='harry') && !root.alternates) throw new Error('The exact requested serve/variation is not included in this review.')
  const selected = selectScenario(root,attack,first)
  if (selected.tactics && (selected.tactics.opponentAttack!==attack || selected.tactics.firstTouch!==first)) throw new Error('Review variation does not match the link.')
  const bundle:Bundle = {...base,plans:{...base.plans,status:'DRAFT',scenarios:base.plans.scenarios.map(s=>p.scenarios.find(r=>r.rotation===s.rotation && r.serve===s.serve)??s)},team:{...base.team,status:'DRAFT'}}
  const errors = validateBundle(bundle)
  if (errors.length) throw new Error(`Invalid review data: ${errors[0]}`)
  return bundle
}
