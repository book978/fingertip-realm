import * as THREE from 'three';
import {SVGLoader} from '../vendor/SVGLoader-r160.js';
import {sampleSurface} from './surfaceSampler.js?v=awakening1';

function surfaceInLocal(root,relative,count,seed){
 root.updateWorldMatrix(true,true);relative.updateWorldMatrix(true,true);const inverse=relative.matrixWorld.clone().invert(),triangles=[],v=new THREE.Vector3();
 root.traverse(o=>{if(!o.isMesh||o.userData.excludeFromParticles)return;const a=o.geometry.attributes.position,index=o.geometry.index;for(let i=0;i<(index?.count??a.count);i++){v.fromBufferAttribute(a,index?index.getX(i):i).applyMatrix4(o.matrixWorld).applyMatrix4(inverse);triangles.push(v.x,v.y,v.z);}});
 let n=seed;return sampleSurface(triangles,count,{random:()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;}});
}
const smooth=(a,b,p)=>{const t=Math.max(0,Math.min(1,(p-a)/(b-a)));return t*t*(3-2*t);};
function hammeredGold(kit){
 const size=512,canvas=document.createElement('canvas'),heightCanvas=document.createElement('canvas');canvas.width=canvas.height=heightCanvas.width=heightCanvas.height=size;const c=canvas.getContext('2d'),h=heightCanvas.getContext('2d'),image=c.createImageData(size,size),bump=h.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,grain=((Math.imul(x+17,y+97)*13)%101)/101,wrinkle=Math.sin(x*.025+Math.sin(y*.014)*3)*Math.cos(y*.019)*.5+.5,patch=.5+.5*Math.sin(x*.008+y*.009)*Math.sin(y*.011),shine=wrinkle*.45+grain*.2+patch*.35;
  image.data[i]=175+shine*75;image.data[i+1]=122+shine*77;image.data[i+2]=35+shine*54;image.data[i+3]=255;const value=90+wrinkle*85+grain*20;bump.data[i]=bump.data[i+1]=bump.data[i+2]=value;bump.data[i+3]=255;
 }c.putImageData(image,0,0);h.putImageData(bump,0,0);const map=kit.ownTexture(new THREE.CanvasTexture(canvas)),surface=kit.ownTexture(new THREE.CanvasTexture(heightCanvas));map.colorSpace=THREE.SRGBColorSpace;for(const texture of [map,surface]){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1/178,1/178);}return {map,surface};
}
export function createSunBirdStage({kit,birdObject}){
 const root=new THREE.Group(),foil=new THREE.Group();kit.root.add(root);root.add(foil);root.visible=false;const count=1600,positions=new Float32Array(count*3),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const points=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xf5d28c,size:.19,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(points);points.frustumCulled=false;
 let state='loading',disposed=false,source=null,destination=null,spread=0,shapeCount=0,holeCount=0,triangleCount=0;const meshes=[],lines=[],targetPoint=new THREE.Vector3();
 const goldSurface=hammeredGold(kit),material=new THREE.MeshStandardMaterial({color:0xffe9b3,map:goldSurface.map,bumpMap:goldSurface.surface,bumpScale:.09,roughnessMap:goldSurface.surface,metalness:.9,roughness:.6,envMapIntensity:1.3,side:THREE.DoubleSide,transparent:true});
 const edgeMaterial=new THREE.LineBasicMaterial({color:0xffe7a2,transparent:true,opacity:0,depthWrite:false});
 async function load(){
  state='loading';try{const response=await fetch(new URL('../assets/models/sun-bird.svg',import.meta.url));if(!response.ok)throw new Error('金饰轮廓不可用');const text=await response.text();if(disposed)return;
   const data=new SVGLoader().parse(text);for(const path of data.paths)for(const shape of SVGLoader.createShapes(path)){
    shapeCount++;holeCount+=shape.holes.length;const g=new THREE.ExtrudeGeometry(shape,{depth:.55,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:2,curveSegments:24});g.rotateX(Math.PI);g.translate(-88.386,88.386,0);g.scale(.28,.28,.28);const vertices=g.attributes.position;for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i);vertices.setZ(i,vertices.getZ(i)+Math.sin(x*.41+y*.16)*.10+Math.cos(x*1.6)*.035);}g.computeVertexNormals();triangleCount+=g.attributes.position.count/3;
    const mesh=kit.mesh(g,material,foil);meshes.push(mesh);const line=new THREE.LineSegments(new THREE.EdgesGeometry(g,35),edgeMaterial);foil.add(line);lines.push(line);
   }if(!meshes.length)throw new Error('轮廓为空');state='ready';
  }catch{if(!disposed)state='error';}
 }
 const ready=load();
 return {
  get status(){return state;},ready,
  update(s,dt=0){
   const p=s.progress;root.visible=state==='ready'&&p>.00001;if(!root.visible)return;
   foil.position.y=1.5;foil.rotation.set(-.1+s.pitch,.12+s.yaw,Math.sin(p*Math.PI)*.08);
   if(!source){source=surfaceInLocal(birdObject,kit.root,count,904);destination=surfaceInLocal(foil,foil,count,77);}foil.updateMatrix();
   spread+=(Number(s.scattered)-spread)*Math.min(1,dt*4);if(spread<.0001)spread=0;if(spread>.9999)spread=1;
   const t=smooth(.08,.94,p),bend=Math.sin(t*Math.PI),remain=1-t;
   for(let i=0;i<count;i++){const j=i*3,a=i*2.399963,ring=18+(i%19)*.3;
    targetPoint.set(destination[j]+spread*Math.cos(a)*((i%23)+9),destination[j+1]+spread*Math.sin(a)*((i%17)+7),destination[j+2]+spread*Math.sin(a*1.3)*18).applyMatrix4(foil.matrix);
    positions[j]=source[j]*remain*remain+2*remain*t*Math.cos(a)*ring+t*t*targetPoint.x;
    positions[j+1]=source[j+1]*remain*remain+2*remain*t*Math.sin(a)*ring+t*t*targetPoint.y;
    positions[j+2]=source[j+2]*remain*remain+2*remain*t*Math.sin(a*.7)*12+t*t*targetPoint.z+bend*Math.sin(a)*2;
   }geometry.attributes.position.needsUpdate=true;points.material.opacity=Math.max(s.particles*.85,spread*.8);points.visible=points.material.opacity>.001;
   material.opacity=s.gold*(1-spread);material.depthWrite=material.opacity>.7;meshes.forEach(m=>m.visible=material.opacity>.001);edgeMaterial.opacity=s.outline*.8+s.gold*(1-spread)*.10;lines.forEach(l=>l.visible=edgeMaterial.opacity>.001);
   if(s.glint>.01)birdObject.traverse(o=>{if(o.isMesh&&o.material?.emissive)o.material.emissiveIntensity+=s.glint*.25;});
   root.updateWorldMatrix(true,true);
  },
  dispose(){disposed=true;source=destination=null;},
  getDiagnostics(){return {state,shapeCount,holeCount,triangleCount,particleCount:count};},
 };
}
