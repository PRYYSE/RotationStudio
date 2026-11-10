import { activeBundle, useRotations } from '../state/rotationStore'
import { useCourt } from '../state/courtStore'
import { annotationScope, sourceFingerprint } from './courtMode'
import type { Bundle } from './rotationTypes'
const sources = new WeakMap<Bundle,string>()
export function courtScope() {
  const s=useRotations.getState(),c=useCourt.getState(),bundle=activeBundle(s)
  if(!bundle)return ''
  let source=sources.get(bundle)
  if(!source){source=sourceFingerprint(bundle);sources.set(bundle,source)}
  return annotationScope(c.reviewId ? `review:${c.reviewId}:${c.reviewEntry?.sha256 ?? 'loading'}` : source,s.rotation,s.serve,s.opponentAttack,s.firstTouch)
}
