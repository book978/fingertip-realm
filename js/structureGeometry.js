// Vertices carry position, normal and UV. Intersections interpolate every attribute.
const mix=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
function clip(poly,y,above){
 if(!Number.isFinite(y))return poly;
 const out=[];for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],insideA=above?a[1]>=y:a[1]<=y,insideB=above?b[1]>=y:b[1]<=y;
  if(insideA)out.push(a);if(insideA!==insideB)out.push(mix(a,b,(y-a[1])/(b[1]-a[1])));
 }return out;
}
export function clipTriangleBand(triangle,min,max){
 const polygon=clip(clip(triangle,min,true),max,false),out=[];
 for(let i=1;i<polygon.length-1;i++)out.push([polygon[0],polygon[i],polygon[i+1]]);return out;
}
export function intersectTriangleY(triangle,y){
 const points=[];
 for(let i=0;i<3;i++){const a=triangle[i],b=triangle[(i+1)%3];if((a[1]<y&&b[1]>=y)||(b[1]<y&&a[1]>=y)){const p=mix(a,b,(y-a[1])/(b[1]-a[1]));if(!points.some(q=>Math.hypot(q[0]-p[0],q[2]-p[2])<1e-7))points.push(p);}}
 return points.length===2?points:[];
}
