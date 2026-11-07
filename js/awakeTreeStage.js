import * as THREE from 'three';import {createSculptureKit} from './sculptureKit.js?v=awakening1';
import {createStructureRig,structurePart} from './structureRig.js?v=structure2';
export function createAwakeTreeStage(options){
 const k=createSculptureKit({...options,spanW:54,spanH:60}),object=new THREE.Group(),stem=new THREE.Group();k.root.add(object);object.add(stem);const levels=[],sections=[],flowers=[],birds=[],halos=[];
 const base=k.mesh(new THREE.CylinderGeometry(11.8,13.4,2.7,80),k.bronze,object);base.position.y=-24;
 for(const radius of [11.8,12.8]){const r=k.ring([0,-22.7,0],radius,.16,object);r.rotation.x=Math.PI/2;}
 for(let i=0;i<3;i++){const leg=k.curve([[Math.cos(i*2.094)*9,-22,Math.sin(i*2.094)*7],[Math.cos(i*2.094)*5,-19,Math.sin(i*2.094)*4],[0,-16,0]],.85,k.bronze,object);}
 const entranceBaseParts=object.children.filter(n=>n!==stem);
 for(let i=0;i<7;i++){
  const group=new THREE.Group();stem.add(group);const h=6.4,r=2.35-i*.19,body=k.mesh(new THREE.CylinderGeometry(r-.12,r,h,48),k.bronze,group);body.position.y=h/2;
  for(const y of [.3,5.9]){const band=k.ring([0,y,0],r+.16,.18,group);band.rotation.x=Math.PI/2;}
  for(let j=0;j<4;j++){const glyph=k.glyph(0,3.2,r+.03,.32,group);glyph.rotation.y=j*Math.PI/2;glyph.position.x=Math.sin(j*Math.PI/2)*(r+.03);glyph.position.z=Math.cos(j*Math.PI/2)*(r+.03);}
  sections.push(group);
 }
 function tinyBird(parent){
  const bird=new THREE.Group();parent.add(bird);k.ellipsoid([0,1.4,0],[1.3,1.5,.8],bird);k.curve([[0,2,0],[-.7,3.4,0],[-1.5,3.8,0]],.4,k.bronze,bird);k.ellipsoid([-1.7,3.8,0],[.75,.65,.6],bird);
  const beak=k.mesh(new THREE.ConeGeometry(.26,1.8,12),k.bronze,bird);beak.rotation.z=Math.PI/2;beak.position.set(-2.6,3.7,0);k.ellipsoid([-1.9,3.95,.55],[.15,.15,.08],bird,k.dark);
  const wing=k.solid(k.leaf(3,1),.28,bird,k.bronze,.1);wing.position.set(.1,.3,.8);wing.rotation.z=-.45;
  const tail=k.solid(k.leaf(4,.65),.25,bird,k.bronze,.1);tail.position.set(.6,.6,0);tail.rotation.z=-2.1;birds.push({bird,wing});return bird;
 }
 for(let level=0;level<3;level++){
  const group=new THREE.Group();stem.add(group);levels.push(group);
  for(let j=0;j<3;j++){
   const branch=new THREE.Group();branch.rotation.y=j*Math.PI*2/3+.2+level*.32;group.add(branch);const reach=17-level*1.4;
   k.curve([[0,0,0],[4,4,0],[9,6.2,.1],[reach-2,4.5,.3],[reach,1.2,.4]],.58-level*.045,k.bronze,branch);
   k.curve([[1,.1,.6],[5,4.5,.6],[10,6,.65],[reach-2,4.4,.7]],.1,k.gold,branch);
   const tip=new THREE.Group();tip.position.set(reach,1.1,.4);branch.add(tip);
   k.curve([[0,0,0],[.5,-1.8,0],[-.8,-3.5,.1]],.3,k.bronze,tip);const fruit=k.ellipsoid([-.8,-4.5,.1],[1.1,1.4,1.1],tip);
   const bell=k.mesh(new THREE.ConeGeometry(2,.7,24,1,true),k.bronze,tip);bell.rotation.x=Math.PI;bell.position.set(-.8,-5.9,.1);
   const bird=tinyBird(branch);bird.position.set(reach*.65,5.1,0);bird.rotation.y=j%2?Math.PI:0;
   const flower=new THREE.Group();flower.position.set(reach*.43,5.5,.2);flower.scale.setScalar(1.25);branch.add(flower);const petals=[];
   for(let p=0;p<7;p++){const hinge=new THREE.Group();hinge.rotation.y=p*Math.PI*2/7;flower.add(hinge);const petal=k.solid(k.leaf(2.8,1.35),.18,hinge,k.gold,.07);petal.position.z=.18;petals.push(hinge);}k.ellipsoid([0,.4,0],[.65,.7,.65],flower,k.gold);flowers.push({flower,petals,level});
  }
  const halo=k.ring([0,0,0],19-level,.065,k.root,new THREE.MeshBasicMaterial({color:0xe1bd75,transparent:true,opacity:0,depthWrite:false}));halo.rotation.x=Math.PI/2;halo.userData.excludeFromParticles=true;halos.push(halo);
 }
 // The museum describes the surviving top as incomplete; keep an open terminal instead of adding a tenth bird.
 const top=new THREE.Group();stem.add(top);k.mesh(new THREE.CylinderGeometry(.95,1.15,1.1,32,1,true),k.bronze,top);const rim=k.ring([0,.55,0],.98,.12,top,k.bronze);rim.rotation.x=Math.PI/2;
 // A curling animal-like tendril connects the base to the trunk rather than floating in space.
 k.curve([[9,-22,1],[13,-15,0],[9,-9,0],[5,-13,1],[6,-18,2],[2,-18,2]],.7,k.bronze,object);k.glyph(8,-15,1,.65,object);
 const motes=Array.from({length:24},(_,i)=>{const g=k.glow(0,0,0,.8,'#edcc82');g.userData.excludeFromParticles=true;return g;});
 const baseNodes=object.children.filter(n=>n!==stem);
 const structure=createStructureRig({kit:k,camera:options.camera,objects:[object],cuts:[-7,9],parts:[structurePart('base','底座与根形构件',baseNodes,[0,-7,0]),...sections.map((g,i)=>structurePart('trunk','主干',[g],[-4,(i-3)*.8,0])),structurePart('trunk','主干',[top],[-4,4,0]),...levels.map((g,i)=>structurePart('branch-'+i,['下层枝条','中层枝条','上层枝条'][i],[g],[3,(i-1)*3,6])),...birds.map(({bird})=>structurePart('birds','鸟形构件',[bird],[0,5,3]))]});
 const entranceGeometry=new THREE.BufferGeometry(),entrancePositions=new Float32Array(512*3),entranceColors=Float32Array.from({length:512*3},(_,i)=>i%3===0?.75:i%3===1?.69:.36);entranceGeometry.setAttribute('position',new THREE.BufferAttribute(entrancePositions,3));entranceGeometry.setAttribute('color',new THREE.BufferAttribute(entranceColors,3));const entranceLight=new THREE.Points(entranceGeometry,new THREE.PointsMaterial({size:.18,vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));stem.add(entranceLight);entranceLight.frustumCulled=false;entranceLight.userData.excludeFromParticles=true;
 const baseOutline=k.ring([0,-22.5,0],13.6,.10,k.root,new THREE.MeshBasicMaterial({color:0xefce83,transparent:true,opacity:0,depthWrite:false}));baseOutline.rotation.x=Math.PI/2;baseOutline.userData.excludeFromParticles=true;
 const birdScales=birds.map(({bird})=>bird.scale.clone());
 function revealEntrance(s){
  const playing=s?.status==='playing';object.rotation.y=playing?s.yaw:0;
  entranceBaseParts.forEach(n=>n.visible=!playing||s.base>.001);baseNodes.filter(n=>!entranceBaseParts.includes(n)).forEach(n=>n.visible=!playing||s.trunk>.5);
  sections.forEach((g,i)=>{const amount=playing?Math.max(.001,Math.min(1,s.trunk*7-i)):1;g.scale.y*=amount;g.visible=amount>.001;});top.visible=!playing||s.trunk>.95;
  levels.forEach((g,i)=>{const amount=playing?s.branches[i]:1;g.visible=amount>.001;g.scale.multiplyScalar(Math.max(.001,amount));if(playing)g.rotation.z+=(1-amount)*.35;});
  birds.forEach(({bird},i)=>{const amount=playing?s.birds[i]:1;bird.visible=amount>.001;bird.scale.copy(birdScales[i]).multiplyScalar(Math.max(.001,amount));});
  baseOutline.material.opacity=playing?s.base*(1-s.trunk)*.5:0;entranceLight.visible=playing&&s.progress>.78;entranceLight.material.opacity=playing?Math.sin(Math.min(1,Math.max(0,(s.progress-.78)/.22))*Math.PI)*.8:0;
  if(entranceLight.visible){for(let i=0;i<512;i++){const level=i%3,arm=Math.floor(i/3)%3,angle=arm*Math.PI*2/3+.2+level*.32,u=(i/512+s.progress*6)%1,q=Math.max(0,(u-.45)/.55),height=-20+(level+1)*12.2,reach=(17-level*1.4)*q,j=i*3;entrancePositions[j]=u<.45?Math.sin(i)*.4:Math.cos(angle)*reach;entrancePositions[j+1]=u<.45?-20+u/.45*(height+20):height+Math.sin(q*Math.PI)*5;entrancePositions[j+2]=u<.45?Math.cos(i)*.4:Math.sin(angle)*reach;}entranceGeometry.attributes.position.needsUpdate=true;}
 }
 function applySnapshot(snapshot){revealEntrance(null);structure.reset();const s=snapshot.motion??snapshot,p=snapshot.performance?.status==='playing'?snapshot.performance.progress:0,cin=Math.sin(p*Math.PI),growth=p?Math.max(s.growth??.65,.65+.35*Math.min(1,p*2)):s.growth??.65,bloom=p?Math.max(s.bloom??0,Math.max(0,Math.min(1,(p-.25)*2))):s.bloom??0,wind=s.wind||0,phase=s.branchPhase||0;
  stem.rotation.z=Math.sin(phase)*wind*.035;stem.rotation.y=-.22;sections.forEach((g,i)=>{g.position.y=-20+i*6.4*growth;g.scale.y=growth;});
  levels.forEach((g,i)=>{g.position.y=-20+(i+1)*12.2*growth;g.scale.setScalar(.72+.28*growth);g.rotation.z=Math.sin(phase-i*.5)*wind*.07;halos[i].position.y=g.position.y+2;halos[i].material.opacity=cin*Math.max(0,1-Math.abs(p-(.3+i*.19))*5)*.55;halos[i].scale.setScalar(1+cin*.08);});top.position.y=-20+45*growth;
  flowers.forEach(({flower,petals,level})=>{petals.forEach((hinge,i)=>{hinge.rotation.x=(.15+bloom*1.1)*(1+Math.sin(phase*.3+i)*.02);});flower.rotation.z=Math.sin(phase-level*.5)*wind*.09;});
  birds.forEach(({wing},i)=>{wing.rotation.x=cin*Math.sin(p*35-i*.6)*.45;});
  const pulse=s.pulseProgress||0; k.bronze.emissive.setHex(0x88652b);k.bronze.emissiveIntensity=cin*.12+Math.sin(pulse*Math.PI)*.08;
  motes.forEach((g,i)=>{const t=(i/24+(p||pulse))%1;g.position.set(Math.sin(i*2.4+t*5)*(3+t*10),-20+t*46,Math.cos(i*2.4)*7);g.material.opacity=(cin||Math.sin(pulse*Math.PI))*.45;g.visible=cin>.01||pulse>0;});object.updateMatrixWorld(true);
 }
 return {...k,structure,revealEntrance,entranceDiagnostics(){return {branches:levels.length*3,birds:birds.length,flowParticles:512};},particleObject:object,applySnapshot,probe(frame){return {point:k.point(frame)};},particleSnapshot(snapshot){return {...snapshot,motion:{...snapshot.motion,growth:1,bloom:.5,wind:0,pulseProgress:0,branchPhase:0},performance:{status:'idle',progress:0}};}};
}
