const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function createMotionGestureRecognizer({staleMs=250,cooldownMs=700}={}){
 let trace=[],lastCapture=-Infinity,lastSource=null,enabledKey='',baseRoll=null,unwrapped=0,lastRoll=0,flipSince=null,flipArmed=true;
 const fired={};
 function clear(){trace=[];lastCapture=-Infinity;lastSource=null;baseRoll=null;flipSince=null;flipArmed=true;}
 function swing(axis,{windowMs=1200,minRange=.44,leg=.22}={}){
  const pts=trace.filter(p=>p.t>=trace.at(-1).t-windowMs);let extreme=pts[0]?.[axis],direction=0,reversals=0;
  const other=axis==='x'?'y':'x',range=k=>Math.max(...pts.map(p=>p[k]))-Math.min(...pts.map(p=>p[k]));
  if(pts.length<4||range(axis)<minRange)return false;
  if(axis==='roll'){if(pts.some(p=>p.spread<.55))return false;}
  else if(range(axis)<range(other)*1.6)return false;
  for(const p of pts){const delta=p[axis]-extreme;
   if(!direction){if(Math.abs(delta)>=leg){direction=Math.sign(delta);extreme=p[axis];}}
   else if(Math.sign(delta)===direction)extreme=p[axis];
   else if(Math.abs(delta)>=leg){reversals++;direction=-direction;extreme=p[axis];}
  }return reversals>=2;
 }
 function circle(){
  if(trace.length<8)return false;
  const xs=trace.map(p=>p.ix),ys=trace.map(p=>p.iy),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  const rs=trace.map(p=>Math.hypot(p.ix-cx,p.iy-cy)),r=rs.reduce((a,b)=>a+b,0)/rs.length;
  if(r<.07||r>.35||Math.sqrt(rs.reduce((a,b)=>a+(b-r)**2,0)/rs.length)/r>.45)return false;
  if(Math.hypot(xs[0]-xs.at(-1),ys[0]-ys.at(-1))>r*.8)return false;
  let turn=0,total=0;for(let i=1;i<trace.length;i++){const d=angleDelta(Math.atan2(ys[i]-cy,xs[i]-cx),Math.atan2(ys[i-1]-cy,xs[i-1]-cx));turn+=d;total+=Math.abs(d);}
  return Math.abs(turn)>=Math.PI*1.5&&Math.abs(turn)>total*.85;
 }
 return {clear,update(frame,{enabledTypes=[]}={}){
  const t=frame?.capturedAtMs??frame?.timeMs,now=frame?.timeMs,f=frame?.features;
  const key=enabledTypes.join('|');if(key!==enabledKey){clear();enabledKey=key;}
  if(!frame?.visible||frame.source!=='camera'||!f||!Number.isFinite(t)||!Number.isFinite(now)||now-t>staleMs){clear();return {events:[],continuous:null,valid:false};}
  const continuous=f;
  if(t===lastCapture)return {events:[],continuous,valid:true};
  if(t<lastCapture||t-lastCapture>300||lastSource!==frame.source)clear();
  lastCapture=t;lastSource=frame.source;
  if(baseRoll===null){baseRoll=f.palm.roll;lastRoll=f.palm.roll;unwrapped=baseRoll;}
  else{unwrapped+=angleDelta(f.palm.roll,lastRoll);lastRoll=f.palm.roll;}
  const p={x:f.palm.x,y:f.palm.y,ix:f.index.x,iy:f.index.y,roll:unwrapped,t,spread:f.spread};trace.push(p);trace=trace.filter(v=>t-v.t<=1800);
  const events=[],eligible=type=>enabledTypes.includes(type)&&t-(fired[type]??-Infinity)>=cooldownMs;
  function emit(type){if(eligible(type)){events.push({type,timeMs:t});fired[type]=t;return true;}return false;}
  const roll=Math.abs(unwrapped-baseRoll);
  if(roll<.55){flipArmed=true;flipSince=null;}
  if(flipArmed&&roll>=1.35){flipSince??=t;if(t-flipSince>=180&&emit('flip')){flipArmed=false;flipSince=null;}}else if(roll<1.35)flipSince=null;
  for(const type of ['wave','flap','circle','sweep','lift','land']){
   if(!eligible(type))continue;let yes=false;
   // A greeting can translate the palm or rock the open hand at the wrist.
   // Keep two deliberate direction changes so jitter and single sweeps stay quiet.
   if(type==='wave')yes=swing('x',{windowMs:1800,minRange:.24,leg:.12})||swing('roll',{windowMs:1800,minRange:.6,leg:.3});
   if(type==='flap')yes=swing('y');
   if(type==='circle')yes=circle();
   if(type==='sweep'||type==='lift')yes=trace.some(a=>{const dt=t-a.t,dx=p.x-a.x,dy=p.y-a.y;return type==='sweep'?dt>=200&&dt<=900&&Math.abs(dx)>=.32&&Math.abs(dx)>=Math.abs(dy)*1.6:dt>=350&&dt<=1500&&dy>=.25&&f.spread>.65&&a.spread>.65;});
   if(type==='land'){
    const anchor=trace.findLast(v=>t-v.t>=250-1e-5),low=anchor?trace.filter(v=>v.t>=anchor.t):[],stable=low.length>1&&Math.max(...low.map(v=>v.y))-Math.min(...low.map(v=>v.y))<.03;
    yes=stable&&trace.some(a=>t-a.t>=600&&t-a.t<=1600&&a.y-p.y>=.22);
   }
   if(yes&&emit(type)){trace=[p];break;}
  }
  return {events,continuous,valid:true};
 }};
}
