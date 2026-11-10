import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useCourt } from '../state/courtStore'
import { useRotations } from '../state/rotationStore'
import { courtScope } from '../lib/courtContext'
import { groundPan, type Mark } from '../lib/courtMode'
import type { Spot } from '../lib/rotationTypes'
// Retain the coach's pose when switching workspaces or Set arcs.
let pose:{position:THREE.Vector3;target:THREE.Vector3;view:string}|null=null
export function CourtInteractions() {
  const {camera,gl,size}=useThree()
  const view=useRotations(s=>s.view),reset=useCourt(s=>s.reset)
  useEffect(()=>{
    const el=gl.domElement,target=new THREE.Vector3(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0),ray=new THREE.Raycaster()
    const points=new Map<number,{x:number;y:number;type:string;button:number}>()
    let stroke:Mark|null=null,cancelled=false
    function look(){camera.lookAt(target);camera.updateMatrixWorld();pose={position:camera.position.clone(),target:target.clone(),view}}
    if(pose && pose.view===view && reset===lastReset){camera.position.copy(pose.position);target.copy(pose.target);look()}
    else {
      const directions={orbit:[.3,1.2,1],top:[0,1,.001],front:[0,.65,1],side:[1,.8,.05]}
      const dir=new THREE.Vector3(...directions[view] as [number,number,number]).normalize()
      let distance=18
      for(let i=0;i<20;i++){
        camera.position.copy(target).addScaledVector(dir,distance);look()
        const corners=[[-5.5,-10],[5.5,-10],[-5.5,11],[5.5,11]].map(([x,z])=>new THREE.Vector3(x,.2,z).project(camera))
        if(corners.every(p=>Math.abs(p.x)<.88 && Math.abs(p.y)<.88))break
        distance*=1.12
      }
      lastReset=reset;look()
    }
    function hit(x:number,y:number):Spot|null {
      const r=el.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera)
      const p=ray.ray.intersectPlane(floor,new THREE.Vector3())
      return p && Math.abs(p.x)<=20 && Math.abs(p.z)<=20 ? {x:p.x,z:p.z}:null
    }
    function centroid(){const p=[...points.values()];return {x:p.reduce((a,v)=>a+v.x,0)/p.length,y:p.reduce((a,v)=>a+v.y,0)/p.length}}
    function span(){const p=[...points.values()];return p.length<2?0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}
    function zoom(factor:number){const d=camera.position.clone().sub(target);d.setLength(Math.max(5,Math.min(75,d.length()*factor)));camera.position.copy(target).add(d);look()}
    function pan(before:{x:number;y:number},after:{x:number;y:number}) {
      const a=hit(before.x,before.y),b=hit(after.x,after.y)
      if(!a || !b)return
      const p=groundPan(target,{x:a.x-b.x,z:a.z-b.z}),delta=new THREE.Vector3(p.x-target.x,0,p.z-target.z)
      target.add(delta);camera.position.add(delta);look()
    }
    function publishPending(){useCourt.setState({pending:stroke?{...stroke,points:[...stroke.points]}:null})}
    function down(e:PointerEvent){
      const c=useCourt.getState()
      if(e.pointerType==='touch' && [...points.values()].some(p=>p.type==='pen')){e.stopImmediatePropagation();return}
      points.set(e.pointerId,{x:e.clientX,y:e.clientY,type:e.pointerType,button:e.button});el.setPointerCapture(e.pointerId)
      if(points.size===2){stroke=null;cancelled=true;publishPending()}
      if(points.size===1)cancelled=false
      if(!c.annotate)return
      e.preventDefault();e.stopImmediatePropagation()
      if(points.size!==1)return
      const p=hit(e.clientX,e.clientY);if(!p)return
      useRotations.getState().pause()
      if(c.tool==='erase'){
        const s=useRotations.getState(),scope=courtScope()
        const candidates=c.marks.filter(m=>m.scope===scope && (m.whole||Math.abs(m.time-s.time)<.045))
        const nearest=candidates.map(m=>({m,d:Math.min(...m.points.map(q=>Math.hypot(q.x-p.x,q.z-p.z)))})).sort((a,b)=>a.d-b.d)[0]
        if(nearest && nearest.d<1)c.change(c.marks.filter(m=>m.id!==nearest.m.id))
        return
      }
      if(c.tool==='text' && !c.text.trim())return
      stroke={id:crypto.randomUUID(),scope:courtScope(),time:Math.round(useRotations.getState().time*100)/100,whole:c.whole,tool:c.tool,points:[p],text:c.tool==='text'?c.text.trim():'',owner:'Local coach'}
      publishPending()
    }
    function move(e:PointerEvent){
      const old=points.get(e.pointerId);if(!old)return
      const before=centroid(),distance=span(),dx=e.clientX-old.x,dy=e.clientY-old.y
      points.set(e.pointerId,{...old,x:e.clientX,y:e.clientY})
      const c=useCourt.getState()
      if(c.annotate){e.preventDefault();e.stopImmediatePropagation()}
      if(points.size>=2){const after=centroid(),next=span();if(distance>5 && next>5)zoom(distance/next);pan(before,after);return}
      if(c.annotate && !cancelled){
        const p=hit(e.clientX,e.clientY)
        if(stroke && p){
          if(stroke.tool==='pen'||stroke.tool==='highlight'){if(stroke.points.length<5000)stroke.points.push(p)}
          else if(stroke.tool!=='text')stroke.points=[stroke.points[0],p]
          publishPending()
        }
        return
      }
      if(cancelled)return
      const orbit=(view==='orbit'||c.freeOrbit) && old.button!==2 && old.button!==1 && !e.shiftKey
      if(orbit){const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));spherical.theta-=dx*.006;spherical.phi=Math.max(.09,Math.min(Math.PI/2-.12,spherical.phi-dy*.006));camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));look()}
      else pan({x:old.x,y:old.y},{x:e.clientX,y:e.clientY})
    }
    function up(e:PointerEvent){
      if(!points.has(e.pointerId))return
      if(useCourt.getState().annotate){e.preventDefault();e.stopImmediatePropagation()}
      if(e.type==='pointercancel'){stroke=null;cancelled=true}
      if(stroke && !cancelled && points.size===1){
        const c=useCourt.getState();c.change([...c.marks,stroke]);stroke=null
      }
      points.delete(e.pointerId);if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId)
      if(points.size===0){cancelled=false;stroke=null}
      else cancelled=true // remaining finger must lift before drawing resumes
      publishPending()
    }
    function wheel(e:WheelEvent){e.preventDefault();if(e.shiftKey)pan({x:e.clientX,y:e.clientY},{x:e.clientX-e.deltaX,y:e.clientY-e.deltaY});else zoom(Math.exp(Math.max(-1,Math.min(1,e.deltaY*.0015))))}
    function menu(e:Event){e.preventDefault()}
    el.addEventListener('pointerdown',down,true);el.addEventListener('pointermove',move,true);el.addEventListener('pointerup',up,true);el.addEventListener('pointercancel',up,true);el.addEventListener('wheel',wheel,{passive:false});el.addEventListener('contextmenu',menu)
    return()=>{look();el.removeEventListener('pointerdown',down,true);el.removeEventListener('pointermove',move,true);el.removeEventListener('pointerup',up,true);el.removeEventListener('pointercancel',up,true);el.removeEventListener('wheel',wheel);el.removeEventListener('contextmenu',menu);useCourt.setState({pending:null})}
  // A phase, player, resize or tool change must never reset the camera.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[camera,gl,view,reset])
  // Aspect updates are handled by Canvas; Reset explicitly recalculates fitting.
  void size
  return null
}
let lastReset=-1
