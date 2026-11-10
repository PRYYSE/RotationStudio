import { useCourt } from '../state/courtStore'
import { useRotations } from '../state/rotationStore'
import { useStrategies } from '../state/strategyStore'
import { courtLink } from './useCourtRoute'
export function WorkspaceSwitch() {
  const c=useCourt()
  return <nav className="workspace-switch" aria-label="Application workspace">{(['court','studio'] as const).map(mode=><button key={mode} aria-pressed={c.workspace===mode} onClick={()=>{
    if(c.workspace===mode)return
    if(document.fullscreenElement)void document.exitFullscreen()
    if(mode==='court'){
      const s=useRotations.getState();useStrategies.setState({editing:false});useRotations.setState({editor:false,strategyMode:false,strategyEdit:null,editTime:s.time})
    }
    c.setWorkspace(mode)
    history.pushState(null,'',courtLink())
  }}>{mode==='court'?'Court Mode':'Full Studio'}</button>)}</nav>
}
