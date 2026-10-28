import { create } from 'zustand'
import type { Bundle, RotationView, ServeOwner, Spot, OpponentAttack, FirstTouch } from '../lib/rotationTypes.ts'
import { phaseAt, readRotationLink, selectScenario } from '../lib/rotationModel.ts'
import { validateBundle } from '../lib/rotationValidation.ts'

const link = readRotationLink(window.location.search)
type State = {
  published: Bundle | null; draft: Bundle | null; error: string; loading: boolean
  rotation: number; serve: ServeOwner; time: number; playing: boolean; rate: number
  opponentAttack: OpponentAttack; firstTouch: FirstTouch; receiveAreas: boolean
  view: RotationView; labels: boolean; trails: boolean; editor: boolean; selected: string; editTime: number
  setBundle: (bundle: Bundle) => void
  choose: (rotation: number, serve: ServeOwner) => void
  chooseTactics: (opponentAttack: OpponentAttack, firstTouch: FirstTouch) => void
  seek: (time: number) => void; toggle: () => void; tick: (dt: number) => void
  edit: (spot: Spot) => void; importDraft: (bundle: Bundle) => void; resetDraft: () => void
}
export const activeBundle = (s: State) => s.draft ?? s.published
export const activeScenario = (s: State) => {
  const base = activeBundle(s)?.plans.scenarios.find((p) => p.rotation === s.rotation && p.serve === s.serve)
  return base && selectScenario(base, s.opponentAttack, s.firstTouch)
}
export const useRotations = create<State>((set, get) => ({
  published: null, draft: null, error: '', loading: true,
  ...link, playing: false, rate: 1, view: 'orbit', labels: true, trails: false, receiveAreas: true,
  editor: false, selected: 'harry', editTime: 0,
  setBundle: (published) => {
    const scenario = activeScenario({ ...get(), published })!
    set({ published, loading: false, error: '', time: Math.min(get().time, scenario.duration) })
  },
  choose: (rotation, serve) => set({ rotation, serve, time: 0, playing: false, editTime: 0, error: '' }),
  chooseTactics: (opponentAttack, firstTouch) => {
    const s = get(), before = activeScenario(s)
    const after = activeScenario({ ...s, opponentAttack, firstTouch })
    let time = Math.min(s.time, after?.duration ?? 0)
    if (before && after) {
      const phase = phaseAt(before, s.time)
      const next = after.phases.find((p) => p.label === phase.label)
      const end = next && (after.phases[after.phases.indexOf(next) + 1]?.time ?? after.duration)
      if (next && end !== undefined && next.time !== phase.time) time = Math.min(next.time + s.time - phase.time, end)
      if (s.editor) {
        const times = Object.values(after.tracks).flatMap((track) => track.map((k) => k.time))
        time = times.reduce((best, t) => Math.abs(t - time) < Math.abs(best - time) ? t : best, times[0])
      }
    }
    set({ opponentAttack, firstTouch, time, editTime: time, playing: false, error: '' })
  },
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
    const scenario = activeScenario({ ...s, draft })!
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
