import { useEffect, useRef, useState } from 'react'
import { applyStrategy } from '../lib/strategyDraft'
import { decodeCourtReview, loadStaticReview, parseCourtReview, type CourtReview } from '../lib/courtReview'
import { useRotations } from '../state/rotationStore'
export function useCourtReview() {
  const [review,setReview]=useState<CourtReview|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false)
  const before=useRef<Pick<ReturnType<typeof useRotations.getState>,'rotation'|'serve'|'opponentAttack'|'firstTouch'|'time'|'selected'>|null>(null)
  const open=(r:CourtReview)=>{
    const exact=parseCourtReview(r),s=useRotations.getState()
    if(!before.current)before.current={rotation:s.rotation,serve:s.serve,opponentAttack:s.opponentAttack,firstTouch:s.firstTouch,time:s.time,selected:s.selected}
    const applied=exact.strategy?applyStrategy(exact.bundle,exact.strategy).bundle:exact.bundle
    useRotations.setState({review:{bundle:exact.bundle,applied,strategy:exact.strategy},...exact.context,playing:false,editor:false,strategyMode:false,example:null,exampleScenario:null,exampleResult:null,transitionTarget:null})
    setReview(exact);setError('')
  }
  useEffect(()=>{
    const p=new URLSearchParams(location.search),encoded=location.hash.startsWith('#court-review=')?location.hash.slice(14):null
    if(!p.has('review')&&!encoded)return
    let alive=true;setLoading(true)
    const request=encoded?decodeCourtReview(encoded):loadStaticReview(p.get('review')!,p.get('sha256')??'',new URL(import.meta.env.BASE_URL,location.origin).href)
    request.then(r=>{if(alive)open(r)}).catch(e=>{if(alive)setError(String(e.message??e))}).finally(()=>{if(alive)setLoading(false)})
    return()=>{alive=false}
  },[])
  return {review,error,loading,open,
    exit:()=>{
      useRotations.setState({review:null,playing:false,transitionTarget:null,...before.current})
      before.current=null;setReview(null);setError('')
      const url=new URL(location.href);url.searchParams.delete('review');url.searchParams.delete('sha256');if(url.hash.startsWith('#court-review='))url.hash='';history.replaceState(null,'',url)
    },
  }
}
