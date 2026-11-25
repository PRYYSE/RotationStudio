import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { createWorker } from './worker.ts'

const issuer = 'https://rotationstudio-fixture.cloudflareaccess.com'
const email = 'rotation-owner@example.test'
const audience = 'synthetic-local-audience'
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')

export async function createFixture(ASSETS) {
  const { publicKey, privateKey } = await crypto.subtle.generateKey({
    name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256',
  }, true, ['sign', 'verify'])
  const jwk = { ...await crypto.subtle.exportKey('jwk', publicKey), kid: 'rotation-fixture', alg: 'RS256' }
  const token = async (custom = {}) => {
    const data = encode({ alg: 'RS256', kid: jwk.kid }) + '.' + encode({
      iss: issuer, aud: [audience], sub: 'fixture-owner', email, exp: Math.floor(Date.now() / 1000) + 3600, ...custom,
    })
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(data))
    return data + '.' + Buffer.from(signature).toString('base64url')
  }
  const sql = new DatabaseSync(':memory:')
  sql.exec(readFileSync(new URL('./migrations/0001_library.sql', import.meta.url), 'utf8'))
  const DB = { prepare: text => ({ bind: (...args) => ({
    first: async () => sql.prepare(text).get(...args) ?? null,
    run: async () => ({ meta: sql.prepare(text).run(...args) }),
  }) }) }
  const worker = createWorker(async url => url === issuer + '/cdn-cgi/access/certs' ?
    Response.json({ keys: [jwk] }) : new Response(null, { status: 404 }))
  const env = { ACCESS_ISSUER: issuer, ACCESS_AUDIENCE: audience, ACCESS_OWNER_EMAIL: email, DB, ASSETS }
  const ownerToken = await token()
  const handle = request => worker.fetch(request, env)
  const request = (pathname, { method = 'GET', token = ownerToken, body } = {}) => handle(new Request('http://localhost:31460' + pathname, {
    method, headers: { 'Content-Type': 'application/json', 'Cf-Access-Jwt-Assertion': token },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }))
  return { request, handle, token, ownerToken }
}
