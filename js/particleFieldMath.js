/** Stable, interleaved seeds: lowering the draw count preserves all three depth layers. */
export function createFieldSeeds(count,seed=104729){
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const data=new Float32Array(count*4);
 for(let i=0;i<count;i++){const j=i*4;data[j]=random()*2-1;data[j+1]=random()*2-1;data[j+2]=random();data[j+3]=random();}
 return data;
}

/** Free forms fill the view frustum, independent of the DOM's artifact stage rectangle. */
export function writeViewportTargets(out,seeds,{count=out.length/3,mode,time=0,halfW=60,halfH=36,cameraZ=94,handX=0,handY=0}){
 count=Math.min(count,out.length/3,seeds.length/4);
 for(let i=0;i<count;i++){
  const j=i*3,s=i*4,u=seeds[s],v=seeds[s+1],depth=seeds[s+2],phase=seeds[s+3]*Math.PI*2;
  let x,y,z;
  if(mode==='vortex'){
   const level=(v+1)*.5,arm=Math.floor(depth*3),a=level*Math.PI*5+arm*Math.PI*2/3+time*.55;
   const r=halfW*(.1+Math.sin(level*Math.PI*.5)*.48)+u*.8;
   z=Math.sin(a)*Math.min(32,r*.75)+(depth*3-arm-.5)*1.2;
   x=Math.cos(a)*r+handX*.25;y=v*halfH*1.1+Math.sin(phase)*.45+handY*.2;
  }else if(mode==='wave'){
   z=(v+.15)*38;x=u*halfW*1.35;
   y=-halfH*.12+Math.sin(Math.hypot(x-handX,z)*.16-time*1.3)*4.2+Math.cos(x*.1+time*.3)*1.5;
  }else if(mode==='implode'){
   const a=phase+time*.65,r=.2+depth*2.8;
   x=handX+Math.cos(a)*r;y=handY+Math.sin(a)*r;z=(depth-.5)*8;
  }else{
   z=(depth-.5)*74;
   const perspective=(cameraZ-z)/cameraZ;
   x=(u*halfW*1.12+Math.sin(time*.18+v*5+phase)*1.2)*perspective;
   y=(v*halfH*1.12+Math.cos(time*.14+u*4+phase))*perspective;
  }
  out[j]=x;out[j+1]=y;out[j+2]=z;
 }
}

/** A reversible curved departure/return, starting from the last rendered cloud. */
export function blendFormationTargets(target,from,progress,count=target.length/3,reducedMotion=false){
 const p=Math.max(0,Math.min(1,progress));if(p>=1)return;
 const ease=p*p*(3-2*p),arc=reducedMotion?0:Math.sin(Math.PI*p)*.18;
 for(let i=0;i<count*3;i+=3){const dx=target[i]-from[i],dy=target[i+1]-from[i+1],dz=target[i+2]-from[i+2];
  target[i]=from[i]+dx*ease-dy*arc;target[i+1]=from[i+1]+dy*ease+dx*arc;target[i+2]=from[i+2]+dz*ease+Math.sin(i*1.37)*arc*Math.min(20,Math.hypot(dx,dy));
 }
}
