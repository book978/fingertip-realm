const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createMaskMotion(){
 let s,targetEye=1,eyeUntil=-Infinity,lastDrag=null,clock=0;const timers={blink:-1,ears:-1,greet:-1,morph:-1};
 function reset(){s={yaw:-.14,pitch:-.04,zoom:1,eyeOpen:1,gaze:{x:0,y:0},earAngle:0,greetProgress:0,materialForm:'bronze',morphProgress:0,cycleIndex:0,dragging:false};targetEye=1;lastDrag=null;for(const k in timers)timers[k]=-1;}reset();
 const api={handleInput(f){if(!f?.visible){lastDrag=null;s.dragging=false;targetEye=1;return;}const t=f.capturedAtMs??f.timeMs;if(f.source==='camera'&&f.timeMs-t>250)return;
 if(f.source==='camera'&&f.features){targetEye=f.features.aperture;eyeUntil=f.timeMs+250;s.gaze={x:f.features.index.x,y:f.features.index.y};}
 else{s.gaze={x:f.x,y:f.y};if(f.pressed){if(lastDrag){s.yaw=clamp(s.yaw+(f.x-lastDrag.x)*1.5,-.7,.7);s.pitch=clamp(s.pitch-(f.y-lastDrag.y)*.6,-.25,.25);}lastDrag=f;s.dragging=true;}else{lastDrag=null;s.dragging=false;}}},
 trigger(action){if(action==='front'){s.yaw=-.04;s.pitch=0;return true;}if(action==='morph'){s.cycleIndex=(s.cycleIndex+1)%3;if(s.cycleIndex===1)s.materialForm='gold';else if(s.cycleIndex===2)timers.morph=0;else{s.materialForm='bronze';timers.morph=-1;}return true;}
 if(!(action in timers)||timers[action]>=0)return false;timers[action]=0;return true;},
 tick(now,dt){clock=now;const rate=1-Math.exp(-dt*18);if(now>eyeUntil)targetEye=1;s.eyeOpen+=(targetEye-s.eyeOpen)*rate;
 for(const k in timers)if(timers[k]>=0)timers[k]+=dt;
 if(timers.blink>=0){s.eyeOpen=1-Math.sin(Math.min(1,timers.blink/.38)*Math.PI);if(timers.blink>=.38){timers.blink=-1;s.eyeOpen=1;}}
 s.earAngle=timers.ears>=0?Math.sin(Math.min(1,timers.ears/1.5)*Math.PI)*.35:0;if(timers.ears>=1.5){timers.ears=-1;s.earAngle=0;}
 s.greetProgress=timers.greet>=0?Math.min(1,timers.greet/1.8):0;if(timers.greet>=1.8){timers.greet=-1;s.greetProgress=0;}
 s.morphProgress=timers.morph>=0?Math.min(1,timers.morph/1.6):0;if(timers.morph>=1.6){timers.morph=-1;s.morphProgress=0;}},
 setZoom(v){if(!Number.isFinite(v))return false;s.zoom=clamp(v,.8,1.3);return true;},cancelInput(){lastDrag=null;s.dragging=false;targetEye=1;eyeUntil=-Infinity;},
 reset,restore(saved){reset();if(!saved)return;for(const k of ['yaw','pitch','zoom'])if(Number.isFinite(saved[k]))s[k]=clamp(saved[k],k==='zoom'?.8:k==='yaw'?-.7:-.25,k==='zoom'?1.3:k==='yaw'?.7:.25);s.materialForm=saved.materialForm==='gold'?'gold':'bronze';s.cycleIndex=[0,1,2].includes(saved.cycleIndex)?saved.cycleIndex:0;},
 getSnapshot(){return structuredClone(s);},drainCues(){return [];},settlePerformance(){for(const k in timers)timers[k]=-1;s.eyeOpen=1;s.earAngle=0;s.greetProgress=0;s.morphProgress=0;}};return api;
}
