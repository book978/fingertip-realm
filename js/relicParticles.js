import * as THREE from 'three';import {sampleSurface,transformSurface} from './surfaceSampler.js?v=0.4.0';
export function createRelicParticleForm(root,count=12000){
 root.updateWorldMatrix(true,true);const triangles=[],v=new THREE.Vector3();
 root.traverse(o=>{if(!o.isMesh||o.userData.excludeFromParticles)return;const a=o.geometry.attributes.position,index=o.geometry.index;for(let i=0;i<(index?index.count:a.count);i++){const at=index?index.getX(i):i;v.fromBufferAttribute(a,at).applyMatrix4(o.matrixWorld);triangles.push(v.x,v.y,v.z);}});
 const base=sampleSurface(triangles,count),positions=base.slice(),colors=new Float32Array(count*3),center=new THREE.Vector3();
 for(let i=0;i<count;i++){const j=i*3;center.x+=base[j]/count;center.y+=base[j+1]/count;center.z+=base[j+2]/count;const t=Math.abs((Math.sin(i*12.9898)*43758.5453)%1),bright=.5+t*.5;colors[j]=(.32+t*.3)*bright;colors[j+1]=(.48+t*.1)*bright;colors[j+2]=(.31+t*.13)*bright;if(i%7===0){colors[j]=.8;colors[j+1]=.6;colors[j+2]=.27;}}
 return {positions,colors,reproject(matrix){const c=transformSurface(base,matrix.elements);center.set(c.x,c.y,c.z);},rotate(yaw,pitch=0){const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);for(let i=0;i<base.length;i+=3){const x=base[i]-center.x,y=base[i+1]-center.y,z=base[i+2]-center.z,rz=-x*s+z*c;positions[i]=x*c+z*s+center.x;positions[i+1]=y*cp-rz*sp+center.y;positions[i+2]=y*sp+rz*cp+center.z;}}};
}
