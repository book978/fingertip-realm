export const SHADOW_RIG={shoulders:{left:{x:-.12,y:.2},right:{x:.12,y:.2}},upperLength:.22,lowerLength:.2};
export function solveTwoBone({root,target,upperLength:a,lowerLength:b,bend=1}){
 const dx=target.x-root.x,dy=target.y-root.y,raw=Math.hypot(dx,dy),d=Math.min(a+b-1e-7,Math.max(Math.abs(a-b)+1e-7,raw));
 const angle=raw>1e-8?Math.atan2(dy,dx):Math.PI/2,cos=Math.max(-1,Math.min(1,(a*a+d*d-b*b)/(2*a*d))),elbow=angle+Math.acos(cos)*bend;
 return {joint:{x:root.x+Math.cos(elbow)*a,y:root.y+Math.sin(elbow)*a},end:{x:root.x+Math.cos(angle)*d,y:root.y+Math.sin(angle)*d}};
}
