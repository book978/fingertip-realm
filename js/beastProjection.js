const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=(v,f)=>Number.isFinite(v)?v:f;
export function projectShadowPoint(point,light,screenZ=-8){
 const screen=finite(screenZ,-8),lz=clamp(finite(light?.z,20),12,28),lx=finite(light?.x,0),ly=finite(light?.y,3),z=clamp(finite(point?.z,0),0,Math.min(10,lz-2));
 const magnification=clamp((lz-screen)/(lz-z),1,4);return {x:lx+(finite(point?.x,0)-lx)*magnification,y:ly+(finite(point?.y,0)-ly)*magnification,magnification,softness:clamp((z-screen)/18,0,1)};
}
