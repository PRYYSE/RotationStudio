import { useEffect } from 'react'
import { useCourt } from '../state/courtStore'
import { useRotations } from '../state/rotationStore'
import { readRotationLink } from '../lib/rotationModel'
import { reviewEntry, reviewPacket, reviewIdFrom } from '../lib/courtMode'
async function boundedText(url:string,signal:AbortSignal,max:number) {
  const response=await fetch(url,{signal,cache:'no-cache',redirect:'error'})
  if(!response.ok)throw new Error(`Asset unavailable (${response.status}).`)
  const reader=response.body?.getReader();if(!reader)throw new Error('Empty review response.')
  let length=0;const chunks:Uint8Array[]=[]
  for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw new Error('Review asset exceeds the size limit.')}chunks.push(value)}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  return {bytes,text:new TextDecoder().decode(bytes)}
}
export function useCourtRoute() {
  const published=useRotations(s=>s.published), id=useCourt(s=>s.reviewId)
  useEffect(()=>{
    const onPop=()=>{
      const p=new URLSearchParams(location.search),s=useRotations.getState(),link=readRotationLink(location.search)
      useCourt.getState().setWorkspace(p.get('ui')==='studio'?'studio':p.get('ui')==='court'||p.has('review')?'court':useCourt.getState().workspace,false)
      if(reviewIdFrom(location.search)!==useCourt.getState().reviewId)useRotations.setState({reviewBundle:null,reviewScope:null,publishedOnly:false})
      useCourt.setState({reviewId:reviewIdFrom(location.search)})
      s.choose(link.rotation,link.serve);s.chooseTactics(link.opponentAttack,link.firstTouch);s.seek(link.time)
    }
    window.addEventListener('popstate',onPop);return()=>window.removeEventListener('popstate',onPop)
  },[])
  useEffect(()=>{
    if(!id){useRotations.setState({reviewBundle:null,reviewScope:null});useCourt.setState({reviewEntry:null,reviewError:'',reviewLoading:false,reviewServes:[]});return}
    if(!published)return
    const abort=new AbortController()
    useCourt.setState({reviewLoading:true,reviewError:'',reviewEntry:null});useRotations.setState({reviewBundle:null,reviewScope:null,playing:false,editor:false,strategyMode:false,example:null})
    ;(async()=>{
      const requested=new URLSearchParams(location.search)
      for(const [key,allowed] of Object.entries({r:['1','2','3','4','5','6'],serve:['us','they'],attack:['left','right'],first:['normal','harry']}))if(requested.has(key)&&!allowed.includes(requested.get(key)!))throw new Error('Invalid exact review selection.')
      const root=new URL(`${import.meta.env.BASE_URL}reviews/`,location.origin)
      const manifest=await boundedText(new URL('manifest.json',root).href,abort.signal,100_000)
      const entry=reviewEntry(JSON.parse(manifest.text),id)
      const raw=await boundedText(new URL(entry.data,root).href,abort.signal,1_000_000)
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw.bytes))).map(x=>x.toString(16).padStart(2,'0')).join('')
      if(digest!==entry.sha256)throw new Error('Review integrity check failed. No substitute data was loaded.')
      const packet=JSON.parse(raw.text),p=new URLSearchParams(location.search),s=useRotations.getState()
      const rotation=p.has('r')?s.rotation:entry.rotation
      if(rotation!==entry.rotation || packet.version!==entry.version)throw new Error('Review rotation/version does not match this link.')
      const bundle=reviewPacket(packet,published,id,rotation,s.serve,s.opponentAttack,s.firstTouch)
      if(s.time>packet.scenarios.find((v:{serve:string})=>v.serve===s.serve).duration)throw new Error('Requested review time exceeds the authored timeline.')
      if(abort.signal.aborted)return
      useRotations.setState({reviewBundle:bundle,reviewScope:{rotation,serves:packet.scenarios.map((v:{serve:string})=>v.serve)},rotation,playing:false,editor:false,strategyMode:false,example:null,exampleScenario:null,time:Math.min(s.time,packet.scenarios.find((v:{serve:string})=>v.serve===s.serve).duration)})
      useCourt.setState({reviewEntry:entry,reviewLoading:false,reviewServes:packet.scenarios.map((v:{serve:string})=>v.serve)})
    })().catch(error=>{if(!abort.signal.aborted)useCourt.setState({reviewLoading:false,reviewError:String(error instanceof Error?error.message:error)})})
    return()=>abort.abort()
  },[published,id])
}
export function courtLink() {
  const s=useRotations.getState(),c=useCourt.getState(),url=new URL(location.href)
  const values={mode:'rotations',ui:c.workspace,r:String(s.rotation),serve:s.serve,attack:s.opponentAttack,first:s.firstTouch,t:String(Math.round(s.time*100)/100)}
  for(const [k,v] of Object.entries(values))url.searchParams.set(k,v)
  if(c.reviewId)url.searchParams.set('review',c.reviewId);else url.searchParams.delete('review')
  return url.href
}
