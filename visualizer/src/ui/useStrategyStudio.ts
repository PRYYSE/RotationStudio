import { useEffect, useMemo, useRef } from 'react'
import { activeScenario, useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { applyStrategy, laterDefendTime, readStrategyLink, scenarioCaseKey, stageTimes } from '../lib/strategyDraft'
import type { RotationKey } from '../lib/strategyDraft'

export function useStrategyStudio() {
  const s = useRotations(), studio = useStrategies()
  const ownsOverlay = useRef(false)
  const applied = useMemo(() => s.published && studio.working ? applyStrategy(s.published, studio.working) : null, [s.published, studio.working])
  useEffect(() => {
    try {
      const shared = readStrategyLink(window.location.hash)
      if (shared) useStrategies.getState().previewImport(JSON.stringify(shared))
    } catch (e) { useStrategies.setState({ error: e instanceof Error ? e.message : 'Invalid shared strategy.' }) }
  }, [])
  useEffect(() => {
    // Overlay ownership is explicit. Advanced V3 imports remain available when
    // no sparse strategy is selected; changing library selection clears them.
    if (!applied && !ownsOverlay.current) return
    ownsOverlay.current = !!applied
    useRotations.setState({ draft: applied?.bundle ?? null, example: null, exampleResult: null, exampleScenario: null, playing: false })
  }, [applied])
  useEffect(() => {
    if (!studio.editing) { useRotations.setState({ strategyMode: false, strategyEdit: null }); return }
    const current = useRotations.getState(), scenario = activeScenario(current)
    if (!scenario) return
    const caseKey = scenarioCaseKey(scenario)!
    if (studio.scope && studio.scope !== caseKey) useStrategies.getState().setScope(caseKey)
    const later = studio.laterDefend && studio.stage === 'Defend' ? laterDefendTime(scenario) : undefined
    if (studio.laterDefend && later === undefined) useStrategies.getState().setLaterDefend(null)
    const time = later ?? stageTimes(scenario)[studio.stage]
    useRotations.setState({ editor: true, strategyMode: true, view: 'top', playing: false, time, editTime: time,
      example: null, exampleResult: null, exampleScenario: null,
      strategyEdit: spot => {
        const r = useRotations.getState(), scenario = activeScenario(r), state = useStrategies.getState()
        const key = `${r.rotation}/${r.serve}` as RotationKey
        if (!scenario) return
        // Navigation never leaves an exact edit aimed at the previous case.
        if (state.scope && state.scope !== scenarioCaseKey(scenario)) state.setScope(scenarioCaseKey(scenario)!)
        if (state.laterDefend && laterDefendTime(scenario) === undefined) state.setLaterDefend(null)
        const player = state.stage === 'Set' && r.selected === scenario.secondContact.player ? 'target' : r.selected
        if (!(state.laterDefend && player === 'target')) state.move(key, player, spot)
      } })
  }, [studio.editing, studio.stage, studio.scope, studio.laterDefend, applied, s.published, s.rotation, s.serve, s.opponentAttack, s.firstTouch])
  return { studio, warnings: applied?.warnings ?? [] }
}
