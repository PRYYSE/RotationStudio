import { create } from 'zustand'
import type { Bundle, RotationView, ServeOwner, Spot, OpponentAttack, FirstTouch, Scenario } from '../lib/rotationTypes.ts'
import { phaseAt, readRotationLink, selectScenario } from '../lib/rotationModel.ts'
import { containsTeachingExamples, validateBundle } from '../lib/rotationValidation.ts'
import { receiveExample, type FirstBallExample, type ReceiveExampleResult } from '../lib/receiveExample.ts'

const link = readRotationLink(window.location.search)
// The clock visits actual contacts/keyframes even when a delayed frame spans
// several boundaries. No synthetic player or ball positions are authored here.
export const timelineTimes = (s: Scenario) => [...new Set([0, s.duration, ...s.phases.map(p => p.time), ...s.ball.flatMap(b => [b.start, b.end]), ...Object.values(s.tracks).flatMap(t => t.map(k => k.time))])].sort((a, b) => a - b)
type State = {
  strategyMode: boolean; strategyEdit: ((spot: Spot) => void) | null
  example: FirstBallExample | null; exampleResult: ReceiveExampleResult | null; exampleScenario: Scenario | null; exampleNotice: string
  chooseExample: (example: FirstBallExample | null) => void; setEditor: (enabled: boolean) => void
  published: Bundle | null; draft: Bundle | null; error: string; loading: boolean
  rotation: number; serve: ServeOwner; time: number; playing: boolean; rate: number
  transitionTarget: number | null; reducedMotion: boolean
  ballFlight: boolean; setterTargetVisible: boolean; legalHints: boolean; v3Ghost: boolean
  navigate: (time: number, instant?: boolean) => void; pause: () => void
  opponentAttack: OpponentAttack; firstTouch: FirstTouch; receiveAreas: boolean
  view: RotationView; labels: boolean; trails: boolean; editor: boolean; selected: string; editTime: number
  setBundle: (bundle: Bundle) => void
  choose: (rotation: number, serve: ServeOwner) => void
  chooseTactics: (opponentAttack: OpponentAttack, firstTouch: FirstTouch) => void
  seek: (time: number) => void; toggle: () => void; tick: (dt: number) => void
  edit: (spot: Spot) => void; importDraft: (bundle: Bundle) => void; resetDraft: () => void
}
export const activeBundle = (s: State) => s.draft ?? s.published
export const authoredScenario = (s: State) => {
  const base = activeBundle(s)?.plans.scenarios.find((p) => p.rotation === s.rotation && p.serve === s.serve)
  return base && selectScenario(base, s.opponentAttack, s.firstTouch)
}
export const activeScenario = (s: State) => (!s.editor && s.example && s.exampleScenario) || authoredScenario(s)
function examplePatch(s: State, example: FirstBallExample | null, keepPrevious = false) {
  const bundle = activeBundle(s), authored = authoredScenario(s)
  let result = example && bundle && authored ? receiveExample(bundle.team, authored, example) : null
  if (result?.ok && bundle) {
    const derived = result.scenario
    // Check the derived variant through the same full validator, including
    // when the active local draft has invalid unsaved coordinate edits.
    const scenarios = bundle.plans.scenarios.map((base) => {
      if (base === authored) return { ...derived, alternates: base.alternates }
      return { ...base, ...(base.alternates ? { alternates: Object.fromEntries(Object.entries(base.alternates).map(([key, variant]) => [key, variant === authored ? derived : variant])) as Scenario['alternates'] } : {}) }
    })
    const errors = validateBundle({ ...bundle, plans: { ...bundle.plans, scenarios } })
    if (errors.length) result = { ok: false, message: `No feasible first touch at this sample. The continuation fails structural validation: ${errors[0]}` }
  }
  return { example, exampleResult: result, exampleNotice: '',
    exampleScenario: result?.ok ? result.scenario : example && keepPrevious ? s.exampleScenario : null }
}

export const useRotations = create<State>((set, get) => ({
  strategyMode: false, strategyEdit: null,
  example: null, exampleResult: null, exampleScenario: null, exampleNotice: '',
  published: null, draft: null, error: '', loading: true,
  ...link, playing: false, transitionTarget: null, reducedMotion: false, rate: 1, view: 'orbit', labels: true, trails: false, receiveAreas: true,
  ballFlight: false, setterTargetVisible: true, legalHints: false, v3Ghost: false,
  editor: false, selected: 'harry', editTime: 0,
  setBundle: (published) => {
    const next = { ...get(), published }, patch = examplePatch(next, next.example)
    const scenario = activeScenario({ ...next, ...patch })!
    set({ published, ...patch, loading: false, error: '', time: patch.exampleResult?.ok === false ? scenario.firstContact.time : Math.min(get().time, scenario.duration) })
  },
  chooseExample: (example) => {
    const s = get()
    if (s.editor) { set({ exampleNotice: 'First-ball examples are disabled in Coach draft.' }); return }
    const patch = examplePatch(s, example, true), scenario = activeScenario({ ...s, ...patch })
    set({ ...patch, playing: false, transitionTarget: null, time: scenario?.firstContact.time ?? 0 })
  },
  setEditor: (editor) => {
    const s = get(), hadExample = !!s.example
    const time = Math.min(s.time, authoredScenario(s)?.duration ?? 0)
    set({ editor, example: null, exampleResult: null, exampleScenario: null, time, editTime: time, playing: false, transitionTarget: null,
      view: editor ? 'top' : s.view,
      exampleNotice: editor && hadExample ? 'First-ball example cleared. Coach draft edits and exports use authored plans only.' : '' })
  },
  choose: (rotation, serve) => {
    const s = { ...get(), rotation, serve }, patch = examplePatch(s, s.example)
    set({ rotation, serve, ...patch, time: s.example ? authoredScenario(s)?.firstContact.time ?? 0 : 0, playing: false, transitionTarget: null, editTime: 0, error: '' })
  },
  chooseTactics: (opponentAttack, firstTouch) => {
    const s = get(), before = activeScenario(s)
    const next = { ...s, opponentAttack, firstTouch }, patch = examplePatch(next, s.example)
    const after = activeScenario({ ...next, ...patch })
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
    if (s.example) time = after?.firstContact.time ?? 0
    set({ opponentAttack, firstTouch, ...patch, time, editTime: time, playing: false, transitionTarget: null, error: '' })
  },
  seek: (requested) => {
    const s = get(), scenario = activeScenario(s)
    let time = Math.max(0, Math.min(requested, scenario?.duration ?? 0))
    if (!Number.isFinite(time)) time = 0
    if (s.editor && scenario) {
      const times = Object.values(scenario.tracks).flatMap((track) => track.map((k) => k.time))
      time = times.reduce((best, t) => Math.abs(t - time) < Math.abs(best - time) ? t : best, times[0])
    }
    set({ time, playing: false, transitionTarget: null, ...(s.editor ? { editTime: time } : {}) })
  },
  navigate: (requested, instant = false) => {
    const s = get(), scenario = activeScenario(s)
    if (!scenario || !Number.isFinite(requested) || s.exampleResult?.ok === false || (s.editor && !s.strategyMode)) return
    const time = Math.max(0, Math.min(requested, scenario.duration))
    if (instant || s.reducedMotion || time === s.time) {
      set({ time, editTime: time, playing: false, transitionTarget: null }); return
    }
    set({ transitionTarget: time, playing: true })
  },
  pause: () => {
    const s = get(), scenario = activeScenario(s)
    const time = s.editor && scenario ? timelineTimes(scenario).reduce((best, t) => Math.abs(t - s.time) < Math.abs(best - s.time) ? t : best, 0) : s.time
    set({ time, editTime: time, playing: false, transitionTarget: null })
  },
  toggle: () => { const s = get(); if (s.editor || s.exampleResult?.ok === false) return; const duration = activeScenario(s)?.duration ?? 0
    set({ playing: !s.playing, transitionTarget: null, time: s.time >= duration ? 0 : s.time }) },
  tick: (dt) => { const s = get(); if (!s.playing || s.exampleResult?.ok === false) return
    const scenario = activeScenario(s), target = s.transitionTarget ?? scenario?.duration ?? 0
    const direction = target >= s.time ? 1 : -1
    let time = s.time + direction * Math.max(0, Number.isFinite(dt) ? dt : 0) * s.rate
    if (s.transitionTarget !== null && scenario) {
      const times = timelineTimes(scenario)
      const boundary = direction > 0 ? times.find(t => t > s.time && t < target) : times.reverse().find(t => t < s.time && t > target)
      if (boundary !== undefined) time = direction > 0 ? Math.min(time, boundary) : Math.max(time, boundary)
    }
    time = direction > 0 ? Math.min(target, time) : Math.max(target, time)
    const playing = time !== target
    set({ time, playing, ...(!playing ? { transitionTarget: null, editTime: time } : {}) })
  },
  edit: (spot) => {
    const s = get(), current = activeBundle(s)
    if (s.playing) get().pause()
    if (s.editor && s.strategyMode) { s.strategyEdit?.(spot); return }
    if (!s.editor || s.example || !current || !Number.isFinite(spot.x) || !Number.isFinite(spot.z)) return
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
    if (!errors.length && containsTeachingExamples(draft)) errors.push('Teaching examples cannot be imported as coach plans.')
    if (errors.length) { set({ error: errors.join('\n') }); return }
    set({ draft, example: null, exampleResult: null, exampleScenario: null, playing: false, transitionTarget: null, time: 0, editTime: 0, selected: draft.team.players[0].id, error: '' })
  },
  resetDraft: () => set({ draft: null, example: null, exampleResult: null, exampleScenario: null, time: 0, editTime: 0, playing: false, transitionTarget: null, error: '' }),
}))
