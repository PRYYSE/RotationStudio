import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { createFixture } from './fixture-support.mjs'

const port = Number(process.env.ROTATION_FIXTURE_PORT || 31460)
const base = process.env.ROTATION_FIXTURE_BASE || '/RotationStudio/'
const origin = 'http://localhost:' + port
const dir = fileURLToPath(new URL('../dist/', import.meta.url))
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const f = await createFixture({
  async fetch(request) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith(base)) return new Response('Unknown path', { status: 404 })
    const file = resolve(dir, decodeURIComponent(url.pathname.slice(base.length)) || 'index.html')
    if (!file.startsWith(resolve(dir) + sep)) return new Response('Unknown file', { status: 404 })
    try { return new Response(await readFile(file), { headers: { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' } }) }
    catch { return new Response('Unknown file', { status: 404 }) }
  },
})
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin)
    if (req.method === 'POST' && url.pathname === '/__fixture/sign-in' && (!req.headers.origin || req.headers.origin === origin)) {
      res.writeHead(204, { 'Set-Cookie': 'rotation_fixture=owner; Path=/; HttpOnly; SameSite=Strict', 'Cache-Control': 'no-store' })
      res.end(); return
    }
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(key, value)
    headers.delete('Cf-Access-Jwt-Assertion')
    if (headers.get('Cookie')?.split(';').some(s => s.trim() === 'rotation_fixture=owner')) headers.set('Cf-Access-Jwt-Assertion', f.ownerToken)
    const request = new Request(url, { method: req.method, headers,
      ...(!['GET', 'HEAD'].includes(req.method) ? { body: Readable.toWeb(req), duplex: 'half' } : {}) })
    const result = await f.handle(request)
    res.writeHead(result.status, Object.fromEntries(result.headers))
    if (result.body) Readable.fromWeb(result.body).pipe(res)
    else res.end()
  } catch {
    res.writeHead(500); res.end('Fixture request failed')
  }
}).listen(port, '127.0.0.1', () => console.log('Synthetic private save fixture on port ' + port))
