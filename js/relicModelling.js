import * as THREE from 'three';
export function createRelicModeller(k){
 function loft(rows,parent,material=k.bronze,{segments=64,steps=80,roundness=2}={}){
  const radius=new THREE.CatmullRomCurve3(rows.map(r=>new THREE.Vector3(r[1],r[0],r[2]))),center=new THREE.CatmullRomCurve3(rows.map(r=>new THREE.Vector3(r[3]||0,r[0],r[4]||0))),vertices=[],uv=[],indices=[];
  const power=v=>Math.sign(v)*Math.pow(Math.abs(v),2/roundness);
  for(let j=0;j<=steps;j++){const t=j/steps,r=radius.getPoint(t),c=center.getPoint(t);for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;vertices.push(c.x+power(Math.cos(a))*r.x,r.y,c.z+power(Math.sin(a))*r.z);uv.push(i/segments,t);}}
  for(let j=0;j<steps;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return k.mesh(geometry,material,parent);
 }
 // A swept metal feather has a true open center, rounded cast edges and depth.
 function plume(points,width,parent,material=k.bronze,depth=.65){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,y])=>new THREE.Vector3(x,y,0))),left=[],right=[];
  for(let i=0;i<=60;i++){const t=i/60,p=curve.getPoint(t),d=curve.getTangent(t),w=width*(.42+.58*Math.sin(t*Math.PI));left.push(new THREE.Vector2(p.x-d.y*w,p.y+d.x*w));right.push(new THREE.Vector2(p.x+d.y*w,p.y-d.x*w));}
  const shape=new THREE.Shape([...left,...right.reverse()]);const inner=[];for(let i=8;i<54;i++){const t=i/60,p=curve.getPoint(t),d=curve.getTangent(t),w=width*.34*Math.sin((i-8)/46*Math.PI);inner.push(new THREE.Vector2(p.x-d.y*w,p.y+d.x*w));}for(let i=53;i>=8;i--){const t=i/60,p=curve.getPoint(t),d=curve.getTangent(t),w=width*.34*Math.sin((i-8)/46*Math.PI);inner.push(new THREE.Vector2(p.x+d.y*w,p.y-d.x*w));}shape.holes.push(new THREE.Path(inner));return k.solid(shape,depth,parent,material,.13);
 }
 return {loft,plume};
}
