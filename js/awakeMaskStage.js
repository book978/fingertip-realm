import * as THREE from 'three';import {createSculptureKit} from './sculptureKit.js?v=awakening1';
import {createStructureRig,structurePart,splitMeshAtY} from './structureRig.js?v=structure2';
export function createAwakeMaskStage(options){
 const k=createSculptureKit({...options,spanW:60,spanH:49}),object=new THREE.Group();k.root.add(object);const eyes=[],ears=[],relief=[],brows=[],cheeks=[],noseParts=[],mouth=[];
 const face=new THREE.Shape();face.moveTo(-15,17);face.bezierCurveTo(-8,20,8,20,15,17);face.lineTo(16,-10);face.quadraticCurveTo(12,-17,0,-17);face.quadraticCurveTo(-12,-17,-16,-10);face.closePath();
 for(const sign of [-1,1]){const h=new THREE.Path();h.absellipse(sign*8,3,5.6,3.2,0,Math.PI*2,true);face.holes.push(h);}
 const shell=k.solid(face,3,object,k.bronze,.6);shell.position.z=-1.5;const forehead=splitMeshAtY(shell,11);
 // Broad hammered forehead and cheeks articulate the large planes in the reference.
 for(const sign of [-1,1]){
  const cheek=new THREE.Shape();cheek.moveTo(sign*2,-1);cheek.quadraticCurveTo(sign*8,-6,sign*15,-1);cheek.lineTo(sign*14,-10);cheek.quadraticCurveTo(sign*8,-14,sign*3,-8);cheek.closePath();k.solid(cheek,2.5,object,k.bronze,.3).position.z=1;
  brows.push(k.curve([[sign*2,7,3],[sign*6,10,3.8],[sign*11,10,3.6],[sign*15,8,2.5]],.42,k.bronze,object));
  brows.push(k.curve([[sign*3,6.9,3.2],[sign*7,9,4],[sign*12,8.6,3.6],[sign*15,7.5,3]],.12,k.gold,object));
  k.curve([[sign*3,-3,4.1],[sign*8,-6,3.6],[sign*14,-3,2.6]],.16,k.dark,object);
  const eye=new THREE.Group();eye.position.set(sign*8,3,3.2);eye.rotation.z=sign*.12;object.add(eye);
  k.ellipsoid([0,0,.2],[5.3,2.7,2.3],eye,k.dark);const orb=k.ellipsoid([0,0,1.9],[3.7,1.5,2.3],eye,k.bronze);
  const pupil=k.ellipsoid([0,0,4.08],[1.24,1.15,.22],eye,k.dark);k.ring([0,0,4.1],1.28,.1,eye);k.ellipsoid([-.3,.35,4.35],[.16,.16,.06],eye,k.gold);
  const upper=new THREE.Shape();upper.moveTo(-5.5,0);upper.bezierCurveTo(-2,4.2,3,4,5.5,0);upper.bezierCurveTo(2,-.6,-3,-.5,-5.5,0);const lid=k.solid(upper,.6,eye,k.bronze,.15);lid.position.set(0,2,4.45);eyes.push({eye,lid,pupil,orb});
  k.curve([[-5.4,0,3.3],[-3,-2.5,3.5],[2,-2.2,3.5],[5.3,0,3.2]],.28,k.bronze,eye);
  const ear=new THREE.Group();ear.position.set(sign*15.5,3,-.5);object.add(ear);const es=new THREE.Shape();es.moveTo(0,8);es.bezierCurveTo(4,10,10,12,13,9);es.lineTo(11,-8);es.quadraticCurveTo(5,-12,0,-8);es.closePath();
  const cut=new THREE.Path();cut.moveTo(3,5);cut.lineTo(9,7);cut.lineTo(7,-4);cut.quadraticCurveTo(4,-6,3,-4);cut.closePath();es.holes.push(cut);const hole=new THREE.Path();hole.absellipse(5,-7,1,1,0,Math.PI*2,true);es.holes.push(hole);k.solid(es,1.8,ear,k.bronze,.42);ear.scale.x=sign;
  k.curve([[1,7,2.2],[5,9,2.2],[11,9,2.2],[9,-7,2.2],[4,-9,2.2],[1,-7,2.2]],.13,k.gold,ear);k.curve([[1,0,2.1],[8,1.6,2.1]],.35,k.bronze,ear);ears.push({ear,sign});
 }
 const nose=new THREE.Shape();nose.moveTo(-1.6,8);nose.lineTo(1.6,8);nose.lineTo(2.3,-2);nose.quadraticCurveTo(5,-7,0,-7.3);nose.quadraticCurveTo(-5,-7,-2.3,-2);nose.closePath();const noseMesh=k.solid(nose,4.4,object,k.bronze,.6);noseMesh.position.z=2.8;noseParts.push(noseMesh);
 for(const sign of [-1,1])noseParts.push(k.ellipsoid([sign*2.25,-5.9,7.4],[.9,.32,.12],object,k.dark));
 mouth.push(k.curve([[-12,-11.3,3.8],[-6,-12.2,5],[0,-12,5.5],[6,-12.2,5],[12,-11.3,3.8]],.46,k.bronze,object));
 mouth.push(k.curve([[-11.5,-12.2,4],[-5,-13.3,5.15],[0,-13.2,5.5],[5,-13.3,5.15],[11.5,-12.2,4]],.16,k.dark,object));
 const neck=k.mesh(new THREE.CylinderGeometry(7.4,7.8,6,64),k.bronze,object);neck.position.set(0,-19,0);neck.scale.z=.66;k.ring([0,-16.8,3],4,.09,object,k.gold).scale.y=.4;
 for(let x=-11;x<=11;x+=5.5)relief.push(k.glyph(x,14,2.1,.32,object));
 const pointsGeo=new THREE.BufferGeometry(),verts=[];k.root.updateMatrixWorld(true);const rootInverse=k.root.matrixWorld.clone().invert();object.traverse(o=>{if(o.isMesh){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i+=Math.max(1,Math.floor(a.count/500))){const p=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).applyMatrix4(rootInverse);verts.push(p.x,p.y,p.z);}}});pointsGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));const pm=new THREE.PointsMaterial({color:0xe9cf89,size:.14,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});const dust=new THREE.Points(pointsGeo,pm);k.root.add(dust);dust.userData.excludeFromParticles=true;
 const halo=k.ring([0,0,-6],25,.08,k.root,new THREE.MeshBasicMaterial({color:0xbca16b,transparent:true,opacity:0,depthWrite:false}));halo.userData.excludeFromParticles=true;
 const lightTrails=Array.from({length:18},(_,i)=>{const light=k.glow(0,0,0,1.1,'#ebd196');light.userData.excludeFromParticles=true;return light;});
 const reserved=[forehead,...relief,...brows,...eyes.map(e=>e.eye),...ears.map(e=>e.ear),...noseParts,...mouth];
 const faceNodes=object.children.filter(n=>!reserved.includes(n));
 const structure=createStructureRig({kit:k,camera:options.camera,objects:[object],parts:[
  structurePart('forehead','额部',[forehead,...relief],[0,7,-2]),structurePart('face','面壳与颈座',faceNodes,[0,0,-4]),
  structurePart('eyes','眉眼',[...brows,...eyes.map(e=>e.eye)],[0,2,7]),structurePart('nose','鼻部',noseParts,[0,-1,12]),structurePart('mouth','口部',mouth,[0,-7,6]),
  ...ears.map(({ear,sign})=>structurePart(sign<0?'ear-left':'ear-right',sign<0?'左耳':'右耳',[ear],[sign*8,1,2]))]});
 let last;function applySnapshot(snapshot){structure.reset();last=snapshot;const s=snapshot.motion??snapshot,p=snapshot.performance?.status==='playing'?snapshot.performance.progress:0,g=s.greetProgress||0,bow=Math.sin(g*Math.PI)*Math.sin(g*Math.PI*2)*.1,cin=Math.sin(p*Math.PI);
  object.rotation.set((s.pitch||0)+bow+Math.sin(p*Math.PI*2)*.04,(s.yaw||0)+(s.gaze?.x||0)*.04,0);object.scale.setScalar(s.zoom||1);
  const open=p?Math.min(1,p*3):s.eyeOpen??1;eyes.forEach(({lid,pupil,orb},i)=>{lid.position.y=.3-(1-open)*2.7;lid.scale.y=.55+(1-open)*.55;pupil.scale.y=Math.max(.05,1.15*open);orb.scale.y=Math.max(.15,1.5*open);pupil.position.x=(s.gaze?.x||0)*.25;});
  ears.forEach(({ear,sign},i)=>{ear.rotation.y=sign*((s.earAngle||0)+Math.sin(g*Math.PI)*Math.sin(g*8+i)*.2+cin*.18);ear.rotation.z=sign*cin*.025;});
  const morph=s.morphProgress?Math.sin(s.morphProgress*Math.PI):0;pm.opacity=morph*.94;dust.visible=morph>.01;object.visible=morph<.88;
  k.bronze.color.setHex(s.materialForm==='gold'?0xf5cd77:0xe0d8bc);k.bronze.emissive.setHex(0x75511d);k.bronze.emissiveIntensity=(s.materialForm==='gold'?.08:0)+cin*.13;
  halo.material.opacity=cin*.28;halo.scale.setScalar(1+cin*.06);lightTrails.forEach((light,i)=>{const t=Math.max(0,(p-.25-i*.007)/.6);light.visible=p>.25&&p<.98;light.position.set((i%2?1:-1)*(8+Math.sin(t*Math.PI)*14)+t*14,3+Math.sin(t*Math.PI*1.1)*12,7+Math.cos(t*Math.PI)*4);light.material.opacity=cin*(1-i/20)*.55;});object.updateMatrixWorld(true);
 }
 return {...k,structure,particleObject:object,applySnapshot,probe(frame){return {point:k.point(frame)};},particleSnapshot(snapshot){return {...snapshot,motion:{...snapshot.motion,yaw:0,pitch:0,zoom:1,gaze:{x:0,y:0},eyeOpen:1,earAngle:0,greetProgress:0,morphProgress:0},performance:{status:'idle',progress:0}};}};
}
