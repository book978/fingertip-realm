import * as THREE from 'three';
// Original, clothed adult visitor. Geometry remains independent of the bronze relic.
export function createDressedVisitor(k){
 const root=new THREE.Group();root.name='contemporary-visitor';k.root.add(root);const materials=new Set();
 const mat=(color,roughness=.85)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness:0,transparent:true,opacity:0});materials.add(m);return m;};
 const skin=mat(0xcda185,.78),lip=mat(0x915f52,.72),hair=mat(0x202523,.88),shirt=mat(0x617b82,.95),seam=mat(0x586d70),pants=mat(0x283a3c,.94),shoe=mat(0x172425,.8),sole=mat(0x75827a),white=mat(0xd9d4bd,.55),iris=mat(0x242722,.45);
 // Smooth section lofts give shoulders, waist and limbs continuous organic contours.
 function loft(rows,parent,material,radial=48,steps=52){
  const curve=new THREE.CatmullRomCurve3(rows.map(([y,x,z])=>new THREE.Vector3(x,y,z))),p=[],uv=[],indices=[];
  for(let j=0;j<=steps;j++){const v=j/steps,q=curve.getPoint(v);for(let i=0;i<=radial;i++){const u=i/radial,a=u*Math.PI*2,wrinkle=1+Math.sin(a*5+v*13)*.008;p.push(Math.cos(a)*q.x*wrinkle,q.y,Math.sin(a)*q.z*wrinkle);uv.push(u,v);}}
  for(let j=0;j<steps;j++)for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return k.mesh(g,material,parent);
 }
 const torso=loft([[-4,2.4,1.2],[-2.5,2.25,1.15],[0,2.15,1.25],[3.4,2.75,1.6],[6.5,3.18,1.5],[7.7,3.1,1.15],[8.5,2.15,.85],[9,1,.7]],root,shirt);
 k.ellipsoid([0,9.5,0],[.88,1.65,.78],root,skin);
 // Collar, front placket, buttons, pocket and restrained fabric folds.
 for(const sign of [-1,1]){const collar=new THREE.Shape();collar.moveTo(sign*.8,9);collar.lineTo(sign*1.7,8.2);collar.lineTo(sign*.8,6.9);collar.lineTo(sign*.08,8.1);collar.closePath();k.solid(collar,.12,root,shirt,.04).position.z=.9;k.curve([[sign*2.6,6,1.15],[sign*2.4,2,1.35],[sign*2,-2.8,1.05]],.035,seam,root);}
 k.curve([[0,7.8,1.1],[0,3,1.66],[0,-3.8,1.26]],.06,seam,root);for(let i=0;i<6;i++)k.ellipsoid([.16,6.7-i*1.8,1.25+(i<3?.35:0)],[.09,.09,.05],root,white);
 k.curve([[1,4.5,1.42],[2.15,4.5,1.21],[2,2.6,1.32],[1,2.6,1.55]],.035,seam,root);
 for(let i=0;i<4;i++)k.curve([[-2.1,-2.7+i*.38,1.07],[-.8,-2.9+i*.3,1.28]],.022,seam,root);
 for(const sign of [-1,1]){
  const leg=new THREE.Group();leg.position.set(sign*1.23,0,sign<0?.25:-.1);root.add(leg);loft([[-17.7,.68,.67],[-16,.72,.71],[-12,.77,.78],[-10,.86,.84],[-6,1.03,1.04],[-3.7,1.16,1.06]],leg,pants,36,42);
  k.curve([[sign*.65,-17.4,.25],[sign*.75,-10,.55],[sign*.95,-4,.3]],.027,seam,leg);k.ellipsoid([0,-18.15,.77],[.91,.53,1.75],leg,shoe);k.ellipsoid([0,-18.5,.82],[.94,.16,1.78],leg,sole);
  for(let i=0;i<4;i++)k.curve([[-.45,-17.72,.6+i*.23],[.45,-17.72,.6+i*.23]],.035,seam,leg);
 }
 const head=new THREE.Group();head.position.y=13.35;root.add(head);
 const skull=k.ellipsoid([0,0,0],[1.68,2.45,1.43],head,skin);const a=skull.geometry.attributes.position;for(let i=0;i<a.count;i++){const y=a.getY(i);if(y<-.2)a.setX(i,a.getX(i)*(1+(y+.2)*.25));}a.needsUpdate=true;skull.geometry.computeVertexNormals();
 k.ellipsoid([0,-1.25,.66],[1.05,.9,.68],head,skin);k.ellipsoid([0,-1.8,.78],[.72,.38,.43],head,skin);
 for(const sign of [-1,1]){
  k.ellipsoid([sign*1.62,-.03,0],[.28,.59,.24],head,skin);k.curve([[sign*1.7,.25,.16],[sign*1.8,0,.19],[sign*1.68,-.3,.16]],.045,lip,head);
  k.ellipsoid([sign*.64,.38,1.22],[.43,.19,.13],head,white);k.ellipsoid([sign*.62,.37,1.35],[.115,.12,.055],head,iris);k.curve([[sign*.22,.5,1.28],[sign*.64,.61,1.31],[sign*1.08,.49,1.15]],.075,skin,head);
  k.curve([[sign*.27,.88,1.21],[sign*.69,1.01,1.21],[sign*1.13,.89,1.06]],.07,hair,head);
 }
 k.ellipsoid([0,.12,1.39],[.24,.64,.27],head,skin);k.ellipsoid([0,-.35,1.62],[.3,.22,.3],head,skin);for(const sign of [-1,1]){k.ellipsoid([sign*.22,-.43,1.45],[.16,.14,.19],head,skin);k.ellipsoid([sign*.18,-.51,1.56],[.085,.035,.05],head,lip);}
 k.curve([[-.53,-.94,1.21],[0,-.91,1.4],[.53,-.94,1.21]],.058,lip,head);k.curve([[-.45,-1.06,1.25],[0,-1.08,1.39],[.45,-1.06,1.25]],.05,skin,head);
 // The hairline rises above the brows in front, with lower sides and nape.
 const hairPositions=[],hairIndices=[],hairUV=[],hairRadial=64,hairRows=28;
 for(let j=0;j<=hairRows;j++)for(let i=0;i<=hairRadial;i++){const u=i/hairRadial,phi=u*Math.PI*2,front=Math.max(0,Math.sin(phi)),back=Math.max(0,-Math.sin(phi)),theta=j/hairRows*Math.PI*(.48-front*.16+back*.14);hairPositions.push(-Math.cos(phi)*Math.sin(theta)*1.77,Math.cos(theta)*2.53+.12,Math.sin(phi)*Math.sin(theta)*1.51);hairUV.push(u,j/hairRows);}
 for(let j=0;j<hairRows;j++)for(let i=0;i<hairRadial;i++){const a=j*(hairRadial+1)+i,b=a+hairRadial+1;hairIndices.push(a,a+1,b,b,a+1,b+1);}
 const hairGeometry=new THREE.BufferGeometry();hairGeometry.setAttribute('position',new THREE.Float32BufferAttribute(hairPositions,3));hairGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(hairUV,2));hairGeometry.setIndex(hairIndices);hairGeometry.computeVertexNormals();k.mesh(hairGeometry,hair,head);
 for(let i=0;i<15;i++){const x=-1.5+i*.2;k.curve([[x,1.6,.9],[x+.25,2.35,.4],[x+.15,2.4,-.5]],.03,hair,head);}for(const sign of [-1,1])k.ellipsoid([sign*1.6,.57,-.45],[.2,.9,.6],head,hair);
 const arms=[];
 for(const sign of [-1,1]){
  const shoulder=new THREE.Group();shoulder.position.set(sign*3.05,7.5,0);root.add(shoulder);loft([[-6.2,.57,.59],[-4,.7,.74],[-1.5,.83,.86],[.2,.87,.87]],shoulder,shirt,32,32);
  const elbow=new THREE.Group();elbow.position.y=-6.1;shoulder.add(elbow);loft([[-5.8,.44,.45],[-4,.52,.56],[-2,.6,.63],[.1,.58,.6]],elbow,shirt,32,32);
  const cuff=k.mesh(new THREE.CylinderGeometry(.46,.48,.47,28),seam,elbow);cuff.position.y=-5.7;
  const hand=new THREE.Group();hand.position.y=-6.3;elbow.add(hand);k.ellipsoid([0,-.35,0],[.5,.78,.25],hand,skin);
  for(let f=0;f<4;f++){const length=[.92,1.12,1.04,.78][f],finger=new THREE.Group();finger.position.set((f-1.5)*.25,-.89,.01);hand.add(finger);let parent=finger;for(let joint=0;joint<3;joint++){const g=new THREE.Group();g.position.y=joint?-length/3:0;g.rotation.x=.12+joint*.08;parent.add(g);const phalanx=k.mesh(new THREE.CapsuleGeometry(.125,length/3-.12,4,10),skin,g);phalanx.position.y=-length/6;parent=g;}}
  k.curve([[-sign*.4,-.05,.02],[-sign*.7,-.5,.15],[-sign*.62,-.98,.25]],.16,skin,hand);arms.push({shoulder,elbow,sign});
 }
 const outline=new THREE.LineSegments(new THREE.EdgesGeometry(torso.geometry,70),new THREE.LineBasicMaterial({color:0xb1d1ca,transparent:true,opacity:0}));torso.add(outline);
 return {root,materials,material:shirt,arms,outline,head,details:{fingers:10,face:true,garments:true}};
}
