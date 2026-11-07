import * as THREE from 'three';
import {createBronzeTextures} from './bronzeSurface.js?v=awakening1';
export function createStageEnvironment({scene,renderer,camera}){
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const maps=createBronzeTextures();
 const sides=Array.from({length:6},(_,i)=>{const cv=document.createElement('canvas');cv.width=cv.height=256;const c=cv.getContext('2d'),g=c.createLinearGradient(0,0,256,256);g.addColorStop(0,i===2?'#ddc9a4':'#21382f');g.addColorStop(.48,i%2?'#243d35':'#8a7752');g.addColorStop(1,'#080f0c');c.fillStyle=g;c.fillRect(0,0,256,256);c.fillStyle=i===0?'#ffe6bc':'#728c7b';c.fillRect(25,12,30,210);return cv;});
 const cube=new THREE.CubeTexture(sides);cube.needsUpdate=true;cube.colorSpace=THREE.SRGBColorSpace;const pm=new THREE.PMREMGenerator(renderer),target=pm.fromCubemap(cube);scene.environment=target.texture;cube.dispose();pm.dispose();
 const hemi=new THREE.HemisphereLight(0xa6c4b4,0x191309,1.1),key=new THREE.DirectionalLight(0xffe2ae,3.6),rim=new THREE.DirectionalLight(0x83c8b6,2.4),fill=new THREE.DirectionalLight(0xacc9c2,.8);
 key.position.set(-30,38,42);rim.position.set(35,12,-8);fill.position.set(12,-20,35);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:150});key.shadow.bias=-.0006;key.shadow.normalBias=.08;key.shadow.radius=3;
 scene.add(hemi,key,rim,fill);let current='mask';
 function resetView(){if(camera){camera.position.set(0,0,94);camera.fov=42;camera.lookAt(0,0,0);camera.updateProjectionMatrix();}key.intensity=3.6;rim.intensity=2.4;}
 return {setTheme(id){current=id;renderer.setClearColor(id==='shadow'?0x17110c:0x070e0c);hemi.intensity=id==='shadow'?.65:1.1;},
 createBronzeMaterial(){return new THREE.MeshStandardMaterial({color:0xe0d8bc,map:maps.map,roughnessMap:maps.roughnessMap,normalMap:maps.normalMap,normalScale:new THREE.Vector2(.35,.35),metalness:.78,roughness:.82,envMapIntensity:1,side:THREE.DoubleSide});},
 createGoldMaterial(){return new THREE.MeshStandardMaterial({color:0xbda36a,metalness:.82,roughness:.52,envMapIntensity:1});},
 enableClipping(){renderer.localClippingEnabled=true;},update(){},resetView,updateView({performance,dragging=false,dtSec=0}){if(!camera)return;const p=performance?.status==='playing'?performance.progress:0,pulse=Math.sin(p*Math.PI),z=94*(1-.07*pulse);camera.position.z+=((dragging?94:z)-camera.position.z)*Math.min(1,dtSec*5);key.intensity=3.6+pulse*.9;rim.intensity=(current==='shadow'?1.6:2.4)+pulse*.6;},
 dispose(){scene.remove(hemi,key,rim,fill);key.shadow.map?.dispose();scene.environment=null;target.dispose();maps.dispose();}};
}
