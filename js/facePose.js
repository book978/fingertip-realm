const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const length=v=>Math.hypot(...v),sub=(a,b)=>a.map((n,i)=>n-b[i]);
export function measureFace(landmarks,{width=640,height=480}={}){
 const ids=[1,10,33,152,234,263,454];if(!landmarks||!ids.every(i=>[landmarks[i]?.x,landmarks[i]?.y,landmarks[i]?.z].every(Number.isFinite))||width<=0||height<=0)return null;
 const xyz=i=>[landmarks[i].x*width,-landmarks[i].y*height,-landmarks[i].z*width],left=xyz(234),right=xyz(454),across=sub(right,left),faceWidth=length(across);
 if(faceWidth<width*.07||faceWidth>width*.95)return null;
 const eyeLeft=xyz(33),eyeRight=xyz(263),eye=sub(eyeRight,eyeLeft),vertical=sub(xyz(10),xyz(152));
 return {x:(eyeLeft[0]+eyeRight[0])/2-width/2,y:(eyeLeft[1]+eyeRight[1])/2+height/2,scale:faceWidth*1.1/32,
  yaw:clamp(Math.atan2(-across[2],across[0]),-.85,.85),pitch:clamp(Math.atan2(vertical[2],vertical[1]),-.5,.5),roll:clamp(Math.atan2(eye[1],eye[0]),-.6,.6)};
}
export function createFacePose(){
 const fresh=()=>({x:0,y:0,scale:1,yaw:0,pitch:0,roll:0,opacity:0,visible:false});let s=fresh(),target=null,last=-Infinity;
 return {
  accept(landmarks,timestamp,size){if(!Number.isFinite(timestamp)||timestamp<=last)return false;const measured=measureFace(landmarks,size);if(!measured){target=null;return false;}if(!target&&s.opacity===0)Object.assign(s,measured);target=measured;last=timestamp;return true;},
  tick(now,dt){const active=!!target&&now-last<=300,k=1-Math.exp(-Math.max(0,Math.min(.1,dt))*10);if(active)for(const key of Object.keys(target))s[key]+=(target[key]-s[key])*k;s.opacity+=((active?1:0)-s.opacity)*k;if(s.opacity<.001)s.opacity=0;s.visible=s.opacity>.01;},
  reset(){s=fresh();target=null;last=-Infinity;},getSnapshot(){return {...s};},
 };
}
