import * as THREE from 'three';
import {createStageEnvironment} from './stageEnvironment.js?v=awakening1';
import {createAwakeMaskStage} from './awakeMaskStage.js?v=journey3';
import {createFaceTracker,describeFaceTrackingError} from './faceTracker.js?v=tryon-fix-20261023';
import {createFacePose} from './facePose.js?v=journey3';

export function createTryOn({camera,onEnter=()=>{},onClose=()=>{},reducedMotion=false}){
 const dialog=document.createElement('dialog');dialog.id='tryon-dialog';dialog.className='third-tryon';
 dialog.innerHTML='<header><div><small>AN ANCIENT GAZE, ON YOUR FACE</small><h2>与古蜀，面对面。</h2></div><button class="tryon-close" aria-label="退出试戴">×</button></header><div class="tryon-layout"><div class="tryon-viewport"><video playsinline muted hidden aria-label="仅在本机处理的试戴摄像头"></video><canvas aria-label="三维青铜面具试戴"></canvas><span class="tryon-demo-label">虚拟人物演示 · 未开启摄像头</span></div><aside><p class="tryon-kicker">青铜面具 · 虚拟试戴</p><p>让面具随你的转头、移动与靠近轻轻相应。</p><p class="tryon-status" role="status" aria-live="polite"></p><button class="tryon-camera primary-button">开启摄像头试戴 ↗</button><button class="tryon-demo text-button">无摄像头示范</button><button class="tryon-recenter text-button">重新定位 ↺</button><label>贴合大小<input class="tryon-size" type="range" min=".8" max="1.4" step=".02" value="1"></label><label>上下位置<input class="tryon-offset" type="range" min="-.15" max=".15" step=".01" value="0"></label><p class="tryon-help">示范中按住拖动，可转动面具；也可用方向键观察。</p><p class="tryon-privacy">画面仅在本机识别，不上传、不保存。退出试戴后关闭摄像头。</p><button class="tryon-enter primary-button">进入正式展览 →</button></aside></div>';
 document.body.append(dialog);const $=selector=>dialog.querySelector(selector),video=$('video'),canvas=$('canvas'),viewport=$('.tryon-viewport'),status=$('.tryon-status'),pose=createFacePose();
 let renderer=null,environment=null,stage=null,scene=null,view=null,dummy=null,mode='demo',time=0,opened=false,modelError=false,turn=0,tilt=0,lastPointer=null,width=640,height=480,opening=0;
 const tracker=createFaceTracker({video,camera,onStatus(value,details){if(!opened)return;if(value==='requesting')status.textContent='正在等待摄像头授权…';else if(value==='loading')status.textContent=details?.stage==='video'?'面部识别已就绪，正在启动摄像头画面…':'摄像头已连接，正在准备本地面部识别…';else if(value==='denied'||value==='error'){mode='demo';video.hidden=true;$('.tryon-demo-label').hidden=false;status.textContent=describeFaceTrackingError(details);$('.tryon-camera').textContent='重试摄像头 ↗';}$('.tryon-camera').disabled=value==='requesting'||value==='loading';},onResult(result,timestamp){
  if(!opened||mode!=='camera')return;pose.accept(result.faceLandmarks?.[0],timestamp,{width,height});
 }});
 function resize(w=640,h=480){width=w;height=h;viewport.style.aspectRatio=w+' / '+h;if(!renderer)return;renderer.setSize(w,h,false);view.left=-w/2;view.right=w/2;view.top=h/2;view.bottom=-h/2;view.updateProjectionMatrix();}
 function createView(){
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setClearColor(0,0);scene=new THREE.Scene();view=new THREE.OrthographicCamera(-320,320,240,-240,.1,2000);view.fov=42;view.position.z=1000;
  environment=createStageEnvironment({scene,renderer,camera:view});renderer.shadowMap.enabled=false;
  stage=createAwakeMaskStage({scene,camera:view,environment});stage.root.position.set(0,0,0);stage.root.scale.setScalar(1);
  stage.particleObject.traverse(o=>{if(o.isMesh&&o.position.y<-16)o.visible=false;});
  dummy=new THREE.Group();scene.add(dummy);const material=new THREE.MeshStandardMaterial({color:0x8e9783,roughness:.92,metalness:.15});
  const head=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),material);head.scale.set(105,139,85);head.position.set(0,-13,-75);dummy.add(head);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(39,49,85,32),material);neck.position.set(0,-160,-90);dummy.add(neck);
  const shoulders=new THREE.Mesh(new THREE.SphereGeometry(1,40,20),material);shoulders.scale.set(195,55,83);shoulders.position.set(0,-212,-95);dummy.add(shoulders);
  resize();
 }
 function disposeView(){stage?.dispose();stage=null;if(dummy){dummy.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});scene?.remove(dummy);dummy=null;}environment?.dispose();environment=null;renderer?.dispose();renderer=null;scene=null;view=null;}
 async function demo(){++opening;await tracker.stop();if(!opened)return;mode='demo';pose.reset();resize();video.hidden=true;$('.tryon-demo-label').hidden=false;status.textContent='虚拟人物示范。按住画面拖动，观察面具的不同角度。';$('.tryon-camera').textContent='开启摄像头试戴 ↗';$('.tryon-camera').disabled=modelError;}
 async function startCamera(){if(!opened||modelError)return;const token=++opening;pose.reset();mode='camera';video.hidden=false;$('.tryon-demo-label').hidden=true;const success=await tracker.start();if(token!==opening||!opened)return;if(success){resize(video.videoWidth||640,video.videoHeight||480);status.textContent='请正对镜头，让完整面部进入画面。';$('.tryon-camera').textContent='摄像头已开启';}}
 function close(){++opening;opened=false;tracker.stop();pose.reset();if(dialog.open)dialog.close();disposeView();onClose();}
 $('.tryon-close').onclick=close;$('.tryon-camera').onclick=startCamera;$('.tryon-demo').onclick=demo;
 $('.tryon-recenter').onclick=()=>{pose.reset();turn=tilt=0;$('.tryon-size').value='1';$('.tryon-offset').value='0';status.textContent=mode==='demo'?'示范已回到正面。':'已重新定位，请正对镜头。';};
 $('.tryon-enter').onclick=()=>{close();onEnter();};dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',()=>{if(opened)close();});
 canvas.addEventListener('pointerdown',e=>{if(mode!=='demo')return;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!lastPointer)return;turn=Math.max(-.7,Math.min(.7,turn-(e.clientX-lastPointer.x)*.005));tilt=Math.max(-.25,Math.min(.25,tilt+(e.clientY-lastPointer.y)*.003));lastPointer={x:e.clientX,y:e.clientY};});
 const release=()=>lastPointer=null;canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
 dialog.addEventListener('keydown',e=>{if(mode!=='demo'||e.target.matches('input'))return;if(e.key==='ArrowLeft')turn=Math.min(.7,turn+.1);else if(e.key==='ArrowRight')turn=Math.max(-.7,turn-.1);else return;e.preventDefault();});
 return {
  get active(){return opened;},
  open(){if(opened)return;opened=true;modelError=false;mode='demo';time=turn=tilt=0;pose.reset();video.hidden=true;$('.tryon-demo-label').hidden=false;$('.tryon-size').value='1';$('.tryon-offset').value='0';dialog.showModal();try{createView();status.textContent='虚拟人物示范。你可以先观察，也可以主动开启摄像头。';$('.tryon-camera').disabled=false;}catch{modelError=true;disposeView();status.textContent='当前设备暂不能开启三维试戴，可退出后继续正式展览。';$('.tryon-camera').disabled=true;}},
  close,
  update(now,dt){
   if(!opened||!renderer||!stage)return;time+=dt;tracker.process(now);pose.tick(now,dt);const real=mode==='camera',s=pose.getSnapshot();dummy.visible=!real;
   if(real&&tracker.status==='tracking'){const text=s.visible?'已识别面部 · 缓慢转头或靠近，面具会随你移动。':'未检测到清晰面部，请正对镜头；也可重新定位。';if(status.textContent!==text)status.textContent=text;}
   const yaw=real?s.yaw:turn+(reducedMotion?0:Math.sin(time*.45)*.14),pitch=real?s.pitch:tilt,roll=real?s.roll:0,fit=Number($('.tryon-size').value),scale=(real?s.scale:7)*fit,offset=Number($('.tryon-offset').value)*height;
   const snapshot={motion:{eyeOpen:1,yaw:0,pitch:0,zoom:1},performance:{status:'idle',progress:0}};stage.applySnapshot(snapshot,dt);stage.structure.update({enabled:false},{opacity:real?s.opacity:1});
   stage.root.position.set(real?s.x:0,(real?s.y:25)-3*scale+offset,0);stage.root.scale.setScalar(scale);stage.root.rotation.set(pitch,yaw,roll,'YXZ');stage.root.visible=!real||s.visible;
   dummy.rotation.set(pitch,yaw,roll,'YXZ');dummy.position.set(0,offset,0);renderer.render(scene,view);
  },
  pause(){if(opened&&mode==='camera')demo();},
  getSnapshot(){return {opened,mode,status:tracker.status,error:tracker.error,faceVisible:pose.getSnapshot().visible,modelReady:!!stage,width,height};},
  dispose(){close();dialog.remove();},
 };
}
