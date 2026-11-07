import * as THREE from 'three';
import {createFieldSeeds} from './particleFieldMath.js?v=immersive1';
import {particleSafetyGLSL} from './particleSafety.js?v=immersive1';

/** One transparent viewport layer for the entire journey; animation stays on the app's RAF. */
export function createFullscreenParticles({canvas,camera,onStatus=()=>{}}){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});}
 catch{onStatus('unavailable');return {resize(){},layout(){},update(){},dispose(){},get available(){return false;}};}
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),view=new THREE.PerspectiveCamera(),count=4200,seeds=createFieldSeeds(count,731);
 const geometry=new THREE.InstancedBufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));
 geometry.setIndex([0,1,2,0,2,3]);
 geometry.setAttribute('aSeed',new THREE.InstancedBufferAttribute(seeds,4));
 geometry.setAttribute('aLayer',new THREE.InstancedBufferAttribute(Float32Array.from({length:count},(_,i)=>i%10),1));
 const uniforms={uTime:{value:0},uEnergy:{value:0},uActive:{value:0},uMode:{value:0},uFocus:{value:new THREE.Vector2()},uHand:{value:new THREE.Vector2()},uHandStrength:{value:0},
  uHalfView:{value:new THREE.Vector2(60,36)},uCameraZ:{value:94},uPixelRatio:{value:1},uResolution:{value:new THREE.Vector2(1280,720)},uProtected:{value:Array.from({length:12},()=>new THREE.Vector4())},uProtectedCount:{value:0}};
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:/* glsl */`
   attribute vec4 aSeed; attribute float aLayer;
   uniform float uTime,uActive,uMode,uCameraZ,uPixelRatio,uHandStrength;
   uniform vec2 uHalfView,uFocus,uHand,uResolution;
   varying vec2 vUv; varying vec3 vColor; varying float vAlpha,vKind,vPhase,vSoft;
   void main(){
    float nearLayer=step(8.5,aLayer),middle=step(4.5,aLayer)*(1.0-nearLayer);
    float z=mix(-86.0,-34.0,aSeed.z)*(1.0-middle-nearLayer)+mix(-27.0,15.0,aSeed.z)*middle+mix(34.0,58.0,aSeed.z)*nearLayer;
    float depthScale=(uCameraZ-z)/uCameraZ;
    float phase=aSeed.w*6.2831853,t=uTime*(.12+middle*.09+nearLayer*.05);
    vec2 ndc=aSeed.xy*1.18;
    // Continuous, low-speed flow: fast near the relic, unhurried at the edges.
    float proximity=exp(-length(ndc-uFocus/uHalfView)*1.6);
    ndc+=vec2(sin(ndc.y*3.6+t+phase),cos(ndc.x*3.1-t*.72+phase))*(.025+.065*proximity);
    vec2 xy=ndc*uHalfView*depthScale;
    if(aSeed.w<.32){
     float a=phase*3.0+t*.25,r=(.18+aSeed.z*.65);
     xy=(uFocus+vec2(cos(a)*uHalfView.x*.5,sin(a)*uHalfView.y*.8)*r)*depthScale;
    }
    if(uActive>.01){
     if(uMode>2.5&&uMode<3.5){
      float angle=phase*2.0+t*.8+aSeed.y*3.0;
      vec2 spiral=(uHand*.2+vec2(cos(angle)*uHalfView.x*(.12+.65*aSeed.z),aSeed.y*uHalfView.y*1.1))*depthScale;
      xy=mix(xy,spiral,uActive*.4);
     }
     if(uMode>4.5){
      vec2 delta=(uHand*depthScale-xy);float influence=exp(-length(delta)/(uHalfView.y*1.5));
      xy+=delta*influence*uActive*.55;
     }
     if(uMode>3.5&&uMode<4.5)xy.y+=sin(length(xy-uHand*depthScale)*.09-uTime*.65)*2.0*uActive;
    }
    vec2 toHand=uHand*depthScale-xy;xy+=toHand*exp(-length(toHand)/10.0)*.12*uHandStrength;
    z+=sin(t*.55+phase)*2.5;
    vec4 mv=modelViewMatrix*vec4(xy,z,1.0);
    float apparentDepth=94.0/max(24.0,-mv.z);
    float radius=(.65+aSeed.w*1.3+nearLayer*1.7)*apparentDepth;
    vKind=floor(aSeed.w*5.0);vPhase=phase;vSoft=nearLayer;
    float stretch=vKind>2.5&&vKind<3.5?3.8:1.0;
    vec2 corner=position.xy*vec2(radius*stretch,radius);
    float a=phase+t*.14;corner=mat2(cos(a),-sin(a),sin(a),cos(a))*corner;
    vec4 clip=projectionMatrix*mv;
    clip.xy+=corner*uPixelRatio*2.0/uResolution*clip.w;
    gl_Position=clip;vUv=position.xy;
    vec3 bronze=vec3(.24,.44,.34),cyan=vec3(.32,.72,.72),gold=vec3(.86,.64,.28),white=vec3(.92,.86,.69);
    vColor=aSeed.w<.42?bronze:aSeed.w<.68?cyan:aSeed.w<.95?gold:white;
    vAlpha=(.24+middle*.18-nearLayer*.06)*(.65+.35*aSeed.z)*(.85+.15*sin(t+phase));
    vAlpha*=1.0+uActive*.32;
   }
  `,
  fragmentShader:/* glsl */`
   varying vec2 vUv; varying vec3 vColor; varying float vAlpha,vKind,vPhase,vSoft;
   uniform float uEnergy;
   ${particleSafetyGLSL}
   void main(){
    vec2 p=vUv;float shape;
    if(vKind<.5)shape=exp(-dot(p,p)*3.7)*.8;
    else if(vKind<1.5)shape=(1.0-smoothstep(.55,.94,abs(p.x)+abs(p.y)))*(.65+.35*p.y);
    else if(vKind<2.5)shape=(1.0-smoothstep(.65,.98,max(abs(p.x),abs(p.y))))*(.45+.4*p.x);
    else if(vKind<3.5)shape=(1.0-smoothstep(.18,.65,abs(p.y)))*(1.0-smoothstep(.6,1.0,abs(p.x)));
    else shape=exp(-dot(p,p)*4.8)+exp(-dot(p,p)*1.5)*.12;
    shape=mix(shape,exp(-dot(p,p)*3.2)*.5,vSoft*.65);
    if(length(p)>1.2)discard;
    float alpha=shape*vAlpha*readableArea(gl_FragCoord.xy/uResolution);
    gl_FragColor=vec4(vColor*(1.0+uEnergy*.18),alpha);
   }
  `});
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
 let disposed=false,lost=false,width=0,height=0,dpr=0,time=0,cleared=false;
 function onLost(event){event.preventDefault();lost=true;onStatus('lost');}
 function onRestored(){lost=false;cleared=false;onStatus('ready');}
 canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);
 onStatus('ready');
 return {
  get available(){return !disposed&&!lost;},
  resize(w,h,ratio=1){if(disposed||w<=0||h<=0||width===w&&height===h&&dpr===ratio)return;width=w;height=h;dpr=ratio;renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);uniforms.uResolution.value.set(canvas.width,canvas.height);uniforms.uPixelRatio.value=ratio;cleared=false;},
  layout({rects,focus}){uniforms.uFocus.value.set(focus.x,focus.y);uniforms.uProtectedCount.value=rects.length;rects.forEach((r,i)=>uniforms.uProtected.value[i].fromArray(r));},
  update(dt,{quality,active=false,mode='image',pointer,energy=0}={}){
   if(disposed||lost)return;
   geometry.instanceCount=quality.ambientCount;
   if(!quality.ambientCount){if(!cleared){renderer.clear();cleared=true;}return;}
   cleared=false;time+=dt*quality.motionScale;
   const still=quality.motionScale===0;
   uniforms.uTime.value=time;uniforms.uEnergy.value=still?0:energy;
   if(still)uniforms.uActive.value=0;else uniforms.uActive.value+=(Number(active)-uniforms.uActive.value)*Math.min(1,dt*3);
   uniforms.uMode.value=still?0:({image:1,scatter:2,vortex:3,wave:4,implode:5})[mode]||0;
   view.copy(camera);view.updateMatrixWorld();const halfH=Math.tan(camera.fov*Math.PI/360)*camera.position.z;
   uniforms.uHalfView.value.set(halfH*camera.aspect,halfH);uniforms.uCameraZ.value=camera.position.z;
   uniforms.uHandStrength.value=pointer?.visible&&quality.motionScale>0?1:0;
   if(pointer?.visible)uniforms.uHand.value.set(pointer.x*halfH*camera.aspect,pointer.y*halfH);else uniforms.uHand.value.copy(uniforms.uFocus.value);
   renderer.render(scene,view);
  },
  dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();},
 };
}
