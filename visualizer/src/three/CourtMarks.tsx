import { Html, Line } from '@react-three/drei'
import { useCourt } from '../state/courtStore'
import { useRotations } from '../state/rotationStore'
import { courtScope } from '../lib/courtContext'
import type { Mark } from '../lib/courtMode'
function Shape({mark}:{mark:Mark}) {
  const a=mark.points[0],b=mark.points.at(-1)!,color=mark.tool==='highlight'?'#ffe56b':'#ffac72'
  const points:[number,number,number][]=mark.points.map(p=>[p.x,.1,p.z])
  if(mark.tool==='text')return <Html position={[a.x,.18,a.z]} center style={{pointerEvents:'none'}}><span className="court-note-pin">{mark.text}</span></Html>
  if(mark.tool==='circle'){
    const rx=Math.max(.15,Math.abs(b.x-a.x)),rz=Math.max(.15,Math.abs(b.z-a.z))
    points.splice(0,points.length,...Array.from({length:65},(_,i)=>[a.x+Math.cos(i/64*Math.PI*2)*rx,.1,a.z+Math.sin(i/64*Math.PI*2)*rz] as [number,number,number]))
  }
  if(points.length===1)points.push([a.x+.015,.1,a.z+.015])
  const angle=Math.atan2(b.z-a.z,b.x-a.x),len=.55
  return <group><Line points={points} color={color} lineWidth={mark.tool==='highlight'?12:3} transparent opacity={mark.tool==='highlight'?.4:.95} depthTest={false}/>
    {mark.tool==='arrow' && mark.points.length>1 && <Line points={[[b.x-len*Math.cos(angle-.5),.1,b.z-len*Math.sin(angle-.5)],[b.x,.1,b.z],[b.x-len*Math.cos(angle+.5),.1,b.z-len*Math.sin(angle+.5)]]} color={color} lineWidth={3} depthTest={false}/>}</group>
}
export function CourtMarks() {
  const c=useCourt(),s=useRotations(),scope=courtScope()
  if(!c.visible)return null
  return <>{c.marks.filter(m=>m.scope===scope && (m.whole || Math.abs(m.time-s.time)<.045)).map(m=><Shape key={m.id} mark={m}/>)}{c.pending && <Shape mark={c.pending}/>}</>
}
