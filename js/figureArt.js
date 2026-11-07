import * as THREE from 'three';
import {createRelicModeller} from './relicModelling.js?v=0.4.2';
// Original modelling from published silhouettes: not a photogrammetry scan.
export function createStandingFigure(k){
 const root=new THREE.Group();root.name='standing-bronze-figure';k.root.add(root);const {loft}=createRelicModeller(k),metal=k.bronze;metal.color.setHex(0xc9c5ae);metal.roughness=.78;metal.metalness=.64;metal.envMapIntensity=.8;
 const relief=metal.clone();relief.color.setHex(0xd5cbb0);relief.roughness=.7;const recess=metal.clone();recess.color.setHex(0x687b67);recess.roughness=.94;const hands=[];
 // Four-sided cast pedestal, with curved animal-shaped supports and a pierced waist.
 const base=k.mesh(new THREE.BoxGeometry(13.6,1.35,11.8,2,1,2),metal,root);base.position.y=-24.3;
 for(const x of [-1,1])for(const z of [-1,1]){const p=new THREE.Group();p.position.set(x*4.2,-23.6,z*3.7);root.add(p);k.curve([[0,0,0],[x*.9,1.3,z*.5],[x*.6,3,z*.1],[0,3.7,0]],.63,metal,p);k.ellipsoid([0,2.9,z*.3],[1.16,.78,.9],p);k.curve([[0,3,z*.9],[x*.4,2,z*1.2],[x*.15,1.2,z*1.4]],.28,relief,p);}
 const top=k.mesh(new THREE.BoxGeometry(11,1,9),metal,root);top.position.y=-19.35;
 for(const sign of [-1,1]){k.ellipsoid([sign*1.6,-18.45,.9],[1.05,.62,2.2],root);for(let i=0;i<5;i++)k.ellipsoid([sign*1.6+(i-2)*.38,-18.5,2.78],[.22,.23,.45],root);loft([[-18.2,.65,.68],[-15.6,.7,.72],[-12.4,.83,.84]],root,metal,{segments:40,steps:28}).position.x=sign*1.6;}
 const robe=loft([[-13.5,4.8,2.45],[-12.8,4.95,2.5],[-10,4.55,2.35],[-5,3.8,2.13],[0,3.08,1.88],[4.5,3.24,1.97],[8.7,4.45,2.12],[10.2,4.45,1.85],[11.35,2.2,1.28]],root,metal,{roundness:3.2});
 // Overlapping lapel is a cast surface, not a bright painted V.
 const lapel=new THREE.Shape();lapel.moveTo(-2.1,11.2);lapel.lineTo(2.5,7.7);lapel.lineTo(-1.4,1.4);lapel.lineTo(-2.7,2.4);lapel.lineTo(1.2,7.65);lapel.closePath();k.solid(lapel,.14,root,relief,.06).position.z=2.03;
 k.curve([[-1.55,1.5,2.2],[-1.9,-4,2.35],[-3,-10.5,2.55],[-3.4,-13,2.55]],.085,relief,root);
 for(const y of [-13.15,-12.55,-10.4,-9.85])k.curve([[-4.55,y,2.4],[-2,y-.13,2.61],[0,y-.18,2.65],[2,y-.13,2.61],[4.55,y,2.4]],.07,relief,root);
 // Paired hooked relief panels, a restrained interpretation of the robe's dense motifs.
 for(let row=0;row<5;row++)for(const sign of [-1,1]){const y=6.5-row*3.25,z=2.07+row*.105,x=sign*(2.3+row*.19);k.curve([[x,y,z],[x-sign*.8,y+.55,z+.06],[x-sign*1.02,y+.12,z+.08],[x-sign*.85,y-.55,z+.08],[x-sign*.22,y-.55,z],[x-sign*.22,y-.05,z],[x-sign*.52,y-.05,z]],.075,relief,root);}
 for(const sign of [-1,1])for(let i=0;i<7;i++){const y=-8+i*2.4;k.curve([[sign*3.3,y,-1.6],[sign*3.55,y+.7,0],[sign*3.2,y+1.4,1.7]],.06,relief,root);}
 loft([[10.8,1.45,1.18],[12.2,1.55,1.2],[13.5,1.5,1.14]],root,metal,{segments:48,steps:28});
 loft([[12.8,1.65,1.25],[13.45,2.4,1.45],[15,2.78,1.5],[17.5,2.95,1.51],[19.1,2.9,1.35],[19.65,2.65,1.2]],root,metal,{roundness:3.8,steps:60});
 // Raised brows, long bridge and angular cheeks retain the relic's solemn face.
 for(const sign of [-1,1]){const ear=new THREE.Shape();ear.moveTo(sign*2.75,18.8);ear.bezierCurveTo(sign*3.2,19.4,sign*4.25,19.35,sign*4.35,18.7);ear.lineTo(sign*4.1,14.8);ear.quadraticCurveTo(sign*3.4,14.2,sign*2.75,14.5);ear.closePath();const hole=new THREE.Path();hole.absellipse(sign*3.6,17.25,.34,1.25,0,Math.PI*2,true);ear.holes.push(hole);k.solid(ear,.52,root,metal,.1).position.z=-.25;
  const eye=new THREE.Shape();eye.moveTo(sign*.38,16.7);eye.quadraticCurveTo(sign*1.4,17.4,sign*2.54,16.78);eye.quadraticCurveTo(sign*1.52,16.1,sign*.38,16.7);k.solid(eye,.12,root,recess,.035).position.z=1.58;
  k.curve([[sign*.36,17.15,1.68],[sign*1.3,17.76,1.79],[sign*2.65,17.2,1.6]],.2,metal,root);k.curve([[sign*.5,16.48,1.68],[sign*1.5,16.2,1.77],[sign*2.48,16.58,1.62]],.09,relief,root);
  k.curve([[sign*.85,15.7,1.66],[sign*1.8,15.3,1.56],[sign*2.4,14.6,1.3]],.09,metal,root);
 }
 const noseShape=new THREE.Shape();noseShape.moveTo(-.28,18.1);noseShape.lineTo(.28,18.1);noseShape.lineTo(.64,15);noseShape.quadraticCurveTo(0,14.6,-.64,15);noseShape.closePath();k.solid(noseShape,.92,root,metal,.14).position.z=1.48;
 k.curve([[-1.48,14,1.57],[0,13.84,1.83],[1.48,14,1.57]],.1,recess,root);k.curve([[-1.4,13.7,1.58],[0,13.5,1.83],[1.4,13.7,1.58]],.13,metal,root);
 // A tall flared crown with low cast relief, avoiding the former toy-like zig-zag crown.
 loft([[19.25,2.85,1.32],[19.65,3.04,1.43],[20.2,2.86,1.3],[23,3.25,1.5],[24.2,3.58,1.67],[24.55,3.58,1.67]],root,metal,{roundness:3.4,steps:45});
 for(const y of [19.7,20.25,23.9])k.curve([[-3.2,y,1.57],[0,y+.08,1.77],[3.2,y,1.57]],.08,relief,root);
 for(const sign of [-1,1])k.curve([[sign*.4,21.2,1.5],[sign*1.3,22.6,1.55],[sign*2.2,22.3,1.55],[sign*2.4,21.55,1.55],[sign*1.7,21.4,1.55],[sign*1.5,21.9,1.55]],.1,relief,root);
 for(const sign of [-1,1]){const wristY=sign<0?5:8;
  // Both hands stay genuinely empty; elbows and sleeves remain fixed.
  k.curve([[sign*4.1,9.4,0],[sign*5.5,6,0],[sign*5.55,.8,1.6],[sign*3.5,.9,3.9],[sign*2,wristY-.5,5.1]],.87,metal,root);
  const sleeve=loft([[-3.9,1.02,1.25],[0,1.2,1.5],[3.4,1.42,1.4]],root,metal,{roundness:2.7,segments:48,steps:38});sleeve.position.set(sign*4.7,5.7,.1);sleeve.rotation.z=sign*.15;
  k.curve([[sign*5.9,1.5,2],[sign*5,1.2,2.8],[sign*4.05,1.6,3.45]],.12,relief,root);
  const hand=k.mesh(new THREE.TorusGeometry(1.25,.58,20,64),metal,root);hand.rotation.set(Math.PI/2,0,sign*.12);hand.position.set(sign*2,wristY,5.45);hand.name='empty-grasp-'+(sign<0?'left':'right');hands.push(hand);
  for(let i=0;i<4;i++)k.curve([[sign*2-.95,wristY-.4+i*.23,6.1],[sign*2,wristY-.48+i*.23,6.5],[sign*2+.95,wristY-.4+i*.23,6.1]],.04,recess,root);k.curve([[sign*3.1,wristY-.4,5.1],[sign*3,wristY+.25,6],[sign*2,wristY+.54,6.1]],.35,metal,root);
 }
 return {root,hands};
}
