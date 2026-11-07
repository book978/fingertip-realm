const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),freshPose=()=>({body:{x:0,y:-.18},headAngle:0,tailAngle:0,legPhase:0,eyeOpen:1,mouthOpen:0});
export function createBeastMotion(){
 let s,armed=true,lastPressed=false,drag=null,lastX=0,roll=null,scaleBase=null,depthBase=3,lostAt=null;const timers={greet:-1,blink:-1,mouth:-1,tail:-1};
 function reset(){s={roleId:'great-beast',backdropId:'tree-court',controlMode:'puppet',poses:{'great-beast':freshPose(),'tiger-dragon':freshPose()},light:{x:-9,y:12,z:20},depth:3,grabbedId:null,greetProgress:0,tailProgress:0};armed=true;lastPressed=false;drag=null;roll=scaleBase=null;lostAt=null;for(const k in timers)timers[k]=-1;}reset();
 const pose=()=>s.poses[s.roleId];
 const api={handleInput(f,probe={}){
  if(!f?.visible||f.source==='camera'&&f.timeMs-(f.capturedAtMs??f.timeMs)>250){lostAt??=f?.timeMs??0;return;}lostAt=null;
  const p=pose();if(f.source==='camera'&&f.features){const h=f.features;if(!armed){if(!f.pressed&&f.armAllowed!==false)armed=true;else return;}
   if(s.controlMode==='light'){s.light.x=clamp(h.palm.x*16,-18,18);s.light.y=clamp(7+h.palm.y*12,-4,20);if(h.palm.facing>=.55){if(scaleBase===null){scaleBase=h.palm.scale;depthBase=s.depth;}if(scaleBase>.01)s.depth=clamp(depthBase+(h.palm.scale/scaleBase-1)*5,0,10);}}
   else{if(h.spread>.65){p.body.x=clamp(h.palm.x*.48,-.48,.48);p.body.y=clamp(-.1+h.palm.y*.2,-.3,.1);}p.headAngle=clamp((h.index.curl-.15)*.7,-.45,.45);if(roll===null)roll=h.palm.roll;else{const d=Math.atan2(Math.sin(h.palm.roll-roll),Math.cos(h.palm.roll-roll));p.tailAngle=clamp(p.tailAngle+d*.8,-.7,.7);roll=h.palm.roll;}}p.legPhase+=Math.abs(p.body.x-lastX)*18;lastX=p.body.x;return;
  }
  if(!f.pressed){armed=true;lastPressed=false;s.grabbedId=null;drag=null;return;}
  if(!armed)return;
  if(!lastPressed&&probe.handleId){s.grabbedId=probe.handleId;drag={point:{...probe.point},body:{...p.body},head:p.headAngle,tail:p.tailAngle,light:{...s.light}};}
  if(drag&&probe.point){const dx=probe.point.x-drag.point.x,dy=probe.point.y-drag.point.y;
   if(s.grabbedId==='body'){p.body.x=clamp(drag.body.x+dx/50,-.48,.48);p.body.y=clamp(drag.body.y+dy/40,-.3,.1);p.legPhase+=Math.abs(p.body.x-lastX)*18;lastX=p.body.x;}
   if(s.grabbedId==='head')p.headAngle=clamp(drag.head+dy*.045+dx*.02,-.45,.45);
   if(s.grabbedId==='tail')p.tailAngle=clamp(drag.tail+dy*.045-dx*.02,-.7,.7);
   if(s.grabbedId==='light'){s.light.x=clamp(drag.light.x+dx,-18,18);s.light.y=clamp(drag.light.y+dy,-4,20);}}
  lastPressed=true;
 },trigger(action){if(!(action in timers)||timers[action]>=0)return false;timers[action]=0;return true;},
 tick(now,dt){if(lostAt!==null&&now-lostAt>=300)api.cancelInput();const p=pose();for(const k in timers)if(timers[k]>=0)timers[k]+=dt;
  if(timers.blink>=0){p.eyeOpen=1-Math.sin(Math.min(1,timers.blink/.4)*Math.PI);if(timers.blink>=.4){timers.blink=-1;p.eyeOpen=1;}}
  if(timers.mouth>=0){p.mouthOpen=Math.sin(Math.min(1,timers.mouth/.9)*Math.PI);if(timers.mouth>=.9){timers.mouth=-1;p.mouthOpen=0;}}
  s.greetProgress=timers.greet>=0?Math.min(1,timers.greet/1.8):0;if(timers.greet>=1.8){timers.greet=-1;s.greetProgress=0;}
  s.tailProgress=timers.tail>=0?Math.min(1,timers.tail/1.5):0;if(timers.tail>=1.5){timers.tail=-1;s.tailProgress=0;}
 },cancelInput(){armed=false;lastPressed=false;drag=null;s.grabbedId=null;roll=scaleBase=null;lostAt=null;},
 setRole(id){if(!s.poses[id])return false;api.cancelInput();s.roleId=id;for(const k in timers)timers[k]=-1;s.greetProgress=s.tailProgress=0;pose().eyeOpen=1;pose().mouthOpen=0;return true;},
 setBackdrop(id){if(!['tree-court','ancient-city'].includes(id))return false;s.backdropId=id;return true;},setControlMode(mode){if(!['puppet','light'].includes(mode))return false;api.cancelInput();s.controlMode=mode;return true;},setDepth(value){if(!Number.isFinite(value))return false;s.depth=clamp(value,0,10);scaleBase=null;return true;},
 reset,restore(saved){reset();if(!saved)return;for(const id in s.poses){const a=saved.poses?.[id];if(!a)continue;s.poses[id]={...freshPose(),body:{x:clamp(a.body?.x||0,-.48,.48),y:clamp(a.body?.y||0,-.3,.1)},headAngle:clamp(a.headAngle||0,-.45,.45),tailAngle:clamp(a.tailAngle||0,-.7,.7),legPhase:a.legPhase||0};}if(saved.roleId in s.poses)s.roleId=saved.roleId;if(['tree-court','ancient-city'].includes(saved.backdropId))s.backdropId=saved.backdropId;if(saved.light)for(const key of ['x','y','z'])if(Number.isFinite(saved.light[key]))s.light[key]=saved.light[key];s.depth=clamp(saved.depth??3,0,10);s.controlMode=saved.controlMode==='light'?'light':'puppet';api.cancelInput();},
 getSnapshot(){return structuredClone(s);},drainCues(){return [];},settlePerformance(){api.cancelInput();for(const k in timers)timers[k]=-1;s.greetProgress=s.tailProgress=0;pose().eyeOpen=1;pose().mouthOpen=0;}};return api;
}
