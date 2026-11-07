const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const defaults=()=>({enabled:false,mode:'normal',explode:0,slice:0,yaw:0,pitch:0,zoom:1,localYaw:0,selected:null,gesture:'等待操作',hold:0});
export function createStructureExperience({reducedMotion=false}={}){
 let s=defaults(),target={explode:0,slice:0,yaw:0,pitch:0,zoom:1,localYaw:0},last=null,anchor=null,openStart=null,pinchStart=null,fistStart=null,history=[],lastCapture=-Infinity,cooldown=-Infinity,latched=false,releaseStart=null,scaleBase=null;
 function clear(){last=null;anchor=null;openStart=pinchStart=fistStart=null;history=[];lastCapture=-Infinity;releaseStart=null;scaleBase=null;s.hold=0;}
 function loss(){const camera=last?.source==='camera';clear();if(s.mode!=='restore'){target.yaw=s.yaw;target.pitch=s.pitch;target.zoom=s.zoom;target.localYaw=s.localYaw;}s.gesture=camera?'手部离开 · 动作已停':'拖动观察 · 也可选择部件';}
 function command(mode){
  if(!s.enabled)return false;
  if(mode==='deselect'){s.selected=null;target.localYaw=0;return true;}
  if(!['normal','rotate','explode','slice','restore'].includes(mode))return false;
  s.mode=mode;target.explode=mode==='explode'?1:0;target.slice=mode==='slice'?1:0;
  if(mode==='slice'){s.selected=null;target.localYaw=0;}
  if(mode==='restore'||mode==='normal'){s.selected=null;target={explode:0,slice:0,yaw:0,pitch:0,zoom:1,localYaw:0};}
  return true;
 }
 function select(id){if(!s.enabled)return;if(s.mode==='restore')s.mode='normal';s.selected=id||null;target.localYaw=0;s.localYaw=0;}
 return {
  setEnabled(on){s=defaults();s.enabled=!!on;target={explode:0,slice:0,yaw:0,pitch:0,zoom:1,localYaw:0};clear();latched=false;cooldown=-Infinity;},command,select,
  cancel(){loss();},
  adjust(axis,value){if(!s.enabled)return;if(axis==='zoom')target.zoom=clamp(target.zoom+value,.8,1.22);if(axis==='yaw')target.yaw=clamp(target.yaw+value,-1.2,1.2);if(axis==='pitch')target.pitch=clamp(target.pitch+value,-.3,.3);if(axis==='localYaw')target.localYaw=clamp(target.localYaw+value,-1,1);},
  input(frame,hit=null){
   if(!s.enabled)return;
   if(!frame?.visible){if(last)loss();return;}
   if(s.mode==='restore'&&frame.source==='camera')return;
   if(last?.source!==frame.source)last=null;
   if(frame.source==='pointer'){
    if(frame.pressed&&!last?.pressed){select(hit);s.gesture=hit?'局部观察 · 拖动旋转':'拖动转动整体';}
    if(frame.pressed&&last?.pressed){if(s.selected)target.localYaw=clamp(target.localYaw+(frame.x-last.x)*4,-1,1);else{target.yaw=clamp(target.yaw+(frame.x-last.x)*3,-1.2,1.2);target.pitch=clamp(target.pitch-(frame.y-last.y),-.3,.3);}}
    last={...frame};return;
   }
   const t=frame.capturedAtMs??frame.timeMs;
   if(!frame.features||!Number.isFinite(t)||frame.timeMs-t>250||frame.timeMs<t){loss();return;}
   if(t<=lastCapture)return;
   if(t-lastCapture>300){anchor=null;openStart=pinchStart=fistStart=null;history=[];}lastCapture=t;
   const f=frame.features,p=f.palm,kind=f.staticGesture;
   if(!p||![p.x,p.y,p.scale].every(Number.isFinite)){loss();return;}
   if(kind!=='open'){if(releaseStart===null)releaseStart=t;if(t-releaseStart>=180)latched=false;}else releaseStart=null;
   s.hold=0;
   if(kind==='fist'){
    openStart=null;anchor=null;history=[];pinchStart=null;fistStart??=t;s.hold=clamp((t-fistStart)/650,0,1);s.gesture='握拳保持 · 复原';
    if(t-fistStart>=650&&t>=cooldown){command('restore');cooldown=t+1300;fistStart=Infinity;}
   }else if(kind==='pinch'){
    fistStart=null;openStart=null;anchor=null;history=[];
    if(pinchStart===null){pinchStart=t;last={...frame,hit};}
    if(t-pinchStart>=140){if(last?.hit!==undefined){select(last.hit);delete last.hit;}if(s.selected&&last)target.localYaw=clamp(target.localYaw+(frame.x-last.x)*3,-1,1);s.gesture=s.selected?'捏合局部 · 移动观察':'捏合指向部件以选择';}else s.gesture='捏合确认中';
   }else if(kind==='open'){
    if(s.mode==='rotate')s.mode='normal';
    fistStart=pinchStart=null;openStart??=t;scaleBase??=Math.max(.03,p.scale);
    history.push({x:p.x,y:p.y,t});history=history.filter(q=>t-q.t<=400);
    const first=history[0],dx=p.x-first.x,dy=p.y-first.y,duration=t-first.t;
    const sweep=duration>=100&&Math.abs(dx)>.4&&Math.abs(dy)<.16&&Math.abs(dx)/duration>.0012&&t-openStart>=150;
    if(sweep&&t>=cooldown){command('slice');cooldown=t+1300;latched=true;anchor=null;history=[];s.gesture='水平快挥 · 横切演示';}
    else{
     if(!anchor||Math.hypot(p.x-anchor.x,p.y-anchor.y)>.055)anchor={x:p.x,y:p.y,t};
     s.hold=latched?0:clamp((t-anchor.t)/1100,0,1);s.gesture=latched?'张掌移动 · 转动观察':'张掌转动 · 停稳 1.1 秒拆解';
     if(!latched&&t-anchor.t>=1100&&t>=cooldown){command('explode');latched=true;cooldown=t+1300;s.gesture='稳定张掌 · 结构展开';}
     if(!sweep){target.yaw=clamp(p.x*1.25,-1.2,1.2);target.pitch=clamp(-p.y*.32,-.3,.3);target.zoom=clamp(1+(p.scale/scaleBase-1)*.35,.8,1.22);}
    }
   }else {anchor=null;openStart=pinchStart=fistStart=null;history=[];s.gesture='张掌 / 握拳 / 捏合';}
   // Keep the initial hit until the pinch has passed the debounce interval.
   last={...frame,...(kind==='pinch'&&t-pinchStart<140?{hit:last?.hit}: {})};
  },
  tick(dt){
   if(!s.enabled)return;dt=clamp(dt||0,0,.1);
   if(s.mode==='rotate'&&!reducedMotion&&!last?.pressed&&!(last?.source==='camera'&&last.features?.staticGesture==='open'))target.yaw+=dt*.16;
   const k=1-Math.exp(-dt*(reducedMotion?18:6));for(const key of Object.keys(target)){s[key]+=(target[key]-s[key])*k;if(Math.abs(target[key]-s[key])<.0001)s[key]=target[key];}
   if(s.mode==='restore'&&s.explode===0&&s.slice===0&&s.yaw===0&&s.pitch===0&&s.zoom===1)s.mode='normal';
  },
  getSnapshot(){return {...s};},
 };
}
