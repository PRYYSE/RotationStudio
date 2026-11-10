# Optional focused browser smoke. Start Vite on port 5188, then run from /tmp:
# uv run --no-project --with playwright python /absolute/path/to/visualizer/scripts/smoke-court.py
# Set PLAYWRIGHT_CHROMIUM to an installed executable if Playwright's default is unavailable.
# Uses isolated browser contexts; does not touch the owner's browser profile.
# Review assets are intercepted unchanged R1 fixtures, never public tactical proposals.
from playwright.sync_api import sync_playwright
import json,hashlib,os
from pathlib import Path
PUBLIC=Path(__file__).resolve().parents[1]/'public'
BASE='http://127.0.0.1:5188/'
RS="(await import('/src/state/rotationStore.ts')).useRotations"
CS="(await import('/src/state/courtStore.ts')).useCourt"
def state(page): return page.evaluate(f"async()=>{{const s={RS}.getState();return {{time:s.time,playing:s.playing,rotation:s.rotation,serve:s.serve,draft:!!s.draft}}}}")
def camera(page): return page.evaluate("async()=>{const f=await import('/node_modules/.vite/deps/@react-three_fiber.js');const c=f._roots.get(document.querySelector('canvas')).store.getState().camera;return {p:c.position.toArray(),q:c.quaternion.toArray()}}")
def touch(cdp,kind,pts): cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':y,'id':i,'radiusX':3,'radiusY':3} for i,x,y in pts]})
def gesture(page,points,delta):
 cdp=page.context.new_cdp_session(page);touch(cdp,'touchStart',points)
 for n in range(1,6):touch(cdp,'touchMove',[(i,x+delta[0]*n/5,y+delta[1]*n/5) for i,x,y in points])
 touch(cdp,'touchEnd',[]);page.wait_for_timeout(100);cdp.detach()
def goto(page,url):page.goto(url);page.wait_for_load_state('networkidle');page.wait_for_timeout(300)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,**({'executable_path':os.environ['PLAYWRIGHT_CHROMIUM']} if os.environ.get('PLAYWRIGHT_CHROMIUM') else {}),args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,user_agent='Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36')
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 goto(page,BASE);assert page.get_by_role('main',name='Court Mode',exact=True).count()==1
 page.get_by_role('button',name='Next event',exact=True).click();assert state(page)['time']==1.4
 before=camera(page);page.get_by_role('button',name='Next event',exact=True).click();assert state(page)['time']==2.75;assert camera(page)==before
 # Touch orbit and plane panning are real CDP input, rather than DOM-only dispatch.
 gesture(page,[(1,195,350)],(35,20));assert camera(page)['q']!=before['q']
 for view in ['Top','Front','Side']:
  page.get_by_role('button',name=view,exact=True).click();a=camera(page);gesture(page,[(1,195,350)],(20,12));z=camera(page)
  assert a['p']!=z['p'],view;assert abs(a['p'][1]-z['p'][1])<1e-6,view;assert a['q']==z['q'] or max(abs(x-y) for x,y in zip(a['q'],z['q']))<1e-6
 page.get_by_role('button',name='Top',exact=True).click();page.get_by_role('button',name='Reset View',exact=True).click();a=camera(page)
 gesture(page,[(1,170,340),(2,220,340)],(20,15));z=camera(page);assert abs(a['p'][1]-z['p'][1])<1e-6;assert a['p']!=z['p']
 cdp=ctx.new_cdp_session(page);touch(cdp,'touchStart',[(1,160,340),(2,230,340)]);touch(cdp,'touchMove',[(1,155,350),(2,255,350)]);touch(cdp,'touchEnd',[]);page.wait_for_timeout(100);assert camera(page)['p'][1]<z['p'][1];cdp.detach()
 page.get_by_role('button',name='Reset View',exact=True).click();page.get_by_role('button',name='Annotate',exact=True).click()
 # Pen input uses Chromium's pen pointer type.
 cdp=ctx.new_cdp_session(page)
 cdp.send('Input.dispatchMouseEvent',{'type':'mouseMoved','x':170,'y':380,'pointerType':'pen'})
 cdp.send('Input.dispatchMouseEvent',{'type':'mousePressed','x':170,'y':380,'button':'left','clickCount':1,'pointerType':'pen'})
 for x in [175,180,185,190]:cdp.send('Input.dispatchMouseEvent',{'type':'mouseMoved','x':x,'y':390,'button':'left','buttons':1,'pointerType':'pen','force':.5})
 cdp.send('Input.dispatchMouseEvent',{'type':'mouseReleased','x':190,'y':390,'button':'left','clickCount':1,'pointerType':'pen'});cdp.detach()
 raw=page.evaluate("localStorage.getItem('rotationstudio-court-notes-v1')");assert raw and len(json.loads(raw)['notes'])==1
 page.get_by_role('button',name='Undo',exact=True).click();assert len(json.loads(page.evaluate("localStorage.getItem('rotationstudio-court-notes-v1')"))['notes'])==0
 page.get_by_role('button',name='Redo',exact=True).click();assert page.evaluate("localStorage.getItem('rotationstudio-court-notes-v1')")==raw
 # A second finger cancels, rather than committing a wild annotation.
 cdp=ctx.new_cdp_session(page);touch(cdp,'touchStart',[(1,160,360)]);touch(cdp,'touchMove',[(1,165,365)]);touch(cdp,'touchStart',[(1,165,365),(2,230,365)]);touch(cdp,'touchMove',[(1,175,370),(2,240,370)]);touch(cdp,'touchEnd',[]);cdp.detach();assert page.evaluate("localStorage.getItem('rotationstudio-court-notes-v1')")==raw
 page.reload();page.wait_for_load_state('networkidle');assert page.evaluate("localStorage.getItem('rotationstudio-court-notes-v1')")==raw
 page.get_by_role('button',name='Notes',exact=False).filter(has_text='Notes').first.click();assert page.locator('.court-note-row').count()==1;page.locator('.court-note-row > button').first.click();assert state(page)['time']==2.75;page.get_by_role('button',name='Close',exact=True).click()
 page.get_by_role('button',name='Full Studio',exact=True).click();assert page.get_by_role('button',name='Edit strategy',exact=True).count()==1
 page.get_by_role('button',name='View',exact=True).click();page.get_by_role('button',name='Court Mode',exact=True).click();assert state(page)['time']==2.75
 page.set_viewport_size({'width':844,'height':390});assert page.get_by_role('main',name='Court Mode',exact=True).count()==1;page.get_by_role('button',name='Reset View',exact=True).click();page.screenshot(path='/tmp/court-landscape.png')
 page.get_by_role('button',name='Fullscreen',exact=True).click();assert page.locator('.is-immersive').count()==1;assert page.get_by_label('Scrub court timeline').is_visible();page.get_by_role('button',name='Exit fullscreen',exact=True).click()
 # Unsupported fullscreen uses the same viewport-filling focus shell.
 page.evaluate('Element.prototype.requestFullscreen=undefined');page.get_by_role('button',name='Fullscreen',exact=True).click();assert page.locator('.is-immersive').count()==1;page.get_by_role('button',name='Exit fullscreen',exact=True).click()
 page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='Reset View',exact=True).click();page.screenshot(path='/tmp/court-portrait.png')
 print('PASS phone: default, exact events/stable camera, all preset pan, orbit, ground two-touch pan/pinch, pen, cancel, undo/redo/reload, workspace, landscape, fullscreen/fallback')
 # Verified review fixture uses unchanged existing R1 geometry, not new tactics or a published demo.
 team=json.load(open(PUBLIC/'plans/team.json'));plans=json.load(open(PUBLIC/'plans/rotations.json'))
 packet={'schemaVersion':1,'id':'r1-check','rotation':1,'version':'R1 check','scenarios':[s for s in plans['scenarios'] if s['rotation']==1]};data=json.dumps(packet);entry={'rotation':1,'version':'R1 check','data':'r1-check/case.json','plan':'r1-check/plan.md','sha256':hashlib.sha256(data.encode()).hexdigest()}
 page.route('**/reviews/manifest.json',lambda r:r.fulfill(json={'schemaVersion':1,'reviews':{'r1-check':entry}}));page.route('**/reviews/r1-check/case.json',lambda r:r.fulfill(body=data,content_type='application/json'))
 goto(page,BASE+'?ui=court&review=r1-check&r=1&serve=they&attack=left&first=normal&t=4.5');assert page.locator('.court-workspace').count()==1;assert state(page)['time']==4.5
 assert page.get_by_label('Rotation',exact=True).locator('option[value="2"]').is_disabled()
 page.get_by_role('button',name='Full Studio',exact=True).click();assert page.get_by_role('button',name='R2',exact=True).is_disabled();page.get_by_role('button',name='Court Mode',exact=True).click()
 assert page.evaluate(f"async()=>{{const r={RS}.getState(),c={CS}.getState();return c.reviewId==='r1-check'&&!!r.reviewBundle}}")
 goto(page,BASE+'?ui=court&review=missing&r=1');assert page.get_by_role('heading',name='Review not available',exact=True).count()==1;assert page.locator('canvas').count()==0
 goto(page,BASE+'?ui=court&review=r1-check&r=2');assert page.get_by_role('heading',name='Review not available',exact=True).count()==1
 print('PASS review: unchanged R1 fixture SHA/schema, exact time, scope restrictions in both workspaces, missing/mismatched review blocks court')
 ctx.close()
 # Touch-capable Linux laptop starts in Studio and never swaps on resize.
 desk=b.new_context(viewport={'width':1366,'height':900},has_touch=True,user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36')
 page=desk.new_page();page.on('pageerror',lambda e:errors.append(str(e)));goto(page,BASE);assert page.get_by_role('button',name='Edit strategy',exact=True).count()==1
 page.set_viewport_size({'width':540,'height':800});assert page.get_by_role('button',name='Edit strategy',exact=True).count()==1
 page.set_viewport_size({'width':1366,'height':900});page.get_by_role('button',name='Court Mode',exact=True).click();assert page.locator('.court-workspace').count()==1
 page.get_by_role('button',name='Top',exact=True).click();a=camera(page);gesture(page,[(1,650,350),(2,720,350)],(30,15));assert camera(page)['p']!=a['p']
 page.get_by_role('button',name='Annotate',exact=True).click();gesture(page,[(1,680,390)],(30,15));assert page.evaluate("!!localStorage.getItem('rotationstudio-court-notes-v1')")
 page.reload();page.wait_for_load_state('networkidle');assert page.locator('.court-workspace').count()==1;page.screenshot(path='/tmp/court-touch-laptop.png')
 page.get_by_role('button',name='Full Studio',exact=True).click();page.get_by_role('button',name='Set arcs',exact=True).click();assert page.get_by_role('button',name='Rotations',exact=True).count()==1;assert page.locator('canvas').count()==1
 print('PASS touch Linux laptop: Studio default at full/narrow sizes, manual Court/persistent choice, two-finger navigation, finger annotation, Set arcs')
 assert not errors,errors
 print('PASS no browser runtime errors')
 desk.close();b.close()
