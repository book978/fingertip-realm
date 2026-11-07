import * as THREE from 'three';import {createStageKit} from './stageKit.js?v=awakening1';
import {createDialogueBackdrop} from './dialogueBackdrop.js?v=0.4.0';
const files={mask:'mask-gallery',bird:'bird-valley',tree:'tree-grove',shadow:'beast-stage'};
export function createSceneBackdrop({chapterId,scene,camera,environment,reduceMotion=false}){
 const root=new THREE.Group();scene.add(root);let disposed=false,texture=null,time=0;
 const planeMaterial=new THREE.MeshBasicMaterial({color:0x999999,depthWrite:false});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(2,2),planeMaterial);plane.position.z=-38;root.add(plane);
 if(chapterId==='shadow'){texture=new THREE.CanvasTexture(createDialogueBackdrop());texture.colorSpace=THREE.SRGBColorSpace;planeMaterial.map=texture;planeMaterial.needsUpdate=true;}else new THREE.TextureLoader().load(new URL(`../assets/scenes/${files[chapterId]}.png`,import.meta.url).href,t=>{if(disposed){t.dispose();return;}texture=t;t.colorSpace=THREE.SRGBColorSpace;planeMaterial.map=t;planeMaterial.needsUpdate=true;},undefined,()=>{});
 const dimensions={mask:[60,49],bird:[66,56],tree:[54,60],shadow:[88,68]}[chapterId];const kit=createStageKit({scene,camera,spanW:dimensions[0],spanH:dimensions[1]});scene.remove(kit.root);root.add(kit.root);const near=kit.root,baseY=chapterId==='tree'?-27:-24;
 const stone=new THREE.MeshStandardMaterial({color:chapterId==='bird'?0x2b3b34:0x262b25,roughness:.87,metalness:.16});
 if(chapterId!=='shadow'){
  const base=kit.mesh(new THREE.CylinderGeometry(chapterId==='tree'?19:24,chapterId==='tree'?21:26,2.8,96),stone);base.position.set(0,baseY,-2);base.receiveShadow=true;
  const rim=kit.mesh(new THREE.TorusGeometry(chapterId==='tree'?19.4:24.4,.14,8,96),environment.createGoldMaterial());rim.rotation.x=Math.PI/2;rim.position.set(0,baseY+1.5,-2);
  const floor=kit.mesh(new THREE.PlaneGeometry(180,130),new THREE.MeshStandardMaterial({color:0x16241d,transparent:true,opacity:.22,roughness:.7,metalness:.25}));floor.rotation.x=-Math.PI/2;floor.position.set(0,-25,-15);floor.receiveShadow=true;floor.castShadow=false;
 }else stone.dispose();
 const dust=new THREE.BufferGeometry(),pts=Float32Array.from({length:180*3},(_,i)=>i%3===1?Math.random()*70-28:i%3===2?Math.random()*25-25:Math.random()*140-70);dust.setAttribute('position',new THREE.BufferAttribute(pts,3));const dustMat=new THREE.PointsMaterial({color:0xe5c78b,size:.14,transparent:true,opacity:.4,depthWrite:false,blending:THREE.AdditiveBlending});const mote=new THREE.Points(dust,dustMat);near.add(mote);
 return {root,layout(size){kit.layout(size);const z=camera.position.z+38,h=2*Math.tan(camera.fov*Math.PI/360)*z,w=h*size.width/size.height;plane.scale.set(w/2*1.04,h/2*1.04,1);},
 update(dt,{pointer,dragging,expression}={}){time+=dt;mote.rotation.y=reduceMotion?0:time*.009;plane.position.x+=((!reduceMotion&&!dragging?(pointer?.x??0)*.6:0)-plane.position.x)*.04;planeMaterial.color.setScalar(expression==='particles'?.42:chapterId==='mask'?.64:chapterId==='shadow'?.75:.62);},
 dispose(){disposed=true;scene.remove(root);kit.dispose();plane.geometry.dispose();planeMaterial.dispose();texture?.dispose();dust.dispose();dustMat.dispose();}};
}
