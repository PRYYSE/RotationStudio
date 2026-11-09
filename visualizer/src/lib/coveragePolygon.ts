import type { Spot } from './rotationTypes.ts'

export const MAX_COVERAGE_VERTICES = 12
const EDGE_TOLERANCE = 0.025
const MIN_AREA = 0.005
const EPS = 1e-8
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const cross = (a: Spot, b: Spot, c: Spot) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)
const between = (a: number, b: number, c: number) => c >= Math.min(a, b) - EPS && c <= Math.max(a, b) + EPS
function intersects(a: Spot, b: Spot, c: Spot, d: Spot) {
  const abC = cross(a, b, c), abD = cross(a, b, d)
  const cdA = cross(c, d, a), cdB = cross(c, d, b)
  if (abC * abD < -EPS && cdA * cdB < -EPS) return true
  const on = (u: Spot, v: Spot, p: Spot) => between(u.x, v.x, p.x) && between(u.z, v.z, p.z)
  return (Math.abs(abC) < EPS && on(a, b, c)) || (Math.abs(abD) < EPS && on(a, b, d)) ||
    (Math.abs(cdA) < EPS && on(c, d, a)) || (Math.abs(cdB) < EPS && on(c, d, b))
}

export function polygonArea(vertices: Spot[]): number {
  return Math.abs(vertices.reduce((sum, p, i) => {
    const q = vertices[(i + 1) % vertices.length]
    return sum + p.x * q.z - q.x * p.z
  }, 0)) / 2
}

/** Coach-authored court coordinates. Concave polygons are valid; crossed edges are not. */
export function coveragePolygonError(vertices: unknown): string | null {
  if (!Array.isArray(vertices) || vertices.length < 3 || vertices.length > MAX_COVERAGE_VERTICES) {
    return `A zone needs 3–${MAX_COVERAGE_VERTICES} independent corners.`
  }
  if (vertices.some(p => !p || typeof p !== 'object' || !Number.isFinite(p.x) || !Number.isFinite(p.z) || p.x < -4.5 || p.x > 4.5 || p.z < 0 || p.z > 9 || Object.keys(p).some(k => k !== 'x' && k !== 'z'))) {
    return 'Zone corners must be within the 9 × 9 m court.'
  }
  const points = vertices as Spot[]
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length]
    if (Math.hypot(a.x - b.x, a.z - b.z) < EDGE_TOLERANCE) return 'Move corners at least 2.5 cm apart.'
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue
      if (intersects(a, b, points[j], points[(j + 1) % points.length])) return 'Zone edges cannot cross or touch each other.'
    }
  }
  if (polygonArea(points) < MIN_AREA) return 'The zone needs a non-zero covered area.'
  return null
}

/** Convert an existing ellipse once, without changing the original until saved. */
export function hexagonFromEllipse(center: Spot, radiusX: number, radiusZ: number): Spot[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = i * Math.PI / 3 - Math.PI / 2
    return {
      x: +clamp(center.x + Math.cos(angle) * radiusX, -4.5, 4.5).toFixed(3),
      z: +clamp(center.z + Math.sin(angle) * radiusZ, 0, 9).toFixed(3),
    }
  })
}

/** Insert at the middle of the longest existing edge, without shifting other points. */
export function addPolygonCorner(vertices: Spot[]): Spot[] {
  if (vertices.length >= MAX_COVERAGE_VERTICES) return vertices
  let best = 0, distance = -1
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length]
    const candidate = Math.hypot(a.x - b.x, a.z - b.z)
    if (candidate > distance) { best = i; distance = candidate }
  }
  const a = vertices[best], b = vertices[(best + 1) % vertices.length]
  return [...vertices.slice(0, best + 1), { x: +(0.5 * (a.x + b.x)).toFixed(3), z: +(0.5 * (a.z + b.z)).toFixed(3) }, ...vertices.slice(best + 1)]
}
