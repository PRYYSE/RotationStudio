import { useSyncExternalStore } from 'react'

const query = '(min-width: 900px)'
const subscribe = (listener: () => void) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}
const snapshot = () => window.matchMedia(query).matches
export function useDesktopWorkbench() {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
