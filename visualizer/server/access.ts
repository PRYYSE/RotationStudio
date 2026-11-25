export type AccessConfig = {
  ACCESS_ISSUER?: string
  ACCESS_AUDIENCE?: string
  ACCESS_OWNER_EMAIL?: string
}
const decode = (value: string) => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0))
const parse = (value: string) => JSON.parse(new TextDecoder().decode(decode(value)))

export async function accessOwner(request: Request, config: AccessConfig, fetchKeys: typeof fetch = fetch): Promise<string | null> {
  const issuer = config.ACCESS_ISSUER, audience = config.ACCESS_AUDIENCE, owner = config.ACCESS_OWNER_EMAIL
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!issuer || !/^https:\/\/[a-z0-9][a-z0-9-]*\.cloudflareaccess\.com$/.test(issuer) ||
    !audience || !owner || !jwt || jwt.length > 8192) return null
  try {
    const fields = jwt.split('.')
    if (fields.length !== 3 || fields.some(s => !/^[A-Za-z0-9_-]+$/.test(s))) return null
    const [encodedHeader, encodedClaims, signature] = fields
    const header = parse(encodedHeader), claims = parse(encodedClaims)
    const now = Math.floor(Date.now() / 1000)
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || header.kid.length === 0 || header.kid.length > 128 ||
      claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(audience) ||
      typeof claims.email !== 'string' || claims.email.toLowerCase() !== owner.toLowerCase() ||
      typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128 ||
      !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
      (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > now))) return null
    const result = await fetchKeys(issuer + '/cdn-cgi/access/certs', { redirect: 'error' })
    if (!result.ok) return null
    const data = await result.json() as { keys?: (JsonWebKey & { kid?: string })[] }
    const jwk = data.keys?.find(k => k.kid === header.kid && k.kty === 'RSA' && (!k.alg || k.alg === 'RS256'))
    if (!jwk) return null
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(signature), new TextEncoder().encode(encodedHeader + '.' + encodedClaims))
      ? claims.sub : null
  } catch {
    return null
  }
}
