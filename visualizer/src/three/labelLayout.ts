type Anchor = { id: string; x: number; y: number; width: number; priority: number }
type Tag = { id: string; x: number; y: number; width: number; height: number; compact: boolean }
type Obstacle = { x: number; y: number; width: number; height: number }

/** Screen pixels only. Never changes the six source tracks. Selected/contact
 * identities are placed first; crowded identities use initials plus P number. */
export function layoutLabels(anchors: Anchor[], width: number, height: number, obstacles: Obstacle[] = []): Tag[] {
  const placed: Tag[] = [], gap = 5, h = 24
  const sorted = [...anchors].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
  for (const a of sorted) {
    let best: Tag | undefined
    for (const compact of [false, true]) {
      const w = compact ? 54 : a.width
      const candidates: { x: number; y: number; score: number }[] = []
      // A stable pixel lattice makes crowded and off-screen anchors safe too.
      for (let y = gap; y <= height - h - gap; y += h + gap) {
        for (let x = gap; x <= width - w - gap; x += 12) {
          const dx = x + w / 2 - a.x, dy = y + h / 2 - a.y
          candidates.push({ x, y, score: dx * dx + dy * dy })
        }
      }
      candidates.sort((a, b) => a.score - b.score || a.y - b.y || a.x - b.x)
      const candidate = candidates.find(c => ![...placed, ...obstacles].some(b => c.x < b.x + b.width + gap && c.x + w + gap > b.x && c.y < b.y + b.height + gap && c.y + h + gap > b.y))
      // Prefer an identity chip close to its feet over a distant full name.
      if (candidate && (compact || candidate.score < 110 * 110)) {
        best = { id: a.id, x: candidate.x, y: candidate.y, width: w, height: h, compact }
        break
      }
    }
    if (best) placed.push(best)
  }
  return placed
}


/** Prefer feet-anchored desktop identity, resolving nearby net congestion.
 * Only local candidate positions are considered during playback. */
export function layoutDesktopLabels(anchors: Anchor[], width: number, height: number, obstacles: Obstacle[] = []): Tag[] {
  const gap = 4, h = 24, placed: Tag[] = []
  const sorted = [...anchors].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
  const offsets = [
    [0, 14], [0, 40], [-35, 14], [35, 14], [-35, 40], [35, 40],
    [0, -32], [-35, -32], [35, -32], [0, 66], [-65, 14], [65, 14],
    [-65, 40], [65, 40], [-65, -32], [65, -32], [0, -60],
    [-95, 14], [95, 14], [-95, 40], [95, 40], [-95, -32], [95, -32],
    [-45, 66], [45, 66], [-45, -60], [45, -60]
  ]
  for (const a of sorted) {
    let candidate: Tag | undefined
    // Full labels when close, compact P labels instead of distant full names.
    for (const [compact, end] of [[false, 9], [true, 17], [false, offsets.length], [true, offsets.length]] as const) {
      const w = compact ? 70 : a.width
      for (const [dx, dy] of offsets.slice(0, end)) {
        const x = Math.round(Math.min(Math.max(a.x - w / 2 + dx, gap), width - w - gap))
        const y = Math.round(a.y + dy)
        if (x < gap || x + w + gap > width || y < gap || y + h + gap > height) continue
        const overlaps = [...placed, ...obstacles].some(b => x < b.x + b.width + gap && x + w + gap > b.x &&
          y < b.y + b.height + gap && y + h + gap > b.y)
        if (!overlaps) { candidate = { id: a.id, x, y, width: w, height: h, compact }; break }
      }
      if (candidate) break
    }
    if (candidate) placed.push(candidate)
  }
  return placed
}
