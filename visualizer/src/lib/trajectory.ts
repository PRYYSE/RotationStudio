// Quadratic Bezier with a specified midpoint apex, shared with Set arcs.
export function arcControl(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }, height: number) {
  return { x: (from.x + to.x) / 2, y: 2 * Math.max(height, from.y, to.y) - (from.y + to.y) / 2, z: (from.z + to.z) / 2 }
}
