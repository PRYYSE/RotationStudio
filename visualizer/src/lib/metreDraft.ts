// Parse only a completed human decimal. Keystrokes are local text until commit.
export function commitMetres(text: string, min: number, max: number): number | null {
  const draft = text.trim()
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(draft)) return null
  const value = Number(draft)
  return Number.isFinite(value) && value >= min && value <= max ? value : null
}
