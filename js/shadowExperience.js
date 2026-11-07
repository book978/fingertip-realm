import {createDragSession} from './dragSession.js?v=awakening1';
import {solveTwoBone,SHADOW_RIG} from './shadowKinematics.js?v=awakening1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const initial=()=>({body:{x:0,y:-.1},hands:{left:{x:-.25,y:-.1},right:{x:.25,y:-.1}},facing:1,walkPhase:0});
export function createShadowExperience(){
 const grab=createDragSession();let state,offset,walkDistance,sleeveSince,visible,now=0,actionHold=false;
 const pose=()=>state.poses[state.roleId];
 function reset(){state={roleId:'warrior',backdropId:'moon',poses:{warrior:initial(),dan:initial()},tasks:{walk:false,sleeve:false},complete:false};offset={x:0,y:0};walkDistance=0;sleeveSince=null;visible=false;actionHold=false;grab.cancel();}
 function moveBody(point){const p=pose(),next={x:clamp(point.x,-.65,.65),y:clamp(point.y,-.35,.05)},dx=next.x-p.body.x,dy=next.y-p.body.y;walkDistance+=Math.abs(dx);if(Math.abs(dx)>.004)p.facing=Math.sign(dx);p.walkPhase+=dx*30;p.body=next;for(const hand of Object.values(p.hands)){hand.x+=dx;hand.y+=dy;}if(walkDistance>=.36-1e-8)state.tasks.walk=true;}
 function moveHand(side,point){const p=pose(),o=SHADOW_RIG.shoulders[side],root={x:p.body.x+o.x*p.facing,y:p.body.y+o.y};p.hands[side]=solveTwoBone({root,target:point,upperLength:SHADOW_RIG.upperLength,lowerLength:SHADOW_RIG.lowerLength,bend:side==='left'?-1:1}).end;}
 function tick(t){now=t;grab.tick(t);const p=pose(),raised=Object.values(p.hands).some(h=>h.y>p.body.y+SHADOW_RIG.shoulders.left.y+.015);if((visible||actionHold)&&raised){if(sleeveSince===null)sleeveSince=t;if(t-sleeveSince>=300){state.tasks.sleeve=true;actionHold=false;}}else sleeveSince=null;}
 reset();return {reset,tick,
 cancelInput(){grab.cancel();visible=false;sleeveSince=null;},
 handleInput(s,p){now=s.timeMs;visible=s.visible;const g=grab.step(s,p.handleId);if(!s.visible){sleeveSince=null;return;}if(!Number.isFinite(p.point?.x)||!Number.isFinite(p.point?.y))return;const current=pose(),hand=g.id==='body'?current.body:current.hands[g.id==='left-hand'?'left':'right'];if(g.started)offset={x:hand.x-p.point.x,y:hand.y-p.point.y};if(g.active){const target={x:p.point.x+offset.x,y:p.point.y+offset.y};if(g.id==='body')moveBody(target);else moveHand(g.id==='left-hand'?'left':'right',target);}tick(s.timeMs);},
 setRole(id){if(!state.poses[id])return;grab.cancel();sleeveSince=null;state.roleId=id;},setBackdrop(id){if(['moon','pavilion'].includes(id))state.backdropId=id;},
 perform(action){const p=pose();grab.cancel();if(action==='walk')moveBody({x:p.body.x+(p.body.x>0?-.38:.38),y:p.body.y});if(action==='sleeve'){moveHand('left',{x:p.body.x-.15,y:p.body.y+.55});visible=true;actionHold=true;sleeveSince=now;}},
 finish(){if(!state.tasks.walk||!state.tasks.sleeve)return false;state.complete=true;grab.cancel();return true;},
 restore(s){reset();if(!s?.poses)return;state=structuredClone(s);delete state.grabbedId;delete state.readyToFinish;},
 getSnapshot(){return {...structuredClone(state),grabbedId:grab.id,readyToFinish:state.tasks.walk&&state.tasks.sleeve};}
 };
}
