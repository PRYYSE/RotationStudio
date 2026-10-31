import type { Spot } from '../lib/rotationTypes'

// Ephemeral pointer preview; never serialised, never used as authored tactic.
// Updating a React/Zustand strategy on every pointer event would clone and
// validate the entire strategy and rebuild 48 scenarios for each mouse pixel.
const positions = new Map<string, Spot>()
export function showDragPreview(id: string, point: Spot) { positions.set(id, point) }
export function dragPreviewAt(id: string): Spot | undefined { return positions.get(id) }
export function clearDragPreview(id: string) { positions.delete(id) }
