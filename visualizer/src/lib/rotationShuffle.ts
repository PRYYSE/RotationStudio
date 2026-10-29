import type { FirstTouch, OpponentAttack, Scenario } from './rotationTypes.ts'

export type ShuffleCase = `${OpponentAttack}/${FirstTouch}`
export const shuffleCase = (s: { opponentAttack: OpponentAttack; firstTouch: FirstTouch }): ShuffleCase => `${s.opponentAttack}/${s.firstTouch}`

/** A seeded permutation of the four real source cases, repeated cyclically.
 * No receiver selection, contact changes, teaching physics or storage here. */
export function shuffleCases(root: Scenario | undefined, seed: number): ShuffleCase[] {
  if (!root) return []
  const sources = [root, ...Object.values(root.alternates ?? {})]
  const keys: ShuffleCase[] = ['left/normal', 'right/normal', 'left/harry', 'right/harry']
  if (keys.some(key => sources.filter(s => s.rotation === root.rotation && s.serve === root.serve && s.tactics && shuffleCase(s.tactics) === key).length !== 1)) return []
  let value = (seed >>> 0) || 0x9e3779b9
  for (let i = keys.length - 1; i > 0; i--) {
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5
    const j = (value >>> 0) % (i + 1)
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
  }
  return keys
}
