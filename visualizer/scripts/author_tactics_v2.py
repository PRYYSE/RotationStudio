#!/usr/bin/env python3
"""ChatGPT-authored TTGVA C Grade tactical V3 (illustrative, NOT approved).
Edit coordinate data below; generated public JSON is the runtime authority.
"""
import copy, json, math
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
ROOT=BASE/"public/plans"
TEAM=json.loads((ROOT/"team.json").read_text())
TEAM["status"]="DRAFT"
INITIAL=["harry","georgia","logan","trent","jaz","caleb"]  # P1..P6
TEAM["initialOrder"]=INITIAL
PEOPLE=["harry","caleb","trent","logan","georgia","jaz"]
FEMALE={"jaz","georgia"}
# Relative coaching preferences only (1=limited, 5=strong). Not measured
# running speeds or official skill ratings. Explicit team data, editable later.
SKILLS={
 "harry":{"receive":3,"mobility":4,"setting":5,"attack":2},
 "caleb":{"receive":5,"mobility":5,"setting":4,"attack":4},
 "trent":{"receive":3,"mobility":2,"setting":2,"attack":4},
 "logan":{"receive":1,"mobility":3,"setting":1,"attack":4},
 "georgia":{"receive":3,"mobility":3,"setting":3,"attack":3},
 "jaz":{"receive":2,"mobility":1,"setting":1,"attack":2},
}
for athlete in TEAM["players"]:athlete["skills"]=SKILLS[athlete["id"]]
COURT={
 1:{4:(-1.85,1.50),3:(-.25,2.80),2:(2.80,1.85),5:(-2.95,6.90),6:(.90,6.70),1:(1.55,2.65)},
 2:{4:(-2.95,2.65),3:(-.25,1.70),2:(2.80,1.90),5:(-1.95,6.50),6:(.35,2.80),1:(1.95,6.90)},
 3:{4:(-2.85,2.40),3:(.55,2.25),2:(1.65,1.75),5:(-1.25,3.25),6:(-.85,6.90),1:(2.85,7.00)},
 4:{4:(-1.20,1.55),3:(-.60,3.00),2:(2.75,2.05),5:(-2.85,6.70),6:(.05,6.85),1:(2.80,6.80)},
 5:{4:(-2.20,4.20),3:(.50,1.55),2:(2.20,4.30),5:(-3.00,7.35),6:(0,6.60),1:(3.05,7.25)},
 6:{4:(-2.80,1.75),3:(1.05,2.30),2:(1.95,1.65),5:(-2.80,6.65),6:(0,7.10),1:(2.70,6.65)},
}
TARGET={1:(1.55,1.05),2:(.95,1.05),3:(1.35,.90),4:(.35,1.05),5:(.95,1.05),6:(1.15,1.05)}
OFFENSE={
 1:{"logan":(-2.8,2.0),"trent":(-.15,1.35),"georgia":(2.80,2.3)},
 2:{"jaz":(-2.8,2.5),"trent":(.0,1.35),"logan":(2.8,1.9)},
 3:{"caleb":(-2.8,2.15),"trent":(.10,.70),"jaz":(2.65,2.40)},
 4:{"caleb":(-1.70,2.20),"jaz":(2.75,2.45)},
 5:{"georgia":(-2.75,2.35),"caleb":(2.75,2.25)},
 6:{"logan":(-2.8,2.10),"georgia":(2.70,2.40)},
}
BLOCKERS={1:("logan","trent"),2:("trent","logan"),3:("caleb","trent"),4:("caleb","harry"),5:("harry","caleb"),6:("logan","harry")}
# The front-side hitter drops a step into a short-ball lane, not 2-3m
# sideways into a literal "short middle". Front row eligibility remains fixed.
SHORT={
 1:("georgia",(2.55,3.35)),2:("jaz",(-2.15,3.40)),3:("jaz",(2.35,3.35)),
 4:("jaz",(2.55,3.35)),5:("georgia",(-2.45,3.35)),6:("georgia",(2.45,3.35)),
}
# Two deep defenders anchor the backline; back-row Harry is a shallow
# defender / second-contact outlet rather than sprinting to z=7 and back.
DEEP={
 1:{"jaz":(-2.95,6.95),"caleb":(.95,6.75),"harry":(2.85,4.85)},
 2:{"caleb":(-2.00,6.85),"harry":(.15,4.40),"georgia":(2.00,6.85)},
 3:{"harry":(-.80,4.35),"georgia":(-.90,6.90),"logan":(2.90,7.05)},
 4:{"georgia":(-2.85,6.10),"logan":(.05,6.85),"trent":(2.85,6.85)},
 5:{"logan":(-3.05,7.15),"trent":(.00,6.70),"jaz":(3.05,7.15)},
 6:{"trent":(-2.85,6.80),"jaz":(.00,7.05),"caleb":(2.75,6.75)},
}
# Opponent-attacker side is OUR left/right. An adjacent front player closes;
# far-front player retains their lane instead of crossing the entire net.
# Values list x for the existing [left blocker, right blocker] identities.
BLOCK_X={
 1:{"left":(-2.45,-.30),"right":(-2.60,1.20)},
 2:{"left":(-1.45,2.50),"right":(.10,2.40)},
 3:{"left":(-2.40,.15),"right":(-2.55,1.35)},
 4:{"left":(-1.85,.10),"right":(-1.65,1.45)},
 5:{"left":(-.70,2.45),"right":(.60,2.40)},
 6:{"left":(-2.45,.75),"right":(-2.65,2.00)},
}
# Receive area coordinates (x,z, horizontal radius, depth radius, label, duty).
ZONES={
 1:[("caleb",(.45,6.40,2.50,2.25,"Middle + right seam","primary")),("jaz",(-3.1,7.1,1.2,1.6,"Short left / left deep","compact")),("georgia",(2.9,4.1,1.0,1.4,"Short right","assist"))],
 2:[("caleb",(-2.5,6.25,2.05,2.2,"Deep left","primary")),("georgia",(2.6,6.4,1.85,2.0,"Deep right","primary")),("jaz",(-3.1,4.15,1.1,1.2,"Short left","compact"))],
 3:[("georgia",(-.65,6.55,2.45,2.15,"Centre + deep left","primary")),("caleb",(-2.75,4.15,1.35,1.7,"Left + short left","primary")),("logan",(3.05,7.35,1.05,1.3,"Narrow deep right","compact")),("jaz",(1.15,4.35,1.0,1.1,"Short centre-right","compact"))],
 4:[("georgia",(-2.6,6.45,1.95,2.1,"Deep left","primary")),("caleb",(-.55,4.2,2.25,2.1,"Middle + short left","primary")),("trent",(2.75,6.75,1.35,1.55,"Deep right","assist")),("logan",(.25,7.45,1.0,1.1,"Small deep middle","compact"))],
 5:[("caleb",(1.8,5.65,2.65,2.55,"Right + middle","primary")),("georgia",(-2.2,5.50,2.05,2.25,"Left + middle","primary")),("trent",(.0,6.65,1.25,1.55,"Small deep centre","assist")),("logan",(-3.35,8.1,.85,.9,"Deep-left corner","compact")),("jaz",(3.3,8.1,.85,.9,"Deep-right corner","compact"))],
 6:[("caleb",(1.75,6.1,2.6,2.3,"Right + middle","primary")),("trent",(-2.75,6.35,1.65,2.0,"Deep left","assist")),("jaz",(.05,7.40,1.0,1.2,"Compact deep middle","compact")),("georgia",(1.00,3.7,1.60,1.50,"Short centre / right","assist"))],
}
FIRST={1:"caleb",2:"caleb",3:"georgia",4:"georgia",5:"caleb",6:"caleb"}
RECEIVE_PT={1:(.30,6.20),2:(-2.60,6.35),3:(-.40,6.55),4:(-2.65,6.35),5:(2.35,5.25),6:(2.35,6.25)}
NEXT_DIGGER={1:"caleb",2:"caleb",3:"georgia",4:"georgia",5:"trent",6:"caleb"}
FALLBACK={1:"georgia",2:"trent",3:"trent",4:"caleb",5:"caleb",6:"georgia"}
MAIN={1:"logan",2:"logan",3:"caleb",4:"caleb",5:"georgia",6:"logan"}
BACKUP_HIT={1:"logan",2:"logan",3:"caleb",4:"jaz",5:"georgia",6:"logan"}

def posdict(v):return {"x":round(v[0],2),"z":round(v[1],2)}
def point(v,y):return {**posdict(v),"y":y}
def interp(a,b,t):return (a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)
def order(r):return INITIAL[r-1:]+INITIAL[:r-1]
def start(r,serve):
    row=order(r); result={id:COURT[r][row.index(id)+1] for id in PEOPLE}
    if serve=="us":
        result[row[0]]=(3.30,9.45)
        if r==4:result["caleb"]=(-.10,2.35)
        if r==5:
            result["georgia"]=(-2.75,2.45)
            result["caleb"]=(2.75,2.60)
    return result
def defshape(r,side):
    # Role-based ADJUST from base, not a switch to a rigid imaginary formation.
    # Nearest defender shades line, central shades lightly, far defender tucks
    # toward cross-court. This is <0.32m, not an across-court migration.
    sign=-1 if side=="left" else 1
    out={}
    for id,(x,z) in DEEP[r].items():
        shade=.12 if x*sign>1.20 else (.30 if x*sign < -1.20 else .18)
        out[id]=(round(max(-3.35,min(3.35,x+sign*shade)),2),z)
    woman,(x,z)=SHORT[r]
    out[woman]=(x,z)
    left,right=BLOCKERS[r]
    lx,rx=BLOCK_X[r][side]
    out[left]=(lx,.87 if side=="left" else 1.28)
    out[right]=(rx,.87 if side=="right" else 1.28)
    assert set(out)==set(PEOPLE),(r,side,out)
    return out
def near_opposition_side(side):return (-2.75,-2.0) if side=="left" else (2.75,-2.0)
def new_times(serve,r):
    if serve=="they":
        extra=.20 if r==3 else 0.
        return {"contact":1.4,"first":2.75,"second":4.50+extra,"hit":5.38+extra,
                "oppReceive":6.30+extra,"oppPass":7.10+extra,"oppSet":7.83+extra,
                "ready":8.06+extra,"dig":9.16+extra,"reset":11.62+extra,"end":12.00+extra}
    extra=.25 if r in (1,3) else 0.
    return {"contact":1.4,"oppReceive":2.55,"oppPass":3.28,"oppSet":3.95,
            "ready":4.18,"first":5.40,"second":7.52+extra,"hit":8.38+extra,
            "oppReceive2":9.25+extra,"oppPass2":10.00+extra,"oppSet2":10.72+extra,
            "ready2":10.92+extra,"dig":12.04+extra,"reset":14.46+extra,"end":14.82+extra}

def create(r,serve,side="left",harry_touch=False):
    T=new_times(serve,r)
    startpos=start(r,serve)
    defense=defshape(r,side)
    # Harry-first R6: do not sprint across Georgia's setting and short-ball
    # lane to imitate the normal right-block assignment. Stay middle and
    # accept that this one transition may have a weak/no right block.
    if r==6 and harry_touch:defense["harry"]=(.20,1.30)
    target=TARGET[r]
    nextSetter="trent" if r==3 else "harry"
    nextTarget=(.12,1.35) if r==3 else target
    firstId="harry" if harry_touch else FIRST[r]
    setter=FALLBACK[r] if harry_touch else "harry"
    hitter=BACKUP_HIT[r] if harry_touch else MAIN[r]
    assert hitter not in (setter,"harry")
    row=order(r); rowpos={id:row.index(id)+1 for id in PEOPLE}
    if serve=="they":
        firstSpot=startpos["harry"] if harry_touch else RECEIVE_PT[r]
        if harry_touch and r in (4,5,6):firstSpot=(startpos["harry"][0],min(4.2,startpos["harry"][1]+1.15))
    else:
        firstSpot=defense["harry"] if harry_touch else defense[FIRST[r]]
        if harry_touch and r in (4,5,6):firstSpot=(defense["harry"][0],2.25)
    nextId=NEXT_DIGGER[r]
    nextSpot=defense[nextId]
    front=set(id for id in PEOPLE if rowpos[id] in (2,3,4))
    closeBlock=BLOCKERS[r][0 if side=="left" else 1]
    assert set(OFFENSE[r])==front-{"harry"}
    receivers=[]
    for id,(x,z,rx,rz,label,duty) in ZONES[r]:
        receivers.append({"player":id,"center":posdict((x,z)),"radiusX":rx,"radiusZ":rz,"duty":duty,"label":label})
    # During THEIR serve, the ball flight comes to our first receiver.
    # During OUR serve, the ball first travels away before their return/dig.
    oppSpot=near_opposition_side(side)
    setterOpponent=(0,-1.45)
    opponentFirst=(0,-6.15)
    ourReceive=(firstSpot)
    mainHit=OFFENSE[r][hitter]
    toOpponent=(0,-6.15)
    ball=[]
    def addball(kind,t0,t1,a,b,height):
        assert t0<t1
        ball.append({"kind":kind,"start":round(t0,2),"end":round(t1,2),
                     "from":a,"to":b,"height":height})
    if serve=="they":
        addball("serve",T["contact"],T["first"],point((2.45,-10.30),2.3),point(firstSpot,1.10),4.0)
        addball("pass",T["first"],T["second"],point(firstSpot,1.10),point(target,2.45),4.25 if r!=3 else 4.65)
        addball("set",T["second"],T["hit"],point(target,2.45),point(mainHit,2.8),3.95)
        addball("attack",T["hit"],T["oppReceive"],point(mainHit,2.8),point(toOpponent,1.05),3.15)
        addball("return",T["oppReceive"],T["oppPass"],point(toOpponent,1.05),point(setterOpponent,2.4),3.8)
        addball("set",T["oppPass"],T["oppSet"],point(setterOpponent,2.4),point(oppSpot,2.85),3.85)
        addball("attack",T["oppSet"],T["dig"],point(oppSpot,2.85),point(nextSpot,1.05),3.15)
        addball("pass",T["dig"],T["reset"],point(nextSpot,1.05),point(nextTarget,2.45),4.4)
    else:
        addball("serve",T["contact"],T["oppReceive"],point(startpos[row[0]],2.25),point(opponentFirst,1.05),3.8)
        addball("return",T["oppReceive"],T["oppPass"],point(opponentFirst,1.05),point(setterOpponent,2.4),3.75)
        addball("set",T["oppPass"],T["oppSet"],point(setterOpponent,2.4),point(oppSpot,2.85),3.85)
        addball("attack",T["oppSet"],T["first"],point(oppSpot,2.85),point(firstSpot,1.05),3.15)
        addball("pass",T["first"],T["second"],point(firstSpot,1.05),point(target,2.45),4.45 if r!=3 else 4.8)
        addball("set",T["second"],T["hit"],point(target,2.45),point(mainHit,2.8),3.95)
        addball("attack",T["hit"],T["oppReceive2"],point(mainHit,2.8),point(toOpponent,1.05),3.2)
        addball("return",T["oppReceive2"],T["oppPass2"],point(toOpponent,1.05),point(setterOpponent,2.4),3.8)
        addball("set",T["oppPass2"],T["oppSet2"],point(setterOpponent,2.4),point(oppSpot,2.85),3.85)
        addball("attack",T["oppSet2"],T["dig"],point(oppSpot,2.85),point(nextSpot,1.05),3.15)
        addball("pass",T["dig"],T["reset"],point(nextSpot,1.05),point(nextTarget,2.45),4.5)
    def after_first(id):
        # Do not artificially turn the first passer into a fast quick hitter.
        if id==firstId:
            return firstSpot
        if id==setter:
            return interp(startpos[id] if serve=="they" else defense[id],target,.70)
        if id in OFFENSE[r]:
            return interp(startpos[id] if serve=="they" else defense[id],OFFENSE[r][id],.55)
        return startpos[id] if serve=="they" else defense[id]
    def attack_support(id):
        if id==setter:return target
        if id in OFFENSE[r]:
            # Their first touch can be a poor landing for a quick attack;
            # arrival toward the pin continues until the hitting contact.
            if id==firstId:return interp(firstSpot,OFFENSE[r][id],.62)
            return OFFENSE[r][id]
        # deep athletes cover hitters while our team has possession
        if rowpos[id]==5:return (-2.8,6.05)
        if rowpos[id]==6:return (0,6.15)
        if rowpos[id]==1:return (2.8,6.10)
        return startpos[id]
    def now_role(id,phase):
        if phase=="serve":return "serve" if serve=="us" and id==row[0] else "start"
        if phase=="first":return "pass" if id==firstId else ("set" if id==setter else "receive")
        if phase=="second":return "set" if id==setter else "help"
        if phase=="hit":return "attack" if id in OFFENSE[r] and id!=setter else ("set" if id==setter else "help")
        if phase in ("ready","ready2","dig"):
            if phase=="dig" and id==nextId:return "pass"
            return "block" if id==closeBlock and rowpos[id] in (2,3,4) else "defend"
        if phase=="reset":return "set" if id==nextSetter else "recover"
        return "help"
    def keyframe(track,tm,xy,role,attack=False,via=None):
        k={"time":round(tm,2),**posdict(xy),"role":role}
        if attack:
            k.update({"aboveNet":True,"takeoffZ":round(xy[1],2)})
        if via:k["via"]=[posdict(v) for v in via]
        track.append(k)
    tracks={}
    for id in PEOPLE:
        st=startpos[id];tr=[]
        keyframe(tr,0,st,"start")
        keyframe(tr,T["contact"],st,now_role(id,"serve"))
        if serve=="they":
            first=firstSpot if id==firstId else after_first(id)
            if id=="harry" and not harry_touch:
                first=((-0.70,2.10) if r==3 else interp(st,target,.72))
            if id in OFFENSE[r] and id!=firstId and id!=setter:
                first=interp(st,OFFENSE[r][id],.52)
                if r==3 and id=="trent":first=(.85,1.40)
            keyframe(tr,T["first"],first,now_role(id,"first"))
            atSet=target if id==setter else attack_support(id)
            if r==3 and id=="trent" and id!=setter:atSet=(.55,1.65)
            if id=="harry" and harry_touch:
                atSet=interp(firstSpot,defense["harry"],.35)
                if r==5:atSet=(-.85,2.45)
                if r==6:atSet=(.00,2.80)
            setVia=[(-.20,.65),(.85,.55)] if r==3 and id=="harry" and not harry_touch else None
            keyframe(tr,T["second"],atSet,now_role(id,"second"),via=setVia)
        else:
            # Our serve: remain defensive while the opponents hold the ball.
            midway=interp(st,defense[id],.55)
            if r==1 and id=="logan":midway=(-1.45,2.60)
            if r==1 and id=="trent":midway=(-.40,.82)
            if r==4 and id=="caleb":midway=(-.95,2.90)
            if r==4 and id=="harry":midway=(-.10,.82)
            keyframe(tr,T["oppReceive"],midway,"defend" if id!=row[0] else "recover")
            keyframe(tr,T["ready"],defense[id],now_role(id,"ready"))
            first=firstSpot if id==firstId else defense[id]
            keyframe(tr,T["first"],first,now_role(id,"first"))
            # After our dig, back-row helpers start towards attack coverage
            # early instead of making Jaz/other limited movers dash in <1s.
            atSet=(target if id==setter else
                   (interp(first,OFFENSE[r][id],.75) if id in OFFENSE[r] else
                    (interp(first,attack_support(id),.70) if rowpos[id] in (1,5,6) and id!=firstId else first)))
            if id=="harry" and harry_touch:
                atSet=interp(firstSpot,defense["harry"],.35)
                if r==5:atSet=(-.85,2.45)
                if r==6:atSet=(.00,2.80)
            setVia=[(1.25,4.25),(1.15,2.5)] if r==1 and id=="harry" and not harry_touch else None
            if r==3 and id=="harry" and not harry_touch:setVia=[(-1.15,3.65),(.15,2.45)]
            keyframe(tr,T["second"],atSet,now_role(id,"second"),via=setVia)
        atHit=target if id==setter else (OFFENSE[r][id] if id in OFFENSE[r] and id!=setter else attack_support(id))
        if id=="harry" and harry_touch:
            atHit=defense["harry"]
            if r==4:atHit=(.10,2.25)
            if r==5:atHit=(-1.05,2.10)
            if r==6:atHit=(.05,1.75)
        # Crossing routes are staged during release, not detours at attack contact.
        keyframe(tr,T["hit"],atHit,now_role(id,"hit"),attack=id in OFFENSE[r] and id!=setter)
        if serve=="they":
            midway=interp(atHit,defense[id],.30)
            if r==1 and id=="harry" and not harry_touch:midway=(3.70,1.90)
            keyframe(tr,T["oppReceive"],midway,"help")
        else:
            midway=interp(atHit,defense[id],.45)
            if r==1 and id=="harry" and not harry_touch:midway=(3.70,1.90)
            keyframe(tr,T["oppReceive2"],midway,"help")
        readyTime=T["ready"] if serve=="they" else T["ready2"]
        keyframe(tr,readyTime,defense[id],now_role(id,"ready"))
        keyframe(tr,T["dig"],defense[id],now_role(id,"dig"))
        if id==nextSetter:
            atReset=nextTarget
        elif id=="harry":
            atReset=defense["harry"]
        elif id in OFFENSE[r]:
            atReset=OFFENSE[r][id]
        else:
            atReset=attack_support(id)
        if id==nextId and id in OFFENSE[r]:atReset=interp(defense[id],OFFENSE[r][id],.65)
        resetVia=[(1.65,3.75)] if r==1 and id=="harry" else None
        keyframe(tr,T["reset"],atReset,now_role(id,"reset"),via=resetVia)
        keyframe(tr,T["end"],atReset,"recover")
        tracks[id]=tr
    # R3 Harry releases near centre-left, but never crosses Jaz's short/right
    # approach at the same floor depth; the front players separate vertically.
    firstLabel=(f"{firstId.title()} takes the sample serve" if serve=="they" else f"{firstId.title()} digs the sample attack")
    mainText=(f"{hitter.title()} is the sample hitter; other front athletes remain options."+
       (" High LEFT to Georgia when Caleb received." if r==5 and not harry_touch else ""))
    if serve=="they":
        phases=[
         {"time":0,"label":"Legal start","section":"Receive","cue":f"R{r}: stand in the legal stack. DO NOT move before serve contact."},
         {"time":T["contact"],"label":"Serve hit","section":"Receive","cue":"Their serve: release only AFTER the ball is struck. Call MINE and cover your zone."},
         {"time":T["first"],"label":"First pass","section":"Receive","cue":firstLabel+". Pass HIGH to the marked setting window."},
         {"time":T["second"],"label":"Second contact","section":"Attack","cue":f"{setter.title()} sets. "+mainText},
         {"time":T["hit"],"label":"Our attack","section":"Attack","cue":"Other players cover the hitter, not stand frozen at their old spots."},
         {"time":T["oppReceive"],"label":"Defend now","section":"Defend","cue":"Our ball went over. Return to blocker/short/deep defence before their attack."},
         {"time":T["oppSet"],"label":"Their attack","section":"Defend","cue":f"Opposition attacks toward our {side.upper()}; nearest blocker closes, backs defend their lanes."},
         {"time":T["ready"],"label":"Defence ready","section":"Defend","cue":"Front woman covers short; back three cover deep left/centre/right. Harry defends if back."},
         {"time":T["dig"],"label":"Next dig","section":"Receive","cue":f"{nextId.title()} handles the example return; {nextSetter.title()} takes second contact this time."},
         {"time":T["reset"],"label":"Next set ready","section":"Attack","cue":"This is a REAL defence-to-attack recovery. Set high if a hitter/setting run is late."},
        ]
    else:
        phases=[
         {"time":0,"label":"Legal start","section":"Defend","cue":"Start in legal rotational order; P1 serves behind the endline."},
         {"time":T["contact"],"label":"Serve hit","section":"Defend","cue":"WE serve. Move to defence FIRST; Harry must not abandon his defensive lane."},
         {"time":T["ready"],"label":"Defence ready","section":"Defend","cue":f"Their hitter attacks to our {side.upper()}. Backcourt and blockers take assigned lanes."},
         {"time":T["first"],"label":"Our dig","section":"Receive","cue":firstLabel+". Pass HIGH to the setter target."},
         {"time":T["second"],"label":"Second contact","section":"Attack","cue":f"{setter.title()} sets AFTER our dig. "+mainText},
         {"time":T["hit"],"label":"Our attack","section":"Attack","cue":"Front attackers approach; others cover the hitter."},
         {"time":T["oppReceive2"],"label":"Defend again","section":"Defend","cue":"Get back to blocker/short/deep responsibilities while they receive."},
         {"time":T["oppSet2"],"label":"Their next attack","section":"Defend","cue":f"Opposition attacks to our {side.upper()}; stay in your assigned lane."},
         {"time":T["dig"],"label":"Next dig","section":"Receive","cue":f"{nextId.title()} takes this example ball; {nextSetter.title()} prepares for the next set."},
         {"time":T["reset"],"label":"Next set ready","section":"Attack","cue":"This is defence-to-attack recovery, not a stationary 'Recover' phase."},
        ]
    assert all(phases[i]["time"]<phases[i+1]["time"] for i in range(len(phases)-1))
    assert all(t["time"]<u["time"] for tr in tracks.values() for t,u in zip(tr,tr[1:]))
    notes={
       "opponentAttack":side,
       "firstTouch":"harry" if harry_touch else "normal",
       "fallbackSetter":FALLBACK[r],
       "nextSetter":nextSetter,
       "receiveZones":receivers if serve=="they" else [],
       "coachNote":("Harry took first contact: "+setter.title()+" sets the second ball." if harry_touch else
                    "Normal first contact. If Harry digs, switch to the Harry-first example."),
    }
    return {"rotation":r,"serve":serve,"duration":T["end"],
       "phases":phases,"tracks":tracks,"setterTarget":posdict(target),
       "firstContact":{"player":firstId,"time":T["first"]},
       "secondContact":{"player":setter,"time":T["second"]},
       "ball":ball,"tactics":notes}

scenarios=[]
for r in range(1,7):
    for serve in ("they","us"):
        s=create(r,serve)
        s["alternates"]={
           "right":create(r,serve,"right"),
           "harry":create(r,serve,"left",True),
           "harryRight":create(r,serve,"right",True),
        }
        scenarios.append(s)
PLANS={"schemaVersion":1,"status":"DRAFT","netHeight":2.43,"scenarios":scenarios}
ROOT.mkdir(parents=True,exist_ok=True)
(ROOT/"team.json").write_text(json.dumps(TEAM,indent=2)+"\n")
(ROOT/"rotations.json").write_text(json.dumps(PLANS,indent=2)+"\n")
print("Wrote 12 base and 36 alternate V3 tactical scenarios (DRAFT).")
for s in scenarios[::2]:
    r=s["rotation"];t=TARGET[r];a=COURT[r][order(r).index("harry")+1]
    print(f"R{r}: setter run {math.dist(a,t):.2f}m from {a} to {t}, attack {list(OFFENSE[r])}")
