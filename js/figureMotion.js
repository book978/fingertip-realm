const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
const smooth=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
export function dialogueAt(progress){const p=clamp(progress);return {ancient:smooth(.04,.24,p),modern:smooth(.38,.56,p),echo:smooth(.53,.7,p),crossing:p>.7&&p<.96?Math.sin((p-.7)/.26*Math.PI):0,focus:Math.sin(smooth(.18,.45,p)*Math.PI)*.12,phase:p<.24?'forming':p<.42?'gazing':p<.58?'meeting':p<.74?'responding':p<.96?'crossing':'together'};}
export function figurePresentation(snapshot){const m=snapshot.motion??snapshot,p=snapshot.performance?.status==='playing'?snapshot.performance.progress:m.entrance??1,channels=dialogueAt(p),reply=m.sequence==='respond'?Math.sin(m.sequenceProgress*Math.PI):0,echo=channels.echo*.65*clamp((1-p)/.04);return {...channels,progress:p,reach:Math.max(m.reach||0,echo,reply),crossing:Math.max(channels.crossing,m.crossing||0)};}
export function createFigureMotion({reducedMotion=false}={}){
 let s,last=null,lastCapture=-Infinity,cues=[],elapsed=0;
 function reset(){s={entrance:0,phase:'forming',yaw:0,zoom:1,visitorX:0,reach:0,lightX:0,sequence:null,sequenceProgress:0,crossing:0};last=null;lastCapture=-Infinity;cues=[];elapsed=0;}reset();
 const api={handleInput(f){
  if(!f?.visible){last=null;return;}if(s.sequence)return;
  if(f.source==='camera'){const at=f.capturedAtMs??f.timeMs;if(at<=lastCapture||f.timeMs-at>250||!f.features?.palm)return;lastCapture=at;const {x,y}=f.features.palm;s.visitorX=clamp(x,-1,1)*.65;s.reach=clamp((y+.45)/1.2);s.lightX=clamp(x,-1,1);return;}
  if(f.pressed&&last?.pressed){s.yaw=clamp(s.yaw+(f.x-last.x)*1.4,-.65,.65);s.reach=clamp(s.reach+(f.y-last.y)*1.5);s.lightX=clamp(f.x,-1,1);}last=f;
 },trigger(type){if(type==='visitor-left'||type==='visitor-right'){s.visitorX=clamp(s.visitorX+(type==='visitor-left'?-.15:.15),-.65,.65);return true;}if(type==='skip'){s.entrance=1;s.phase='together';return true;}if(type==='front'){s.yaw=0;s.zoom=1;return true;}if(type==='replay'){s.entrance=0;s.phase='forming';s.sequence=null;elapsed=0;cues.push('figure-arrive');return true;}if(!['respond','exchange','greet'].includes(type)||s.sequence)return false;s.entrance=1;s.phase='together';s.sequence=type==='greet'?'respond':type;s.sequenceProgress=0;elapsed=0;cues.push(s.sequence==='exchange'?'dialogue-merge':'dialogue-reply');return true;},
 tick(now,dt){dt=Math.max(0,Number.isFinite(dt)?dt:0);s.entrance=Math.min(1,s.entrance+dt/(reducedMotion?.8:14));s.phase=dialogueAt(s.entrance).phase;
  if(s.sequence){elapsed+=dt;const duration=reducedMotion?.5:s.sequence==='exchange'?3.8:1.8;s.sequenceProgress=clamp(elapsed/duration);s.crossing=s.sequence==='exchange'?Math.sin(s.sequenceProgress*Math.PI):0;if(s.sequenceProgress===1){s.sequence=null;s.sequenceProgress=s.crossing=0;}}else s.crossing=0;
 },cancelInput(){last=null;lastCapture=-Infinity;},setZoom(v){s.zoom=clamp(v,.85,1.15);return true;},setPose(value){s.reach=clamp(value);return true;},setView(value){s.yaw=clamp(value,-.65,.65);return true;},reset,
 restore(saved){reset();if(saved){s.entrance=1;s.phase='together';s.yaw=clamp(saved.yaw,-.65,.65);s.zoom=clamp(saved.zoom??1,.85,1.15);s.visitorX=clamp(saved.visitorX,-.65,.65);s.reach=clamp(saved.reach);s.lightX=clamp(saved.lightX,-1,1);}},
 settlePerformance(){api.cancelInput();s.entrance=1;s.phase='together';s.sequence=null;s.sequenceProgress=s.crossing=0;cues=[];},getSnapshot(){return structuredClone(s);},drainCues(){const out=cues;cues=[];return out;}};return api;
}
