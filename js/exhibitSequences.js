const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
export function birdTransformationAt(p){p=clamp(p);return {bronze:1-smooth(.2,.52,p),gold:smooth(.62,.96,p),particles:p===0||p===1?0:Math.sin(p*Math.PI),ring:smooth(.12,.4,p)*(1-smooth(.72,.97,p)),outline:smooth(.38,.6,p)*(1-smooth(.78,1,p)),glint:p===0||p>=.38?0:Math.sin(Math.PI*smooth(0,.38,p))};}
export function createBirdTransformation({reducedMotion=false}={}){
 let p=0,target=0,yaw=0,pitch=0,scattered=false,last=null,lastCapture=-Infinity,candidate=null,since=0,anchor=null;
 return {
  setForm(form){target=form==='gold'?1:0;last=null;candidate=anchor=null;lastCapture=-Infinity;scattered=false;},
  tick(dt){p+=Math.sign(target-p)*Math.min(Math.abs(target-p),Math.max(0,dt)/(reducedMotion?.45:5.2));},
  input(f){if(p<.98||target!==1)return;if(!f?.visible){last=null;candidate=anchor=null;return;}
   if(f.source==='camera'){
    const t=f.capturedAtMs??f.timeMs;if(t<=lastCapture||f.timeMs-t>250||!f.features)return;if(t-lastCapture>300)candidate=anchor=null;lastCapture=t;const palm=f.features.palm;yaw=clamp(palm.x*.8,-.9,.9);pitch=clamp(-palm.y*.35,-.4,.4);const kind=f.features.staticGesture;
    if(kind!==candidate||(anchor&&Math.hypot(palm.x-anchor.x,palm.y-anchor.y)>.06)){candidate=kind;since=t;anchor={x:palm.x,y:palm.y};}
    if(kind==='open'&&t-since>=500)scattered=true;else if(kind==='fist'&&t-since>=350)scattered=false;
   }else if(f.pressed&&last?.pressed){yaw=clamp(yaw+(f.x-last.x)*2,-1,1);pitch=clamp(pitch-(f.y-last.y),-.5,.5);}last=f;
  },
  cancelInput(){last=null;lastCapture=-Infinity;candidate=anchor=null;},scatter(on){scattered=!!on;},
  reset(){p=target=yaw=pitch=0;scattered=false;last=null;lastCapture=-Infinity;candidate=anchor=null;},
  getSnapshot(){return {progress:p,target,form:p===0?'bronze':p===1?'gold':'transforming',yaw,pitch,scattered,...birdTransformationAt(p)};},
 };
}
export function treeEntranceAt(progress){
 const p=clamp(progress),branches=[0,1,2].map(i=>smooth(.32+i*.065,.47+i*.065,p)),birds=Array.from({length:9},(_,i)=>smooth(.43+i*.015,.49+i*.015,p));
 return {base:smooth(0,.12,p),trunk:smooth(.1,.36,p),branches,birds,yaw:p<.58?-.25*(1-smooth(.1,.58,p)):p>=.81?0:Math.sin(smooth(.58,.81,p)*Math.PI*2)*.36,light:smooth(.78,.94,p),phase:p<.12?'base':p<.34?'trunk':p<.59?'branches':p<.8?'orbit':'light'};
}
function createEntrance(evaluate,duration,{reducedMotion=false}={}){
 let status='idle',p=1;
 return {start(){status='playing';p=0;},tick(dt){if(status!=='playing')return;p=Math.min(1,p+Math.max(0,dt)/(reducedMotion?.8:duration));if(p===1)status='done';},skip(){p=1;status='done';},cancel(){status='idle';p=1;},getSnapshot(){return {status,progress:p,...evaluate(p)};}};
}
export function createTreeEntrance(options){return createEntrance(treeEntranceAt,10.2,options);}
export function birdEntranceAt(p){p=clamp(p);return {support:smooth(0,.13,p),head:smooth(.10,.30,p),body:smooth(.24,.43,p),wings:[smooth(.35,.57,p),smooth(.43,.65,p)],tail:smooth(.56,.78,p),yaw:p===0||p===1?0:Math.sin(p*Math.PI)*.28,light:p===0||p===1?0:Math.sin(p*Math.PI),phase:p<.13?'base':p<.25?'head':p<.4?'body':p<.6?'wings':p<.8?'tail':'orbit'};}
export function createBirdEntrance(options){return createEntrance(birdEntranceAt,5.5,options);}
