import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { positionOf, sampleTrack } from '../lib/rotationModel'
import { layoutDesktopLabels } from './labelLayout'
import { dragPreviewAt } from './dragPreview'

/** Desktop identities remain attached to each athlete's own feet. */
export function RotationLabels({ host }: { host: RefObject<HTMLDivElement | null> }) {
  const previous = useRef('')
  useFrame(({ camera, size }) => {
    if (!host.current) return
    const s = useRotations.getState(), bundle = activeBundle(s), scenario = activeScenario(s)
    if (!bundle || !scenario) return
    const anchors = bundle.team.players.map(p => {
      const point = s.strategyMode ? dragPreviewAt(p.id) ?? sampleTrack(scenario.tracks[p.id], s.time) : sampleTrack(scenario.tracks[p.id], s.time)
      const screen = new Vector3(point.x, .12, point.z).project(camera)
      return { id: p.id, x: (screen.x + 1) * size.width / 2, y: (1 - screen.y) * size.height / 2,
        width: p.name.length * 5.8 + 36, priority: s.selected === p.id ? 0 : 3 }
    })
    const key = JSON.stringify([anchors, size.width, size.height, s.labels, s.selected, s.rotation])
    if (key === previous.current) return
    previous.current = key
    const tags = layoutDesktopLabels(anchors, size.width, size.height)
    for (const p of bundle.team.players) {
      const element = host.current.querySelector<HTMLElement>(`[data-player="${p.id}"]`)
      const line = host.current.querySelector<SVGLineElement>(`[data-leader="${p.id}"]`)
      const tag = tags.find(t => t.id === p.id)
      if (!element || !line) continue
      element.hidden = !s.labels || !tag; line.style.display = 'none'
      if (!tag) continue
      element.style.transform = `translate3d(${tag.x}px, ${tag.y}px, 0)`
      element.style.width = `${tag.width}px`
      element.classList.toggle('selected', s.selected === p.id)
      const text = `${p.name} · P${positionOf(bundle.team, s.rotation, p.id)}`
      if (element.textContent !== text) element.textContent = text
    }
  })
  return null
}
