import { useEffect, useMemo, useRef } from 'react'
import { activeScenario, useRotations } from '../state/rotationStore'
import { selectScenario } from '../lib/rotationModel'
import { requireSourceEvent } from '../lib/strategyEvents'
import { useStrategies } from '../state/strategyStore'
import { applyStrategy, laterDefendTime, readStrategyLink, scenarioCaseKey, stageTimes } from '../lib/strategyDraft'
import type { RotationKey } from '../lib/strategyDraft'

export function useStrategyStudio() {
  const s = useRotations(), studio = useStrategies()
  const ownsOverlay = useRef(false)
  const applied = useMemo(() => {
    if (!s.published || !studio.working) return null
    try { return applyStrategy(s.published, studio.working) }
    catch (e) { return { bundle: s.published, warnings: [`Event edits were not applied: ${String(e)}. Draft retained; reset or export for recovery.`] } }
  }, [s.published, studio.working])
  useEffect(() => {
    if (!s.published) return
    try {
      const shared = readStrategyLink(window.location.hash)
      if (shared) useStrategies.getState().previewImport(JSON.stringify(shared), s.published)
    } catch (e) { useStrategies.setState({ error: e instanceof Error ? e.message : 'Invalid shared strategy.' }) }
  }, [s.published])
  useEffect(() => {
    // Overlay ownership is explicit. Advanced V3 imports remain available when
    // no sparse strategy is selected; changing library selection clears them.
    if (!applied && !ownsOverlay.current) return
    useRotations.getState().stopShuffle()
    ownsOverlay.current = !!applied
    useRotations.setState({ draft: applied?.bundle ?? null, example: null, exampleResult: null, exampleScenario: null, playing: false, transitionTarget: null })
  }, [applied])
  useEffect(() => {
    if (!studio.editing) { useRotations.setState({ strategyMode: false, strategyEdit: null }); return }
    const current = useRotations.getState(), scenario = activeScenario(current)
    if (!scenario) return
    const caseKey = scenarioCaseKey(scenario)!
    if (studio.scope && studio.scope !== caseKey) useStrategies.getState().setScope(caseKey)
    const root = current.published?.plans.scenarios.find(v => v.rotation === current.rotation && v.serve === current.serve)
    const source = root && selectScenario(root, current.opponentAttack, current.firstTouch)
    let eventTime: number | undefined
    if (studio.event) {
      try {
        if (!source || `${source.rotation}/${source.serve}` !== `${studio.event.source.rotation}/${studio.event.source.serve}`) throw new Error('Source case changed')
        eventTime = requireSourceEvent(source, studio.event.id).time
        if (source !== studio.event.source) { useStrategies.getState().setEvent(source, studio.event.id, current.published ?? undefined); return }
      } catch { useStrategies.getState().setStage(studio.stage); return }
    }
    const later = studio.laterDefend && studio.stage === 'Defend' ? laterDefendTime(scenario) : undefined
    if (studio.laterDefend && later === undefined) useStrategies.getState().setLaterDefend(null)
    const time = eventTime ?? later ?? stageTimes(scenario)[studio.stage]
    useRotations.setState({ editor: true, strategyMode: true, playing: false, transitionTarget: null, time, editTime: time,
      example: null, exampleResult: null, exampleScenario: null,
      strategyEdit: spot => {
        const r = useRotations.getState(), scenario = activeScenario(r), state = useStrategies.getState()
        const key = `${r.rotation}/${r.serve}` as RotationKey
        if (!scenario) return
        // Navigation never leaves an exact edit aimed at the previous case.
        if (state.scope && state.scope !== scenarioCaseKey(scenario)) state.setScope(scenarioCaseKey(scenario)!)
        if (state.laterDefend && laterDefendTime(scenario) === undefined) state.setLaterDefend(null)
        const player = !state.event && state.stage === 'Set' && r.selected === scenario.secondContact.player ? 'target' : r.selected
        if (!(state.laterDefend && player === 'target')) state.move(key, player, spot)
      } })
  }, [studio.editing, studio.stage, studio.scope, studio.laterDefend, studio.event, applied, s.published, s.rotation, s.serve, s.opponentAttack, s.firstTouch])
  return { studio, warnings: applied?.warnings ?? [] }
}
