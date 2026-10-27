import { create } from 'zustand'
import type { Bundle, RotationView, ServeOwner, Spot } from '../lib/rotationTypes.ts'
import { readRotationLink } from '../lib/rotationModel.ts'
import { validateBundle } from '../lib/rotationValidation.ts'

const link = readRotationLink(window.location.search)
type State = {
  published: Bundle | null; draft: Bundle | null; error: string; loading: boolean
  rotation: number; serve: ServeOwner; time: number; playing: boolean; rate: number
  view: RotationView; labels: boolean; trails: boolean; editor: boolean; selected: string; editTime: number
  setBundle: (bundle: Bundle) => void
  choose: (rotation: number, serve: ServeOwner) => void
  seek: (time: number) => void; toggle: () => void; tick: (dt: number) => void
  edit: (spot: Spot) => void; importDraft: (bundle: Bundle) => void; resetDraft: () => void
}
export const activeBundle = (s: State) => s.draft ?? s.published
export const activeScenario = (s: State) => activeBundle(s)?.plans.scenarios.find((p) => p.rotation === s.rotation && p.serve === s.serve)
export const useRotations = create<State>((set, get) => ({
  published: null, draft: null, error: '', loading: true,
  ...link, playing: false, rate: 1, view: 'orbit', labels: true, trails: false,
  editor: false, selected: 'harry', editTime: 0,
  setBundle: (published) => {
    const scenario = published.plans.scenarios.find((p) => p.rotation === get().rotation && p.serve === get().serve)!
    set({ published, loading: false, error: '', time: Math.min(get().time, scenario.duration) })
  },
  choose: (rotation, serve) => set({ rotation, serve, time: 0, playing: false, editTime: 0, error: '' }),
  seek: (requested) => {
    const s = get(), scenario = activeScenario(s)
    let time = Math.max(0, Math.min(requested, scenario?.duration ?? 0))
    if (!Number.isFinite(time)) time = 0
    if (s.editor && scenario) {
      const times = Object.values(scenario.tracks).flatMap((track) => track.map((k) => k.time))
      time = times.reduce((best, t) => Math.abs(t - time) < Math.abs(best - time) ? t : best, times[0])
    }
    set({ time, playing: false, ...(s.editor ? { editTime: time } : {}) })
  },
  toggle: () => { const s = get(); if (s.editor) return; const duration = activeScenario(s)?.duration ?? 0
    set({ playing: !s.playing, time: s.time >= duration ? 0 : s.time }) },
  tick: (dt) => { const s = get(); if (!s.playing) return
    const duration = activeScenario(s)?.duration ?? 0
    const time = Math.min(duration, s.time + Math.max(0, Number.isFinite(dt) ? dt : 0) * s.rate)
    set({ time, playing: time < duration })
  },
  edit: (spot) => {
    const s = get(), current = activeBundle(s)
    if (!s.editor || !current || !Number.isFinite(spot.x) || !Number.isFinite(spot.z)) return
    const draft = structuredClone(current)
    const scenario = draft.plans.scenarios.find((p) => p.rotation === s.rotation && p.serve === s.serve)!
    // Local changes cannot inherit a published approval; demo edits remain demos.
    if (draft.team.status === 'APPROVED') draft.team.status = draft.plans.status = 'DRAFT'
    const passIndex = scenario.ball.findIndex((b) => b.kind === 'pass')
    const moveContact = (side: 'from' | 'to') => {
      if (passIndex < 0) return
      Object.assign(scenario.ball[passIndex][side], spot)
      // Neighbours stay connected even when the ball holds between flights.
      const neighbour = scenario.ball[passIndex + (side === 'from' ? -1 : 1)]
      if (neighbour) Object.assign(neighbour[side === 'from' ? 'to' : 'from'], spot)
    }
    const moveTarget = () => {
      scenario.setterTarget = { ...spot }
      moveContact('to')
    }
    if (s.selected === 'target') {
      const old = scenario.setterTarget
      moveTarget()
      const frame = scenario.tracks[scenario.secondContact.player].find((k) => k.time === scenario.secondContact.time)
      if (frame && frame.x === old.x && frame.z === old.z) Object.assign(frame, spot)
    } else {
      const frame = scenario.tracks[s.selected]?.find((k) => k.time === s.editTime)
      if (!frame) return
      Object.assign(frame, spot)
      if (s.selected === scenario.firstContact.player && s.editTime === scenario.firstContact.time) {
        moveContact('from')
      }
      if (s.selected === scenario.secondContact.player && s.editTime === scenario.secondContact.time) moveTarget()
    }
    set({ draft, playing: false, error: '' })
  },
  importDraft: (draft) => { const errors = validateBundle(draft)
    if (errors.length) { set({ error: errors.join('\n') }); return }
    set({ draft, playing: false, time: 0, editTime: 0, selected: draft.team.players[0].id, error: '' })
  },
  resetDraft: () => set({ draft: null, time: 0, editTime: 0, playing: false, error: '' }),
}))
