import * as THREE from 'three';
import {clipTriangleBand,intersectTriangleY} from './structureGeometry.js?v=structure2';

// Identity wrappers leave all existing articulation and parent coordinates intact.
export function structurePart(id,label,nodes,offset){
 const wrappers=[];
 for(const node of nodes){const parent=node.parent,wrapper=new THREE.Group();parent.add(wrapper);wrapper.add(node);wrapper.userData.structurePart=id;wrappers.push(wrapper);}
 return {id,label,wrappers,offset};
}
function geometryFromRows(rows){
 const g=new THREE.BufferGeometry(),position=[],normal=[],uv=[];
 for(const v of rows){position.push(...v.slice(0,3));normal.push(...v.slice(3,6));uv.push(...v.slice(6,8));}
 g.setAttribute('position',new THREE.Float32BufferAttribute(position,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g;
}
export function splitMeshAtY(mesh,y){
 const g=mesh.geometry,index=g.index,positions=g.attributes.position,normals=g.attributes.normal,uv=g.attributes.uv,rows=[[],[]];
 for(let i=0;i<(index?.count??positions.count);i+=3){const triangle=[];for(let j=0;j<3;j++){const a=index?index.getX(i+j):i+j;triangle.push([positions.getX(a),positions.getY(a),positions.getZ(a),normals.getX(a),normals.getY(a),normals.getZ(a),uv.getX(a),uv.getY(a)]);}for(let band=0;band<2;band++)for(const tri of clipTriangleBand(triangle,band?y:-Infinity,band?Infinity:y))rows[band].push(...tri);}
 const upper=mesh.clone();mesh.geometry=geometryFromRows(rows[0]);upper.geometry=geometryFromRows(rows[1]);mesh.parent.add(upper);return upper;
}
export function createStructureRig({kit,camera,objects,parts,cuts=[-6,8]}){
 const pivot=new THREE.Group(),content=new THREE.Group(),slices=new THREE.Group(),traces=new THREE.Group();kit.root.add(pivot);pivot.add(content,slices,traces);for(const o of objects)content.add(o);
 slices.visible=false;traces.visible=false;const materials=new Map(),originals=[],sliceMaterials=[],links=[],ray=new THREE.Raycaster(),v=new THREE.Vector3(),normal=new THREE.Vector3();let built=false,currentSlice=0;
 const uniqueParts=[...new Map(parts.map(p=>[p.id,{id:p.id,label:p.label}])).values()];
 content.traverse(mesh=>{
  if(!mesh.isMesh)return;let node=mesh,id='body';while(node&&node!==content){if(node.userData.structurePart){id=node.userData.structurePart;break;}node=node.parent;}
  mesh.userData.structurePart=id;
  const original=mesh.material,key=id+':'+original.uuid;let material=materials.get(key);
  if(!material){material=original.clone();materials.set(key,material);originals.push({material,original,id});}mesh.material=material;
 });
 for(const part of parts)for(const wrapper of part.wrappers){
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
  const line=new THREE.Line(geo,new THREE.LineDashedMaterial({color:0xc9b678,transparent:true,opacity:.3,dashSize:.45,gapSize:.4,depthWrite:false}));line.userData.excludeFromParticles=true;traces.add(line);links.push({part,wrapper,line,center:null});
 }
 function reset(){pivot.position.set(0,0,0);pivot.rotation.set(0,0,0);pivot.scale.setScalar(1);for(const p of parts)for(const w of p.wrappers){w.position.set(0,0,0);w.rotation.set(0,0,0);}content.updateWorldMatrix(true,true);}
 function build(){
  if(built)return;built=true;reset();pivot.updateWorldMatrix(true,true);const inverse=pivot.matrixWorld.clone().invert(),groups=[new Map(),new Map(),new Map()],contours=[[],[],[]];
  content.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const matrix=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),nm=new THREE.Matrix3().getNormalMatrix(matrix),g=mesh.geometry,a=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,index=g.index;
   for(let i=0;i<(index?.count??a.count);i+=3){const triangle=[];
    for(let j=0;j<3;j++){const at=index?index.getX(i+j):i+j;v.fromBufferAttribute(a,at).applyMatrix4(matrix);normal.fromBufferAttribute(n,at).applyMatrix3(nm).normalize();triangle.push([v.x,v.y,v.z,normal.x,normal.y,normal.z,u?.getX(at)||0,u?.getY(at)||0]);}
    for(let b=0;b<3;b++){
     const min=b?cuts[b-1]:-Infinity,max=b<2?cuts[b]:Infinity,clipped=clipTriangleBand(triangle,min,max);if(!clipped.length)continue;
     if(!groups[b].has(mesh.material))groups[b].set(mesh.material,[]);const rows=groups[b].get(mesh.material);for(const t of clipped)rows.push(...t);
     for(const y of [min,max])if(Number.isFinite(y))for(const p of intersectTriangleY(triangle,y))contours[b].push(...p.slice(0,3));
    }
   }
  });
  groups.forEach((byMaterial,b)=>{
   const layer=new THREE.Group();slices.add(layer);
   for(const [original,rows] of byMaterial){const material=original.clone();material.transparent=true;material.opacity=0;sliceMaterials.push({material,original});const mesh=new THREE.Mesh(geometryFromRows(rows),material);mesh.castShadow=false;mesh.receiveShadow=true;layer.add(mesh);}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(contours[b],3));const line=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xffdc95,transparent:true,opacity:0,depthWrite:false}));layer.add(line);layer.userData.contour=line;
  });
  content.updateWorldMatrix(true,true);
  for(const link of links){const box=new THREE.Box3().setFromObject(link.wrapper);link.center=link.wrapper.worldToLocal(box.getCenter(new THREE.Vector3()));}
  // Sparse fragments stay attached to their source component and follow its reversible path.
  for(const link of links){const meshes=[];link.wrapper.traverse(o=>{if(o.isMesh)meshes.push(o);});const rows=[],inverse=link.wrapper.matrixWorld.clone().invert();
   for(let i=0;i<24&&meshes.length;i++){const mesh=meshes[i%meshes.length],a=mesh.geometry.attributes.position;v.fromBufferAttribute(a,(i*97)%a.count).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);rows.push(v.x,v.y,v.z);}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(rows,3));const motes=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xe3c482,size:.18,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));motes.userData.excludeFromParticles=true;link.wrapper.add(motes);link.motes=motes;
  }
 }
 function alpha(m,a){const transparent=a<.999;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=a;m.depthWrite=a>.6;}
 return {
  parts:uniqueParts,
  get particleObject(){return currentSlice>.05?slices:content;},
  reset,
  pick(frame){if(currentSlice>.05)return null;ray.setFromCamera(new THREE.Vector2(frame.x,frame.y),camera);const hit=ray.intersectObject(content,true).find(h=>h.object.isMesh);return hit?.object.userData.structurePart??null;},
  update(s,{opacity=1}={}){
   reset();if(s?.enabled)build();currentSlice=s?.enabled?s.slice:0;
   const enabled=!!s?.enabled,e=enabled?s.explode:0,cut=currentSlice;
   pivot.position.y=e*5+cut*4;pivot.rotation.set(enabled?s.pitch:0,enabled?s.yaw:0,0);pivot.scale.setScalar((enabled?s.zoom:1)*(1-e*.16-cut*.12));
   pivot.updateWorldMatrix(true,true);
   for(const link of links){const {part,wrapper,center,line}=link;wrapper.position.set(...part.offset).multiplyScalar(e);
    if(enabled&&s.selected===part.id&&center){wrapper.rotation.y=s.localYaw;const turned=center.clone().applyEuler(wrapper.rotation);wrapper.position.add(center).sub(turned);}
    wrapper.updateWorldMatrix(true,true);
    if(link.motes){link.motes.visible=e>.001&&cut<.05&&opacity>.001;link.motes.position.set(Math.sin(e*Math.PI)*.7,Math.sin(e*Math.PI)*1.6,Math.sin(e*Math.PI)*1.1);link.motes.material.opacity=(Math.sin(e*Math.PI)*.65+e*.12)*opacity;}
    if(center){const a=center.clone().applyMatrix4(wrapper.parent.matrixWorld);const b=center.clone().applyMatrix4(wrapper.matrixWorld);traces.worldToLocal(a);traces.worldToLocal(b);const attr=line.geometry.attributes.position;attr.setXYZ(0,a.x,a.y,a.z);attr.setXYZ(1,b.x,b.y,b.z);attr.needsUpdate=true;line.computeLineDistances();line.material.opacity=e*.23*opacity;}
   }
   const solidAlpha=opacity*(1-Math.min(1,cut*5)),sliceAlpha=opacity*Math.min(1,cut*5);
   content.visible=solidAlpha>.001;slices.visible=cut>.001&&opacity>.001;traces.visible=e>.01&&cut<.05;
   for(const {material,original,id} of originals){material.color.copy(original.color);material.emissive.copy(original.emissive);material.emissiveIntensity=original.emissiveIntensity;if(enabled&&s.selected===id){material.emissive.setHex(0xc4a455);material.emissiveIntensity=.38;}alpha(material,solidAlpha);}
   slices.children.forEach((layer,b)=>{layer.position.set(0,(b-1)*7*cut,(b-1)*2.5*cut);layer.userData.contour.material.opacity=sliceAlpha*.82;});
   for(const {material,original} of sliceMaterials){material.color.copy(original.color);alpha(material,sliceAlpha);}
   pivot.updateWorldMatrix(true,true);
  },
  // All generated geometries/materials are children of kit.root and owned by kit.dispose.
  getDiagnostics(){return {built,parts:uniqueParts.length,sliceLayers:slices.children.length,contourVertices:slices.children.map(l=>l.userData.contour.geometry.attributes.position.count)};},
 };
}
