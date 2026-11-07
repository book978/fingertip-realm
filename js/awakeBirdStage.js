import {createBronzeBird} from './birdArt.js?v=0.4.2';
import * as THREE from 'three';import {createSculptureKit} from './sculptureKit.js?v=awakening1';
import {createStructureRig,structurePart} from './structureRig.js?v=structure2';
import {createSunBirdStage} from './sunBirdStage.js?v=journey3';
export function createAwakeBirdStage(options){
 const k=createSculptureKit({...options,spanW:66,spanH:56}),object=new THREE.Group();k.root.add(object);const {wings,eyes,tails,feet,head,jaw,tail,perch}=createBronzeBird(k,object);
 const featherLights=Array.from({length:14},(_,i)=>{const s=k.glow(0,0,0,1.5,'#dfbd79');s.visible=false;s.userData.excludeFromParticles=true;return s;});
 const halo=k.ring([0,0,-10],26,.07,k.root,new THREE.MeshBasicMaterial({color:0xc4a96e,transparent:true,opacity:0}));halo.userData.excludeFromParticles=true;
 const excluded=[...wings.map(w=>w.shoulder),...feet,tail],bodyNodes=object.children.filter(n=>!excluded.includes(n));
 const structure=createStructureRig({kit:k,camera:options.camera,objects:[object,perch],parts:[structurePart('body','鸟首与鸟身',bodyNodes,[-4,3,0]),...wings.map(({shoulder,sign})=>structurePart(sign<0?'wing-back':'wing-front',sign<0?'远侧羽翼':'近侧羽翼',[shoulder],[2,3,sign*11])),structurePart('tail','尾羽',[tail],[8,0,2]),structurePart('feet','足部',feet,[0,-4,2]),structurePart('base','底座',[perch],[0,-8,0])]});
 const gold=createSunBirdStage({kit:k,birdObject:object});
 const entranceScales=new Map([...bodyNodes,...wings.map(w=>w.shoulder),...feet,tail,perch].map(node=>[node,node.scale.clone()]));
 function revealEntrance(s){
  entranceScales.forEach((scale,node)=>{node.scale.copy(scale);node.visible=true;});if(s?.status!=='playing')return;
  for(const node of bodyNodes){const amount=node===head?s.head:s.body;node.visible=amount>.001;node.scale.multiplyScalar(Math.max(.001,amount));}
  wings.forEach(({shoulder},i)=>{shoulder.visible=s.wings[i]>.001;shoulder.scale.multiplyScalar(Math.max(.001,s.wings[i]));});tail.visible=s.tail>.001;tail.scale.multiplyScalar(Math.max(.001,s.tail));feet.forEach(foot=>{foot.visible=s.tail>.01;foot.scale.multiplyScalar(Math.max(.001,s.tail));});perch.visible=s.support>.001;object.rotation.y+=s.yaw;
  halo.material.opacity=s.light*.15;featherLights.forEach((f,i)=>{const a=s.progress*Math.PI*2-i*.16;f.visible=s.progress>.2;f.position.set(Math.cos(a)*20,Math.sin(a)*15,Math.sin(a*.5)*8);f.material.opacity=s.light*.4;});
 }
 function applySnapshot(snapshot){revealEntrance(null);structure.reset();const s=snapshot.motion??snapshot,p=snapshot.performance?.status==='playing'?snapshot.performance.progress:0,cin=Math.sin(p*Math.PI),pos=s.position||{x:0,y:0,z:0};
  object.position.set((p?Math.sin(p*Math.PI*2)*.28:pos.x)*45,(p?Math.sin(p*Math.PI)*.3:pos.y)*24,(p?Math.sin(p*Math.PI*2)*.12:pos.z)*45);
  object.rotation.set(0,(s.heading||0)-.1,(s.bank||0)+Math.sin(p*Math.PI*2)*.14);const phase=p?p*Math.PI*12:s.wingPhase||0,strength=p?.8*cin:s.wingStrength||0;
  wings.forEach(({shoulder,outer,sign,featherGroups})=>{shoulder.rotation.x=sign*(.08+Math.sin(phase)*strength);shoulder.rotation.y=sign*.08;outer.rotation.x=Math.sin(phase-.5)*strength*.45;featherGroups.forEach((g,i)=>g.rotation.x=Math.sin(phase-i*.15)*strength*.13);});
  tails.forEach((f,i)=>f.rotation.y=Math.sin(phase*.5-i*.23)*strength*.15);jaw.rotation.z=(s.beakOpen||0)*.42+(p?Math.max(0,Math.sin((p-.2)*Math.PI*5))*.18:0);eyes.forEach(e=>e.scale.y=(e.userData.openScaleY??.95)*Math.max(.06,s.eyeOpen??1));
  halo.material.opacity=cin*.18;k.bronze.emissive.setHex(0x8e6426);k.bronze.emissiveIntensity=cin*.17;
  featherLights.forEach((f,i)=>{f.visible=p>.25&&p<.95;const a=p*Math.PI*2-i*.065;f.position.set(Math.sin(a)*18,Math.sin(a*.5)*15-i*.25,Math.cos(a)*8);f.material.opacity=cin*(1-i/16)*.5;});object.updateMatrixWorld(true);
 }
 return {...k,getDiagnostics(){let crests=0,holes=0;head.traverse(n=>{if(n.name==='teardrop-crest'){crests++;holes+=n.geometry.parameters.shapes.holes.length;}});return {kind:'reference-bird',crests,crestHoles:holes,tallPiercedSocket:true};},structure,sunBird:gold,revealEntrance,dispose(){gold.dispose();k.dispose();},particleObject:object,applySnapshot,probe(frame){const point=k.point(frame);let hotspotId=null;if(point.distanceTo(new THREE.Vector3(-8,14,0))<8)hotspotId='beak';else if(point.x>5&&point.y>0)hotspotId='wing';else if(point.x>8)hotspotId='tail';return {point,hotspotId};},particleSnapshot(snapshot){return {...snapshot,motion:{...snapshot.motion,position:{x:0,y:0,z:0},heading:-.1,bank:0,wingPhase:0,wingStrength:0,beakOpen:0,eyeOpen:1},performance:{status:'idle',progress:0}};}};
}
