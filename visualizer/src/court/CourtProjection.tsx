import { useFrame } from '@react-three/fiber'
import { Vector3, Raycaster, Vector2, Plane, type Camera } from 'three'
import type { RefObject } from 'react'
import { activeBundle, activeScenario, useRotations } from '../state/rotationStore'
import { sampleTrack, positionOf } from '../lib/rotationModel'
import type { Spot } from '../lib/rotationTypes'
export type Projection = { camera: Camera|null; width:number;height:number }
const floor=new Plane(new Vector3(0,1,0),-.06)
export function pointOnCourt(projection:Projection,x:number,y:number):Spot|null {
  if(!projection.camera)return null
  const ray=new Raycaster();ray.setFromCamera(new Vector2(x/projection.width*2-1,1-y/projection.height*2),projection.camera)
  const p=ray.ray.intersectPlane(floor,new Vector3())
  return p&&Math.abs(p.x)<30&&Math.abs(p.z)<30?{x:p.x,z:p.z}:null
}
export function CourtProjection({host,projection}:{host:RefObject<HTMLDivElement|null>;projection:RefObject<Projection>}) {
  useFrame(({camera,size})=>{
    projection.current={camera,width:size.width,height:size.height}
    const root=host.current,s=useRotations.getState(),b=activeBundle(s),scenario=activeScenario(s)
    if(!root||!b||!scenario)return
    const placed:{x:number;y:number;w:number}[]=[]
    const players=[...b.team.players].sort((a,b)=>Number(b.id===s.selected)-Number(a.id===s.selected))
    for(const p of players){
      const el=root.querySelector<HTMLElement>(`[data-cm-player="${p.id}"]`)
      if(!el)continue
      const at=sampleTrack(scenario.tracks[p.id],s.time),v=new Vector3(at.x,.1,at.z).project(camera)
      const w=Math.max(72,p.name.length*7+34),x=Math.max(4,Math.min(size.width-w-4,(v.x+1)*size.width/2-w/2))
      let y=(1-v.y)*size.height/2+8
      // Keep names close to their own feet; move only vertically to avoid collisions.
      for(let i=0;i<6&&placed.some(t=>x<t.x+t.w+4&&x+w+4>t.x&&Math.abs(y-t.y)<30);i++)y+=30
      el.hidden=!s.labels||v.z>1||y<0||y>size.height-30
      el.style.transform=`translate3d(${x}px,${y}px,0)`
      el.style.width=`${w}px`;el.dataset.selected=String(s.selected===p.id)
      const label=`${p.name} · ${positionOf(b.team,s.rotation,p.id)}`
      if(el.textContent!==label)el.textContent=label
      placed.push({x,y,w})
    }
    for(const el of root.querySelectorAll<SVGElement>('[data-cm-points]')){
      const pts=JSON.parse(el.dataset.cmPoints!) as Spot[]
      const points=pts.map(p=>{const v=new Vector3(p.x,.08,p.z).project(camera);return [(v.x+1)*size.width/2,(1-v.y)*size.height/2]})
      if(el.tagName==='text'){el.setAttribute('x',String(points[0][0]));el.setAttribute('y',String(points[0][1]))}
      else el.setAttribute('points',points.map(p=>p.join(',')).join(' '))
    }
  })
  return null
}
