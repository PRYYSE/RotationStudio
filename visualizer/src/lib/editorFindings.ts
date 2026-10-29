import type { RotationKey } from './strategyDraft.ts'
import type { GroupedReviewFinding } from './reviewTypes.ts'

// Findings are grouped over all 48 source cases. Bound the editor's evidence
// and counts together, without dropping distinct details within a selected case.
export function scopeEditorFindings(findings: GroupedReviewFinding[], key: RotationKey): GroupedReviewFinding[] {
  return findings.flatMap(f => {
    const affectedCases = f.affectedCases.filter(k => k.startsWith(`${key}/`))
    return affectedCases.length ? [{ ...f, affectedCases, details: f.details.filter(d => affectedCases.includes(d.caseKey)) }] : []
  })
}
