const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const vector=(a,b)=>[b.x-a.x,b.y-a.y,(b.z??0)-(a.z??0)];
const length=a=>Math.hypot(...a);
function joint(a,b,c){const u=vector(b,a),v=vector(b,c);return Math.acos(clamp(u.reduce((s,n,i)=>s+n*v[i],0)/(length(u)*length(v)||1),-1,1));}
export function extractHandFeatures(lm,{pressed=false}={}){
 if(lm?.length!==21||!lm.every(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&(p.z===undefined||Number.isFinite(p.z))))return null;
 const across=vector(lm[5],lm[17]),scale=length(across);if(scale<.015)return null;
 const curls=[1,5,9,13,17].map(base=>clamp(((Math.PI-joint(lm[base],lm[base+1],lm[base+2]))+(Math.PI-joint(lm[base+1],lm[base+2],lm[base+3])))/Math.PI));
 const extended=curls.slice(1).map(c=>c<.45),count=extended.filter(Boolean).length;
 const staticGesture=count===0?'fist':pressed?'pinch':count===4?'open':extended[0]&&extended[1]&&count===2?'peace':extended[0]&&count===1?'point':'default';
 const along=vector(lm[0],lm[9]),cross=[across[1]*along[2]-across[2]*along[1],across[2]*along[0]-across[0]*along[2],across[0]*along[1]-across[1]*along[0]];
 const center=[0,5,9,13,17].reduce((p,i)=>({x:p.x+lm[i].x/5,y:p.y+lm[i].y/5}),{x:0,y:0});
 return {palm:{x:1-2*center.x,y:1-2*center.y,scale,roll:Math.atan2(-across[1],-across[0]),facing:Math.abs(cross[2])/(length(cross)||1)},
 index:{x:clamp(1-2*lm[8].x,-1,1),y:clamp(1-2*lm[8].y,-1,1),curl:curls[1]},
 aperture:clamp((length(vector(lm[4],lm[8]))/scale-.18)/1.4),spread:1-curls.slice(1).reduce((a,b)=>a+b,0)/4,staticGesture};
}
