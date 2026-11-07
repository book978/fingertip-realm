const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function createTreeMotion(){
 let s,bloomTarget=0,growing=false,pulse=-1,lastX=null;
 function reset(){s={growth:.65,bloom:0,wind:0,pulseProgress:0,branchPhase:0};bloomTarget=0;growing=false;pulse=-1;lastX=null;}reset();
 const api={handleInput(f){if(!f?.visible){lastX=null;bloomTarget=s.bloom;return;}if(f.source==='camera'){if(f.timeMs-(f.capturedAtMs??f.timeMs)>250||!f.features){bloomTarget=s.bloom;return;}bloomTarget=clamp(f.features.spread);}
  if(lastX!==null){const dx=f.x-lastX;s.wind=clamp(s.wind+dx*3,-1,1);}lastX=f.x;},
 trigger(action){if(action==='grow'){growing=s.growth<1;pulse=0;return true;}if(action==='bloom'||action==='close'){bloomTarget=action==='bloom'?1:0;return true;}if(action==='pulse'){pulse=0;return true;}if(action==='gust'){s.wind=s.wind>0?-.95:.95;pulse=0;return true;}return false;},
 tick(now,dt){if(growing){s.growth=Math.min(1,s.growth+dt*.35/1.8);if(s.growth===1)growing=false;}s.bloom+=(bloomTarget-s.bloom)*(1-Math.exp(-dt*9));s.wind*=Math.exp(-dt*1.7);s.branchPhase+=dt*1.4;if(pulse>=0){pulse+=dt;s.pulseProgress=Math.min(1,pulse/1.8);if(pulse>=1.8){pulse=-1;s.pulseProgress=0;}}},
 cancelInput(){lastX=null;bloomTarget=s.bloom;},finishEntrance(){s.growth=1;growing=false;},reset,restore(saved){reset();if(saved){s.growth=clamp(saved.growth??.65,.65,1);s.bloom=clamp(saved.bloom??0);bloomTarget=s.bloom;}},getSnapshot(){return {...s};},drainCues(){return [];},settlePerformance(){s.growth=1;s.bloom=bloomTarget=1;s.wind=0;pulse=-1;s.pulseProgress=0;growing=false;}};return api;
}
