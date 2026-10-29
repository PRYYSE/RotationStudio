export const EDITOR_TARGET = [0, 0, 4.5] as const
export const EDITOR_MIN_DISTANCE = 7
export const EDITOR_MAX_DISTANCE = 85
export function editorZoomDistance(current: number, action: 'in' | 'out' | 'fit', fit: number): number {
  return Math.max(EDITOR_MIN_DISTANCE, Math.min(EDITOR_MAX_DISTANCE, action === 'fit' ? fit : current * (action === 'in' ? .8 : 1.25)))
}
