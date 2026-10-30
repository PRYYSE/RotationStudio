import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { positionOf, sampleTrack } from '../lib/rotationModel'
import { layoutLabels } from './labelLayout'

/** The semantic tags live in a clipped DOM sibling of Canvas. No Drei z-index
 * can lift them over a sheet. Update only when projected pixels change. */
export function RotationLabels({ host }: { host: RefObject<HTMLDivElement | null> }) {
  const previous = useRef(''), last = useRef(0)
  useFrame(({ camera, size, clock }) => {
    if (!host.current || clock.elapsedTime - last.current < .08) return
    last.current = clock.elapsedTime
    const s = useRotations.getState(), bundle = activeBundle(s), scenario = activeScenario(s)
    if (!bundle || !scenario) return
    const anchors = bundle.team.players.map(p => {
      const point = sampleTrack(scenario.tracks[p.id], s.time)
      const screen = new Vector3(point.x, .12, point.z).project(camera)
      return { id: p.id, x: Math.round((screen.x + 1) * size.width / 2), y: Math.round((1 - screen.y) * size.height / 2),
        width: p.name.length * 7 + 48, priority: s.selected === p.id ? 0 : scenario.firstContact.player === p.id ? 1 : scenario.secondContact.player === p.id ? 2 : 3 }
    })
    const desktop = window.matchMedia('(min-width: 900px)').matches
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
      element.textContent = `${tag.compact ? p.name[0] : p.name} · P${positionOf(bundle.team, s.rotation, p.id)}`
      line.setAttribute('x1', String(anchor.x)); line.setAttribute('y1', String(anchor.y))
      line.setAttribute('x2', String(tag.x + tag.width / 2)); line.setAttribute('y2', String(tag.y + tag.height / 2))
    }
  })
  return null
}
