import { useState } from 'react'
import { TopBar, type StudioMode } from './ui/TopBar'
import { Rotations } from './ui/Rotations'
import { Scene } from './three/Scene'
import { ViewSwitch } from './ui/ViewSwitch'
import { ControlSheet } from './ui/ControlSheet'
import { Coach } from './ui/Coach'
import { useKeyboardShortcuts } from './ui/useKeyboardShortcuts'

function SetArcs() {
  useKeyboardShortcuts()
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Scene />

      {/* UI overlay layer: container ignores pointers, controls re-enable them.
          One vertical axis: view switch top center, control sheet + play bar
          bottom center. */}
      <div className="pointer-events-none absolute inset-0 p-4">
        {/* below the brand chip on mobile, in line with the top bar on desktop */}
        <div className="pointer-events-auto absolute left-1/2 top-16 -translate-x-1/2 sm:top-4">
          <ViewSwitch />
        </div>

        <div className="absolute inset-x-0 bottom-3 flex justify-center px-2 sm:bottom-5">
          <div className="pointer-events-auto flex w-full justify-center sm:w-auto">
            <ControlSheet />
          </div>
        </div>
      </div>

      <Coach />
    </div>
  )
}

export function App() {
  const [mode, setMode] = useState<StudioMode>(() => {
    const p = new URLSearchParams(window.location.search)
    return p.get('mode') === 'sets' || p.has('s') ? 'sets' : 'rotations'
  })
  return <div className="studio-app">
    {mode === 'rotations' ? <Rotations /> : <SetArcs />}
    <TopBar mode={mode} onModeChange={setMode} />
  </div>
}
