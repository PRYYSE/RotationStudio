import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { positionOf, sampleTrack, selectScenario } from '../lib/rotationModel'
import { layoutLabels } from './labelLayout'
import { useStrategies } from '../state/strategyStore'
import { resolveStrategyRotation } from '../lib/strategyOverlay'
import { sourceEvents, type SourceEvent } from '../lib/strategyEvents'
import { ACTION_LABELS } from '../lib/athletePlan'
import type { PlayerId, StrategyDraft, StrategyRotation } from '../lib/strategyDraft'
import type { Scenario } from '../lib/rotationTypes'

/** The semantic tags live in a clipped DOM sibling of Canvas. No Drei z-index
 * can lift them over a sheet. Update only when projected pixels change. */
export function RotationLabels({ host }: { host: RefObject<HTMLDivElement | null> }) {
  const previous = useRef(''), last = useRef(0)
  const cache = useRef<{ source: Scenario; working: StrategyDraft; events: SourceEvent[]; changes: StrategyRotation } | null>(null)
  useFrame(({ camera, size, clock }) => {
    if (!host.current || clock.elapsedTime - last.current < .08) return
    last.current = clock.elapsedTime
    const s = useRotations.getState(), bundle = activeBundle(s), scenario = activeScenario(s)
    if (!bundle || !scenario) return
    const desktop = window.matchMedia('(min-width: 900px)').matches
    const working = useStrategies.getState().working
    const root = s.published?.plans.scenarios.find(v => v.rotation === s.rotation && v.serve === s.serve)
    const source = root && selectScenario(root, s.opponentAttack, s.firstTouch)
    if (desktop && source?.tactics && !s.example && working && (cache.current?.source !== source || cache.current?.working !== working)) {
      cache.current = { source, working, events: sourceEvents(source), changes: resolveStrategyRotation(working, source) }
    }
    const plan = desktop && source?.tactics && !s.example && working ? cache.current : null
    const event = plan?.events.filter(e => e.time <= s.time + 1e-7).at(-1)
    const changes = plan?.changes
    const anchors = bundle.team.players.map(p => {
      const point = sampleTrack(scenario.tracks[p.id], s.time)
      const screen = new Vector3(point.x, .12, point.z).project(camera)
      const action = event && changes?.eventOverrides?.[event.id]?.actions?.[p.id as PlayerId]
      const actionLabel = action ? ACTION_LABELS[action] : ''
      return { id: p.id, x: Math.round((screen.x + 1) * size.width / 2), y: Math.round((1 - screen.y) * size.height / 2),
        actionLabel, width: (p.name.length + actionLabel.length) * 7 + (actionLabel ? 70 : 48), priority: s.selected === p.id ? 0 : scenario.firstContact.player === p.id ? 1 : scenario.secondContact.player === p.id ? 2 : 3 }
    })
    const key = JSON.stringify([anchors, size.width, size.height, s.labels, s.selected, s.rotation, desktop])
    if (key === previous.current) return
    previous.current = key
    const target = new Vector3(scenario.setterTarget.x, .06, scenario.setterTarget.z).project(camera)
    const targetX = (target.x + 1) * size.width / 2, targetY = (1 - target.y) * size.height / 2
    const tags = desktop ? anchors.map(a => ({ id: a.id, x: a.x - a.width / 2, y: a.y + 12, width: a.width, height: 24, compact: false }))
      : layoutLabels(anchors, size.width, size.height, [{ x: targetX - 16, y: targetY - 12, width: 32, height: 24 }])
    for (const p of bundle.team.players) {
      const element = host.current.querySelector<HTMLElement>(`[data-player="${p.id}"]`)
      const line = host.current.querySelector<SVGLineElement>(`[data-leader="${p.id}"]`)
      const tag = tags.find(t => t.id === p.id), anchor = anchors.find(a => a.id === p.id)!
      if (!element || !line) continue
      element.hidden = !s.labels || !tag
      line.style.display = desktop || !s.labels || !tag ? 'none' : ''
      if (!tag) continue
      element.style.transform = `translate(${tag.x}px, ${tag.y}px)`
      element.style.width = `${tag.width}px`
      element.classList.toggle('selected', s.selected === p.id)
      element.textContent = `${tag.compact ? p.name[0] : p.name} · P${positionOf(bundle.team, s.rotation, p.id)}${anchor.actionLabel ? ` · ${anchor.actionLabel}` : ''}`
      line.setAttribute('x1', String(anchor.x)); line.setAttribute('y1', String(anchor.y))
      line.setAttribute('x2', String(tag.x + tag.width / 2)); line.setAttribute('y2', String(tag.y + tag.height / 2))
    }
  })
  return null
}
