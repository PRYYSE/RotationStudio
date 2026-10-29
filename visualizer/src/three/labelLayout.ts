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
