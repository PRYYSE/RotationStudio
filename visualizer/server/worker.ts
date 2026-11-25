import { z } from 'zod'
import { applyProposal, emptyLibrary, previewProposal, sha256, stableJson, undo, validateAppend, validateLibrary } from '../src/domain/authoring.ts'
import { id, MAX_LIBRARY_BYTES, MAX_PROPOSAL_BYTES, proposal, type Library } from '../src/domain/contracts.ts'
import { accessOwner, type AccessConfig } from './access.ts'
import { insertRevision, latest, priorRequest, type Database } from './library-store.ts'

type Env = AccessConfig & { DB?: Database; ASSETS?: { fetch(request: Request): Promise<Response> } }
const noCache = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: noCache })
const error = (message: string, status: number) => json({ error: message }, status)
const precondition = z.int().min(0).max(100_000)
const save = z.strictObject({ expectedRevision: precondition, requestId: id, document: z.unknown() })
const transaction = z.discriminatedUnion('action', [
  z.strictObject({ action: z.enum(['preview', 'apply']), expectedRevision: precondition, proposal }),
  z.strictObject({ action: z.literal('undo'), expectedRevision: precondition, planId: id, planRevision: precondition, operationId: id }),
])

async function boundedBody(request: Request, max: number) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json' || !request.body) {
    throw new Error('Expected a JSON request.')
  }
  const origin = request.headers.get('Origin')
  if (origin && origin !== new URL(request.url).origin) throw new Error('Request origin must match this app.')
  const reader = request.body.getReader(), decode = new TextDecoder('utf-8', { fatal: true })
  let size = 0, text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > max) { await reader.cancel(); throw new Error('Request exceeds the size limit.') }
    text += decode.decode(value, { stream: true })
  }
  return JSON.parse(text + decode.decode()) as unknown
}

export function createWorker(fetchKeys: typeof fetch = fetch) {
  return {
    async fetch(request: Request, env: Env) {
      const owner = await accessOwner(request, env, fetchKeys)
      if (!owner) return error('Verified owner sign-in required.', 401)
      const path = new URL(request.url).pathname
      if (!path.startsWith('/api/')) {
        if (!env.ASSETS) return error('Asset not available.', 404)
        const asset = await env.ASSETS.fetch(request)
        const headers = new Headers(asset.headers)
        headers.set('Cache-Control', 'private, no-store')
        return new Response(asset.body, { status: asset.status, headers })
      }
      if (path === '/api/v1/session' && request.method === 'GET') return json({ privateSave: !!env.DB })
      const db = env.DB
      if (!db) return error('Private storage is unavailable.', 503)
      if (!(path === '/api/v1/library' && ['GET', 'PUT'].includes(request.method)) &&
        !(path === '/api/v1/transaction' && request.method === 'POST')) return error('Unknown private API route.', 404)
      try {
        if (request.method === 'GET') {
          const row = await latest(db, owner)
          return json({ revision: row?.revision ?? 0, document: row ? JSON.parse(row.document) : emptyLibrary() })
        }
        const isSave = path === '/api/v1/library'
        let body: z.infer<typeof save> | z.infer<typeof transaction>
        try {
          const input = await boundedBody(request, isSave ? MAX_LIBRARY_BYTES + 512 : MAX_PROPOSAL_BYTES)
          body = isSave ? save.parse(input) : transaction.parse(input)
        } catch {
          return error('Invalid, oversized or cross-origin request.', 400)
        }
        const requestId = 'requestId' in body ? body.requestId : 'proposal' in body ? body.proposal.operationId : body.operationId
        const isPreview = 'action' in body && body.action === 'preview'
        const fingerprint = await sha256(stableJson(body))
        const repeat = async () => {
          const saved = await priorRequest(db, owner, requestId)
          return saved && (saved.fingerprint === fingerprint ? json({ revision: saved.revision, duplicate: true }) :
            error('Request ID already belongs to another save.', 409))
        }
        if (!isPreview) {
          const repeated = await repeat()
          if (repeated) return repeated
        }
        const row = await latest(db, owner)
        const revision = row?.revision ?? 0
        if (body.expectedRevision !== revision) {
          if (!isPreview) {
            const repeated = await repeat()
            if (repeated) return repeated
          }
          return json({ error: 'A newer cloud save exists.', revision }, 409)
        }
        const before = row ? validateLibrary(JSON.parse(row.document)) : emptyLibrary()
        let next: Library
        try {
          if ('document' in body) {
            next = validateLibrary(body.document)
            validateAppend(before, next)
          } else if (body.action === 'undo' && 'planId' in body) {
            next = await undo(before, body.planId, body.planRevision, body.operationId)
          } else if ('proposal' in body) {
            if (isPreview) return json(previewProposal(before, body.proposal))
            next = await applyProposal(before, body.proposal)
          } else return error('Unknown action.', 400)
        } catch (e) { return error((e as Error).message.slice(0, 400), 422) }
        if (await insertRevision(db, owner, revision, requestId, fingerprint, JSON.stringify(next))) return json({ revision: revision + 1 }, 201)
        return await repeat() ?? error('Another save completed first. Your local edit is unchanged.', 409)
      } catch {
        return error('Private storage is unavailable. Keep your local copy and retry.', 503)
      }
    },
  }
}
export default createWorker()
