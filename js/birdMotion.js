const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createBirdMotion(){
 let s,target,orbitTime=-1,blink=-1,call=-1,lastCall=-Infinity,callArmed=true,lastCapture=-Infinity,cameraOwned=false,flapBoost=0;
 function reset(){s={flightState:'perched',position:{x:0,y:0,z:0},heading:-.12,bank:0,wingPhase:0,wingStrength:0,beakOpen:0,eyeOpen:1,orbitProgress:0};target={x:0,y:0,z:0};orbitTime=blink=call=-1;cameraOwned=false;lastCapture=-Infinity;callArmed=true;flapBoost=0;}reset();
 function requestCall(now){if(now-lastCall<700)return false;lastCall=now;cues.push('bird-call');call=0;return true;}let cues=[];
 const api={handleInput(f){if(!f?.visible)return;const cap=f.capturedAtMs??f.timeMs;if(f.source==='camera'&&f.timeMs-cap>250)return;
 if(f.source==='camera'&&f.features){cameraOwned=true;lastCapture=cap;s.beakOpen=f.features.aperture;if(s.beakOpen<.35)callArmed=true;if(s.beakOpen>.65&&callArmed){requestCall(f.timeMs);callArmed=false;}}
 if(s.flightState==='hovering'||s.flightState==='taking-off'){target.x=clamp(f.x*.32,-.38,.38);target.y=clamp(.17+f.y*.18,-.12,.42);target.z=clamp(f.x*.08,-.16,.16);}},
 trigger(action,now=0){if(action==='call')return requestCall(now);if(action==='blink'){if(blink>=0)return false;blink=0;return true;}
 if(action==='takeoff'||action==='flap'){if(s.flightState==='perched'||s.flightState==='landing'){s.flightState='taking-off';target={x:0,y:.22,z:0};}flapBoost=1;return true;}
 if(action==='land'){orbitTime=-1;s.orbitProgress=0;s.flightState='landing';target={x:0,y:0,z:0};return true;}
 if(action==='orbit'){s.flightState='orbiting';orbitTime=0;return true;}return false;},
 tick(now,dt){if(cameraOwned&&now-lastCapture>550&&s.flightState!=='perched')api.trigger('land',now);
  if(orbitTime>=0){orbitTime+=dt;const p=Math.min(1,orbitTime/3);s.orbitProgress=p;const a=p*Math.PI*2;target={x:Math.sin(a)*.31,y:.2+Math.sin(a*.5)*.15,z:Math.cos(a)*.13};if(p===1){orbitTime=-1;s.orbitProgress=0;s.flightState='hovering';target={x:0,y:.22,z:0};}}
  const oldX=s.position.x;for(const key of ['x','y','z']){const diff=target[key]-s.position[key];s.position[key]+=clamp(diff*(1-Math.exp(-dt*4)),-dt*.45,dt*.45);}
  if(s.flightState==='taking-off'&&Math.abs(s.position.y-target.y)<.025)s.flightState='hovering';
  if(s.flightState==='landing'&&Math.hypot(...Object.values(s.position))<.012){s.flightState='perched';s.position={x:0,y:0,z:0};blink=0;}
  s.bank+=(clamp(-(s.position.x-oldX)/(dt||1)*.7,-.35,.35)-s.bank)*Math.min(1,dt*6);s.heading+=(clamp(s.position.x*.65,-.45,.45)-s.heading)*Math.min(1,dt*3);
  const flying=s.flightState!=='perched';flapBoost=Math.max(0,flapBoost-dt);s.wingPhase+=dt*(flying?7+flapBoost*5:1.4);s.wingStrength+=((flying?.85:.07)-s.wingStrength)*Math.min(1,dt*7);
  if(blink>=0){blink+=dt;s.eyeOpen=1-Math.sin(Math.min(1,blink/.35)*Math.PI);if(blink>=.35){blink=-1;s.eyeOpen=1;}}
  if(call>=0){call+=dt;s.beakOpen=Math.sin(Math.min(1,call/.6)*Math.PI);if(call>=.6){call=-1;s.beakOpen=0;}}
 },cancelInput(){cameraOwned=false;orbitTime=-1;s.orbitProgress=0;if(s.flightState!=='perched'){s.flightState='hovering';target={...s.position};}s.beakOpen=0;callArmed=false;},
 reset(){reset();cues=[];lastCall=-Infinity;},restore(saved){reset();cues=[];lastCall=-Infinity;if(saved?.position){s.position={x:clamp(saved.position.x||0,-.38,.38),y:clamp(saved.position.y||0,-.12,.42),z:clamp(saved.position.z||0,-.16,.16)};target={...s.position};if(Math.hypot(...Object.values(s.position))>.02)s.flightState='hovering';}},
 getSnapshot(){return structuredClone(s);},drainCues(){const out=cues;cues=[];return out;},settlePerformance(){api.trigger('land');s.position={x:0,y:0,z:0};target={...s.position};s.flightState='perched';s.beakOpen=0;s.eyeOpen=1;orbitTime=blink=call=-1;s.orbitProgress=0;}};return api;
}
