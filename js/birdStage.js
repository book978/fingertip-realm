import * as THREE from 'three';
import {createStageKit,birdSilhouette} from './stageKit.js?v=awakening1';
export function createBirdStage(options){
 const {environment,reduceMotion}=options,k=createStageKit({...options,spanW:68,spanH:70}),body=new THREE.Group();k.root.add(body);
 const bronze=environment.createBronzeMaterial(),gold=environment.createGoldMaterial(),s=birdSilhouette();
 for(const [x,y,rx,ry,rotation] of [[7,21,.85,.85,0],[-11,17,7,1.1,-.22],[-9,12,5,.95,-.5],[-2,3,4.5,2,-.5],[-6,-5,2.5,1.3,.8],[-13,-17,1,3,-.45]]){const hole=new THREE.Path();hole.absellipse(x,y,rx,ry,0,Math.PI*2,true,rotation);s.holes.push(hole);}
 k.extrude(s,bronze,1.25,body);
 for(let i=0;i<5;i++)k.curve([[-20+i*.5,20-i*1.2,1.6],[-12,20-i*1.5,1.8],[-5+i,14-i*1.3,1.6]],.12,gold,body);
 k.curve([[3,17,1.7],[8,15,2],[13,14,1.7],[21,13.5,1.3]],.18,gold,body);
 for(let i=0;i<4;i++)k.curve([[-10+i*1.2,-7,1.7],[-12+i*.8,-16,1.9],[-18+i*.8,-22,1.6]],.11,gold,body);
 const standMat=new THREE.MeshStandardMaterial({color:0x17251d,roughness:.5,metalness:.55});
 const stand=k.mesh(new THREE.CylinderGeometry(11,13,1.4,64),standMat);stand.position.set(0,-27,0);k.curve([[0,-26,0],[0,-15,0]],.22,gold);
 const points={beak:{x:19,y:14,z:2},wing:{x:-17,y:18,z:2},tail:{x:-15,y:-18,z:2}},markers={};
 for(const [id,p] of Object.entries(points)){const marker=k.mesh(new THREE.RingGeometry(1.05,1.23,48),new THREE.MeshBasicMaterial({color:0xf8d895,transparent:true,opacity:.8,toneMapped:false,depthTest:false}));marker.position.set(p.x,p.y,p.z+2);marker.renderOrder=10;markers[id]=marker;const glow=k.glow(p.x,p.y,p.z+1,4);glow.material.opacity=.35;}
 const light=new THREE.PointLight(0xffdfad,250,70,1.6);light.position.set(-10,14,20);k.root.add(light);
 const ghost=k.extrude(birdSilhouette(),new THREE.MeshBasicMaterial({color:0xd5b36e,transparent:true,opacity:0,depthWrite:false}),.05);ghost.position.z=-3;
 let time=0,completeTime=0,lastComplete=false;
 function applySnapshot(s,dt){time+=dt;body.rotation.y=reduceMotion?.12:.18+Math.sin(time*.3)*.07;
  if(s.light.visible){const p=k.point(s.light);light.position.x+=(p.x-light.position.x)*Math.min(1,dt*9);light.position.y+=(p.y-light.position.y)*Math.min(1,dt*9);}
  for(const [id,m] of Object.entries(markers)){const done=s.observedIds.includes(id);m.material.opacity=done?.95:s.activeHotspotId===id?.8:.36;m.scale.setScalar(done?1.2:1+Math.sin(time*2)*.08);m.material.color.setHex(done?0xf7db91:0xbda36b);}
  if(s.complete&&!lastComplete)completeTime=time;lastComplete=s.complete;const t=time-completeTime;
  ghost.material.opacity=s.complete&&t<4?Math.sin(Math.min(1,t/4)*Math.PI)*.19:0;ghost.position.set(t*8,t*5,-5-t);ghost.rotation.z=-t*.07;ghost.scale.setScalar(1+t*.1);k.root.updateMatrixWorld(true);
 }
 function probe(sample){const pos=k.point(sample),cursor={x:(sample.x+1)*innerWidth/2,y:(1-sample.y)*innerHeight/2};let hotspotId=null;for(const [id,p] of Object.entries(points)){const q=k.project(p);if(Math.hypot(q.x-cursor.x,q.y-cursor.y)<35)hotspotId=id;}return {point:{x:pos.x,y:pos.y},hotspotId};}
 return {...k,particleObject:body,applySnapshot,probe};
}
