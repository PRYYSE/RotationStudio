export type StudioMode = 'rotations' | 'sets'

export function TopBar({ mode, onModeChange }: { mode: StudioMode; onModeChange: (mode: StudioMode) => void }) {
  return <header className="studio-header">
    <span className="studio-brand">Rotation Studio <small className="studio-version" aria-label="version 1.0">v1.0</small></span>
    <nav className="studio-modes glass" aria-label="Studio mode">
      <button aria-pressed={mode === 'rotations'} onClick={() => onModeChange('rotations')}>Rotations</button>
      <button aria-pressed={mode === 'sets'} onClick={() => onModeChange('sets')}>Set arcs</button>
    </nav>
  </header>
}
