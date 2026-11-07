import * as THREE from 'three';
import { HOTSPOTS } from './sanxingduiData.js?v=awakening1';

// Original procedural interpretation, not a measured reconstruction.
export function createArtifact({ scene, camera, parts, environment, reduceMotion = false }) {
  const root=new THREE.Group(), object=new THREE.Group(), guides=new THREE.Group();
  root.add(guides,object);scene.add(root);
  const materials=[],geometries=[],partGroups=new Map(),raycaster=new THREE.Raycaster();
  const plane=new THREE.Plane(new THREE.Vector3(0,0,1),0),intersection=new THREE.Vector3();
  let home=true,lastSnapshot,time=0,width=1440,height=900;
  const tc=document.createElement('canvas');tc.width=tc.height=512;
  const ctx=tc.getContext('2d');let seed=781;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle='#6c8c75';ctx.fillRect(0,0,512,512);
  for(let i=0;i<16000;i++){const x=rand()*512,y=rand()*512,r=rand()*12;ctx.fillStyle=['#284f43','#a3996a','#456f61','#729b80','#233f33'][Math.floor(rand()*5)];ctx.globalAlpha=0.08+rand()*0.2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  const patina=new THREE.CanvasTexture(tc);patina.colorSpace=THREE.SRGBColorSpace;patina.wrapS=patina.wrapT=THREE.RepeatWrapping;patina.repeat.set(0.12,0.12);
  const bronze=environment?.createBronzeMaterial()||new THREE.MeshStandardMaterial({color:0x718b69,map:patina,metalness:0.68,roughness:0.64,side:THREE.DoubleSide});
  const trim=environment?.createGoldMaterial()||new THREE.MeshStandardMaterial({color:0x8f845e,metalness:0.76,roughness:0.52});
  const dark=new THREE.MeshStandardMaterial({color:0x183b30,metalness:0.5,roughness:0.73});materials.push(bronze,trim,dark);
  function mesh(geo,mat=bronze){geometries.push(geo);return new THREE.Mesh(geo,mat);}
  function extrude(shape,depth=1.5,bevel=0.45,bend=false){
    let g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:4,steps:1,curveSegments:24});
    if(bend){
      // Refine flat caps before curving: long cap triangles otherwise cut across the eye openings.
      const a=g.attributes.position,u=g.attributes.uv,positions=[],uvs=[];
      const midpoint=(v,w)=>v.map((n,i)=>(n+w[i])/2);
      function triangle(v0,v1,v2,level){
        if(level){const ab=midpoint(v0,v1),bc=midpoint(v1,v2),ca=midpoint(v2,v0);triangle(v0,ab,ca,level-1);triangle(ab,v1,bc,level-1);triangle(ca,bc,v2,level-1);triangle(ab,bc,ca,level-1);}
        else for(const v of [v0,v1,v2]){positions.push(...v.slice(0,3));uvs.push(...v.slice(3));}
      }
      for(let i=0;i<a.count;i+=3){const vs=[0,1,2].map(j=>[a.getX(i+j),a.getY(i+j),a.getZ(i+j),u.getX(i+j),u.getY(i+j)]);const cap=[0,depth].some(z=>vs.every(v=>Math.abs(v[2]-z)<.001));triangle(...vs,cap?2:0);}
      g.dispose();g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    }
    if(bend){const a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i);a.setZ(i,a.getZ(i)+1.6*(1-x*x/290));}g.computeVertexNormals();}
    return mesh(g);
  }
  function line(points,radius=0.24,mat=trim){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),64,radius,6),mat);}
  function face(){
    const group=new THREE.Group(),s=new THREE.Shape();
    s.moveTo(0,10);s.bezierCurveTo(-7,11,-14,10,-16,7);s.lineTo(-16.8,0);s.bezierCurveTo(-15,-4,-11,-6,-7,-7);s.lineTo(7,-7);s.bezierCurveTo(11,-6,15,-4,16.8,0);s.lineTo(16,7);s.bezierCurveTo(14,10,7,11,0,10);
    for(const sign of [-1,1]){const h=new THREE.Path();h.absellipse(sign*8.5,3,5.7,2.3,0,Math.PI*2,true);s.holes.push(h);}
    group.add(extrude(s,1.6,0.6,true));
    for(const sign of [-1,1]){group.add(line([[sign*15,7,3.5],[sign*11,8.4,4.4],[sign*6,7.8,4.7],[sign*3,4.7,4]],0.43));group.add(line([[sign*15,-1,2],[sign*13,-3.5,3.3],[sign*7,-5,4]],0.16,dark));}
    const n=new THREE.Shape();n.moveTo(-1.2,5);n.lineTo(1.2,5);n.bezierCurveTo(1.2,1,1.8,-2,3,-3.3);n.bezierCurveTo(1,-5,-1,-5,-3,-3.3);n.bezierCurveTo(-1.8,-2,-1.2,1,-1.2,5);
    const nose=extrude(n,3.6,0.22);nose.position.z=2.8;group.add(nose);group.add(line([[-2.8,-3,6.9],[0,-3.8,7.4],[2.8,-3,6.9]],0.27,dark));return group;
  }
  function eye(){
    const group=new THREE.Group(),s=new THREE.Shape();s.moveTo(-6,0);s.quadraticCurveTo(-2,4.2,5.8,0);s.quadraticCurveTo(1,-3.8,-6,0);
    const h=new THREE.Path();h.absellipse(0,0,3.9,1.3,0,Math.PI*2,true);s.holes.push(h);const lid=extrude(s,1.2,0.28);lid.position.z=3.2;group.add(lid);
    const shaft=mesh(new THREE.CylinderGeometry(1.65,2.05,5.4,32));shaft.rotation.x=Math.PI/2;shaft.scale.x=1.22;shaft.position.z=6;group.add(shaft);
    const rim=mesh(new THREE.TorusGeometry(1.63,0.13,8,48),trim);rim.scale.set(1.22,0.88,1);rim.position.z=8.9;group.add(rim);
    const pupil=mesh(new THREE.CircleGeometry(1.56,48),dark);pupil.scale.set(1.22,0.88,1);pupil.position.z=8.95;group.add(pupil);
    const dot=mesh(new THREE.CircleGeometry(0.39,24));dot.position.z=9.02;dot.scale.set(.45,.45,1);group.add(dot);return group;
  }
  function ear(sign){
    const group=new THREE.Group(),s=new THREE.Shape();s.moveTo(-6,6);s.quadraticCurveTo(0,12,7,9);s.lineTo(7,1);s.quadraticCurveTo(6,-5,1,-9);s.lineTo(-6,-6);s.closePath();
    const h=new THREE.Path();h.moveTo(-2,5);h.lineTo(3,6);h.lineTo(3,0);h.quadraticCurveTo(2,-3,-1,-5);h.lineTo(-2,-2);h.closePath();s.holes.push(h);group.add(extrude(s,1.3,0.55));
    group.add(line([[-4,5,2],[0,8,2],[5,7,2],[5,0,2],[2,-5,2],[-2,-7,2]],0.25));group.add(line([[-5,-3,2],[-4,1,2],[-3,3,2]],0.3,dark));if(sign<0)group.scale.x=-1;return group;
  }
  function jaw(){
    const group=new THREE.Group(),s=new THREE.Shape();s.moveTo(-14,2.6);s.quadraticCurveTo(0,0.2,14,2.6);s.quadraticCurveTo(13,-1.8,9,-4);s.quadraticCurveTo(0,-6,-9,-4);s.quadraticCurveTo(-13,-1.8,-14,2.6);group.add(extrude(s,2.4,0.65,true));
    group.add(line([[-12,2.4,4],[-6,1.6,4.8],[0,1.5,5.1],[6,1.6,4.8],[12,2.4,4]],0.33,dark));group.add(line([[-11,0.4,4],[-5,-0.2,4.8],[0,-0.5,5.1],[5,-0.2,4.8],[11,0.4,4]],0.35));return group;
  }
  for(const p of parts){const g=p.id==='face'?face():p.id.startsWith('eye')?eye():p.id.startsWith('ear')?ear(p.id==='ear-left'?-1:1):jaw();g.position.set(p.target.x,p.target.y,0);g.userData.partId=p.id;g.traverse(o=>{if(o.isMesh){o.userData.partId=p.id;o.material=o.material.clone();materials.push(o.material);}});object.add(g);partGroups.set(p.id,g);}
  root.updateMatrixWorld(true);const guideMaterials=new Map();
  for(const p of parts){const mat=new THREE.LineBasicMaterial({color:0xb6a36c,transparent:true,opacity:0.12,depthWrite:false});materials.push(mat);guideMaterials.set(p.id,mat);partGroups.get(p.id).traverse(o=>{if(o.isMesh){const geo=new THREE.EdgesGeometry(o.geometry,35);geometries.push(geo);const edge=new THREE.LineSegments(geo,mat);edge.matrixAutoUpdate=false;edge.matrix.copy(o.matrixWorld);guides.add(edge);edge.userData.partId=p.id;}});}
  const decoration=new THREE.Group();root.add(decoration);const ringMat=new THREE.LineBasicMaterial({color:0xb1a272,transparent:true,opacity:0.04,depthWrite:false});materials.push(ringMat);
  for(const radius of [32,33.3]){const pts=Array.from({length:181},(_,i)=>new THREE.Vector3(Math.cos(i/180*Math.PI*2)*radius,Math.sin(i/180*Math.PI*2)*radius,-4));const geo=new THREE.BufferGeometry().setFromPoints(pts);geometries.push(geo);decoration.add(new THREE.Line(geo,ringMat));}
  const ambient=new THREE.HemisphereLight(0xc4e6d4,0x13271f,2.2),key=new THREE.DirectionalLight(0xffedcd,3.4),rim=new THREE.DirectionalLight(0x72c8af,2.4),fill=new THREE.DirectionalLight(0xd6ca9e,1);
  key.position.set(-25,32,45);rim.position.set(25,5,14);fill.position.set(-5,-20,20);if(!environment)scene.add(ambient,key,rim,fill);
  function applySnapshot(s,dt){
    lastSnapshot=s;time+=dt;const aspect=width/height,halfH=Math.tan(camera.fov*Math.PI/360)*camera.position.z;
    const aw=width>900?width*(home?0.55:0.62):width*0.91;
    const assembling=!home&&s.phase==='assemble';
    const fit=Math.min(halfH*2*aspect*(aw/width)/(assembling?91:70),halfH*2*(home?0.8:assembling?0.54:0.68)/(assembling?64:54));
    root.scale.setScalar((home?fit*1.02:fit)*s.zoom);root.position.set(home&&width>900?halfH*aspect*0.33:0,home&&width<900?-halfH*0.15:home?0:-2,0);
    object.rotation.y=home?(reduceMotion?0:Math.sin(time*0.18)*0.16)-0.23:s.yaw;object.rotation.x=home?-0.05:s.pitch;
    decoration.rotation.z=reduceMotion?0:Math.sin(time*0.03)*0.015;guides.visible=!home&&s.phase==='assemble';decoration.visible=home||s.phase!=='assemble';
    for(const p of s.parts){const g=partGroups.get(p.id),target=parts.find(t=>t.id===p.id).target,pos=home?target:p.position,rate=reduceMotion?1:Math.min(1,dt*18);g.position.x+=(pos.x-g.position.x)*rate;g.position.y+=(pos.y-g.position.y)*rate;g.position.z=home||p.placed?0:s.grabbedId===p.id?2:0.5;guideMaterials.get(p.id).opacity=s.snapPreviewId===p.id?0.8:p.placed?0.035:0.13;g.traverse(o=>{if(o.isMesh){o.material.emissive.setHex(0xb09a57);o.material.emissiveIntensity=!home&&(s.grabbedId===p.id||s.hoveredId===p.id)?0.13:0;}});}
    root.updateMatrixWorld(true);
  }
  function probe(sample){
    raycaster.setFromCamera(new THREE.Vector2(sample.x,sample.y),camera);const hits=raycaster.intersectObject(object,true),partId=hits[0]?.object.userData.partId||null;
    const wp=plane.clone().applyMatrix4(root.matrixWorld),point=raycaster.ray.intersectPlane(wp,intersection)?root.worldToLocal(intersection.clone()):new THREE.Vector3();let hotspotId=null;
    if(lastSnapshot?.phase==='inspect')for(const h of HOTSPOTS){const v=new THREE.Vector3(h.position.x,h.position.y,9).applyMatrix4(object.matrixWorld).project(camera);if(Math.hypot((v.x-sample.x)*width,(v.y-sample.y)*height)<48)hotspotId=h.id;}
    return {partId,point:{x:point.x,y:point.y},hotspotId};
  }
  function projectPart(id,target=false){const p=parts.find(p=>p.id===id),g=partGroups.get(id);const v=target?new THREE.Vector3(p.target.x,p.target.y,0).applyMatrix4(root.matrixWorld):g.getWorldPosition(new THREE.Vector3());v.project(camera);return {x:(v.x+1)*width/2,y:(1-v.y)*height/2};}
  return {root,particleObject:object,applySnapshot,probe,projectPart,layout(size){width=size.width;height=size.height;},setHomePreview(v){home=v;},dispose(){scene.remove(root,ambient,key,rim,fill);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());patina.dispose();}};
}
