export const MAX_PROTECTED_RECTS=12;
export function normalizeProtectedRects(rects,width,height,padding=8){
 if(width<=0||height<=0)return [];
 const result=[];
 for(const r of rects){
  if(![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.width<=0||r.height<=0)continue;
  const x0=Math.max(0,r.x-padding),y0=Math.max(0,r.y-padding),x1=Math.min(width,r.x+r.width+padding),y1=Math.min(height,r.y+r.height+padding);
  if(x1<=x0||y1<=y0)continue;
  result.push([x0/width,1-y1/height,x1/width,1-y0/height]);if(result.length===MAX_PROTECTED_RECTS)break;
 }
 return result;
}

// Both renderers receive the same DOM-derived screen-space exclusions.
export const particleSafetyGLSL=/* glsl */`
 uniform vec4 uProtected[12];
 uniform float uProtectedCount;
 uniform vec2 uResolution;
 float readableArea(vec2 uv){
  float visibility=1.0;
  for(int i=0;i<12;i++){
   if(float(i)>=uProtectedCount)break;
   vec4 r=uProtected[i];
   vec2 d=max(max(r.xy-uv,uv-r.zw),vec2(0.0))*uResolution;
   visibility*=smoothstep(0.0,22.0,length(d));
  }
  return visibility;
 }
`;
