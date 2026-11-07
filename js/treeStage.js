import * as THREE from 'three';import {createStageKit} from './stageKit.js?v=awakening1';
export function createTreeStage(options){
 const {environment,reduceMotion}=options,k=createStageKit({...options,spanW:68,spanH:70}),bronze=environment.createBronzeMaterial(),gold=environment.createGoldMaterial();const levels=[],glows=[];
 const trunk=[];for(let i=0;i<12;i++)trunk.push([Math.sin(i*.9)*.35,-23+i*4.2,0]);k.curve(trunk,.72,bronze);
 const base=k.mesh(new THREE.CylinderGeometry(6,9,2,9),bronze);base.position.y=-25;
 for(let i=0;i<6;i++){const a=i*Math.PI/3;k.curve([[0,-23,0],[Math.cos(a)*3,-21,Math.sin(a)*3],[Math.cos(a)*7,-24,Math.sin(a)*7]],.5,bronze);}
 function littleBird(parent,x,y,z,a,mat){const b=new THREE.Group(),s=new THREE.Shape();s.moveTo(-1.7,-.2);s.quadraticCurveTo(-2,2,-.6,2.5);s.quadraticCurveTo(-.8,4,1,3.8);s.lineTo(2.8,2.8);s.lineTo(1.3,2.4);s.quadraticCurveTo(1.5,.3,.4,-.3);s.lineTo(-3,-2);s.lineTo(-1.7,-.2);k.extrude(s,mat,.45,b);b.position.set(x,y,z);b.rotation.y=a;parent.add(b);k.curve([[-1,1,.6],[-.3,1.8,.6],[.5,1.2,.6]],.1,gold,b);}
 for(let level=0;level<3;level++){const group=new THREE.Group();k.root.add(group);const material=bronze.clone();levels.push(material);const y=-12+level*12.2;
  for(let branch=0;branch<3;branch++){const a=branch*Math.PI*2/3+.2,dx=Math.cos(a),dz=Math.sin(a)*.65,len=17-level*.8;
   const path=[[0,y,0],[dx*5,y+1,dz*5],[dx*11,y+5,dz*11],[dx*len,y+6,dz*len]];
   k.curve(path,.38,material,group);k.curve(path.map(p=>[p[0],p[1]-.4,p[2]+.15]),.09,gold,group);
   const x=dx*len,z=dz*len;k.curve([[x,y+6,z],[x+dx*1.5,y+9,z+dz*1.5]],.23,material,group);littleBird(group,x+dx*1.5,y+9,z+dz*1.5,-a+.4,material);
   const fruit=k.mesh(new THREE.SphereGeometry(1.1,16,12),material,group);fruit.scale.y=1.5;fruit.position.set(dx*(len-3),y+3,dz*(len-3));k.curve([[dx*(len-4),y+5,dz*(len-4)],[dx*(len-3),y+3,dz*(len-3)]],.13,gold,group);
   const glow=k.glow(x+dx*1.5,y+11,z+1,5);glow.userData.level=level;glows.push(glow);
  }
 }
 // A curling bronze form winds around the trunk without obscuring its three levels.
 const dragon=[];for(let i=0;i<50;i++){const t=i/49;dragon.push([Math.cos(t*8)*2.4,-22+t*37,Math.sin(t*8)*2.4]);}k.curve(dragon,.24,gold);
 const pts=Array.from({length:101},(_,i)=>new THREE.Vector3(0,-22+i*.45,1));const beamGeo=new THREE.BufferGeometry().setFromPoints(pts),beamMat=new THREE.LineBasicMaterial({color:0xfbd68b,transparent:true,opacity:.9,toneMapped:false}),beam=new THREE.Line(beamGeo,beamMat);k.root.add(beam);
 const ember=k.mesh(new THREE.SphereGeometry(.7,24,16),new THREE.MeshBasicMaterial({color:0xffe3a4,toneMapped:false}));ember.userData.excludeFromParticles=true;const halo=k.glow(0,-22,3,7);
 let time=0;
 function applySnapshot(s,dt){time+=dt;ember.position.set(0,s.ember.y,3);halo.position.copy(ember.position);halo.scale.setScalar(s.grabbedId?8:6.3+Math.sin(time*2)*.5);beamGeo.setDrawRange(0,Math.max(1,Math.round(s.progress*100)+1));levels.forEach((m,i)=>{m.emissive.setHex(0x9d752d);m.emissiveIntensity=s.litLevels>i?.2:.005;});for(const g of glows)g.material.opacity=s.litLevels>g.userData.level?.65+Math.sin(time*1.2+g.userData.level)*.15:0;if(reduceMotion)halo.scale.setScalar(6);k.root.updateMatrixWorld(true);}
 function probe(s){const p=k.point(s),q=k.project(ember.position),px=(s.x+1)*innerWidth/2,py=(1-s.y)*innerHeight/2;return{point:{x:p.x,y:p.y},handleId:Math.hypot(q.x-px,q.y-py)<30?'ember':null};}
 return {...k,applySnapshot,probe};
}
