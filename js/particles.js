/**
 * 粒子系统 —— 《指尖造境》
 *
 * 核心继承自原开源项目 ppongtong/gesture-particle (MIT)：
 *   - 扁平 Float32Array 数据缓冲
 *   - 弹簧-阻尼物理（stepPhysics）
 *   - 自定义 GLSL + AdditiveBlending 发光着色器
 *   - HSL 调色板逐帧插值
 *
 * 新增能力：
 *   - uTime / uEnergy uniform：微光闪烁与音频能量响应
 *   - colorTargets 通道：图像模式可将粒子颜色平滑过渡到图像采样色
 *   - 指针视差支持（无摄像头时的回退控制）
 */

import * as THREE from 'three';
import { CONFIG } from './config.js?v=awakening1';
import { computeFormationTargets } from './formations.js?v=immersive1';
import {createFieldSeeds,writeViewportTargets,blendFormationTargets} from './particleFieldMath.js?v=immersive1';
import {particleSafetyGLSL} from './particleSafety.js?v=immersive1';

const N = CONFIG.particles.count;
const GOLDEN = (1 + Math.sqrt(5)) / 2;

export class ParticleSystem {
  /**
   * @param {HTMLCanvasElement} canvas 主渲染画布
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.time = 0;
    this.mode = 'idle';
    this.energy = 0;          // 音频/交互能量 0–1，驱动粒子尺寸与亮度
    this.pointerX = 0;        // 指针视差 -1–1
    this.pointerY = 0;
    this.culturalStage = false;
    this.activeCount=N;this.particleBudget=N;this.physicsTime=0;this.transitionTime=2;
    this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.fieldSeeds=createFieldSeeds(N);this.transitionFrom=new Float32Array(N*3);

    // ─── 渲染器 ───────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      preserveDrawingBuffer: true, // 支持导出静态图像
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x03040a, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      window.innerWidth / window.innerHeight,
      CONFIG.camera.near,
      CONFIG.camera.far
    );
    this.camera.position.set(0, 0, CONFIG.camera.z);
    this.camera.lookAt(0, 0, 0);

    this.onResize=()=>this.handleResize();window.addEventListener('resize',this.onResize);

    // ─── 粒子数据缓冲（原版结构）────────────────────────────
    this.pos = new Float32Array(N * 3);
    this.vel = new Float32Array(N * 3);
    this.tgt = new Float32Array(N * 3);
    this.col = new Float32Array(N * 3);
    this.sz = new Float32Array(N);
    this.hues = new Float32Array(N);
    this.sphereOff = new Float32Array(N * 3);
    this.scatterTgt = new Float32Array(N * 3);
    this.colorTargets = null; // 图像模式目标颜色（Float32Array N*3 或 null）

    // 调色板状态（HSL 0–1）
    this.palH = CONFIG.palettes.idle.h;
    this.palS = CONFIG.palettes.idle.s;
    this.palL = CONFIG.palettes.idle.l;
    this.tgtH = this.palH;
    this.tgtS = this.palS;
    this.tgtL = this.palL;

    // 滑动冲量（原版机制）
    this.swipeX = 0;
    this.swipeY = 0;

    this._initBuffers();
    this._buildGeometry();

    // 图像形态目标（由 ImageToParticles 模块写入）
    this.imageTargets = null;
  }

  _initBuffers() {
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;

      // Fibonacci 球面初始化（原版算法）
      const lat = Math.acos(1 - 2 * (i + 0.5) / N);
      const lon = 2 * Math.PI * i / GOLDEN;
      const r = (1.5 + Math.random() * 1.5) * CONFIG.world.sphereR;
      this.pos[i3] = r * Math.sin(lat) * Math.cos(lon);
      this.pos[i3 + 1] = r * Math.cos(lat);
      this.pos[i3 + 2] = r * Math.sin(lat) * Math.sin(lon);

      this.vel[i3] = (Math.random() - 0.5) * 0.4;
      this.vel[i3 + 1] = (Math.random() - 0.5) * 0.4;
      this.vel[i3 + 2] = (Math.random() - 0.5) * 0.4;

      this.hues[i] = Math.random();
      this.sz[i] = 1.8 + Math.random() * 3.2;

      // 默认色：深蓝
      this.col[i3] = 0.1;
      this.col[i3 + 1] = 0.3;
      this.col[i3 + 2] = 1.0;

      // 预计算球体形态偏移
      const sR = CONFIG.world.sphereR * (0.88 + Math.random() * 0.24);
      this.sphereOff[i3] = sR * Math.sin(lat) * Math.cos(lon);
      this.sphereOff[i3 + 1] = sR * Math.cos(lat);
      this.sphereOff[i3 + 2] = sR * Math.sin(lat) * Math.sin(lon);
    }
    this.tgt.set(this.pos);
  }

  _buildGeometry() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.sz, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(this.hues,1));
    this.geo = geo;

    // 顶点着色器：在原版基础上加入时间微光与音频能量响应
    const vertexShader = /* glsl */ `
      uniform float uTime;
      uniform float uEnergy;
      attribute vec3  aColor;
      attribute float aSize;
      attribute float aSeed;
      uniform float uPixelRatio;
      varying vec3  vColor;
      varying float vTwinkle;
      varying float vSeed;

      void main() {
        vColor = aColor;
        vSeed = aSeed;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);

        // 每颗粒子有独立相位的微光闪烁，让静止画面依然“呼吸”
        float twinkle = 0.86 + 0.14 * sin(uTime * 1.6 + position.x * 0.35 + position.y * 0.27 + position.z * 0.19);
        vTwinkle = twinkle;

        gl_PointSize = clamp(aSize * twinkle * (1.0 + uEnergy * 0.2) * (160.0 / max(20.0,-mv.z)),1.0,9.0)*uPixelRatio;
        gl_Position  = projectionMatrix * mv;
      }
    `;

    // 片元着色器：亮核 + 光晕（原版结构，微调对比）
    const fragmentShader = /* glsl */ `
      varying vec3  vColor;
      varying float vTwinkle;
      varying float vSeed;
      uniform float uArtifactOpacity;
      ${particleSafetyGLSL}

      void main() {
        vec2  uv   = gl_PointCoord - 0.5;
        float dist = length(uv);
        if (dist > 0.5) discard;

        float angle=vSeed*6.28318;
        vec2 p=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*uv;
        float shape=vSeed<.35?abs(p.x)+abs(p.y):vSeed<.62?max(abs(p.x)*.7,abs(p.y)*1.8):dist;
        float core=1.0-smoothstep(.03,.28,shape);
        float halo=1.0-smoothstep(.08,.5,dist);
        float alpha=(core*.76+halo*.12)*readableArea(gl_FragCoord.xy/uResolution);
        vec3 bright=vColor*(1.0+core*.75)*vTwinkle;
        gl_FragColor = vec4(bright, alpha*uArtifactOpacity);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uArtifactOpacity:{value:1},
        uEnergy: { value: 0 },
        uPixelRatio:{value:this.renderer.getPixelRatio()},
        uResolution:{value:new THREE.Vector2(this.canvas.width,this.canvas.height)},
        uProtected:{value:Array.from({length:12},()=>new THREE.Vector4())},
        uProtectedCount:{value:0},
      },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });

    this.points = new THREE.Points(geo, this.material);
    this.scene.add(this.points);
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    if(this.material){this.material.uniforms.uResolution.value.set(this.canvas.width,this.canvas.height);this.material.uniforms.uPixelRatio.value=this.renderer.getPixelRatio();}
  }

  setParticleBudget(count){this.particleBudget=Math.max(1,Math.min(N,count));this.setParticleActivity(this.particleExperience);}
  setParticleActivity(active){this.particleExperience=!!active;this.activeCount=active?this.particleBudget:this.culturalStage?0:N;this.geo.setDrawRange(0,this.activeCount);}
  setProtectedRects(rects){this.material.uniforms.uProtectedCount.value=rects.length;rects.forEach((r,i)=>this.material.uniforms.uProtected.value[i].fromArray(r));}
  setPixelRatio(ratio){if(this.renderer.getPixelRatio()===ratio)return;this.renderer.setPixelRatio(ratio);this.handleResize();}

  /** 切换形态：更新调色板目标，预计算星散目标（原版逻辑保留） */
  setMode(newMode) {
    if (newMode === this.mode) return;
    this.mode = newMode;
    this.transitionFrom.set(this.pos);this.transitionTime=0;

    const pal = CONFIG.palettes[newMode] || CONFIG.palettes.idle;
    this.tgtH = pal.h;
    this.tgtS = pal.s;
    this.tgtL = pal.l;

    if (newMode === 'scatter') {
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const r = CONFIG.world.scatterR * (0.3 + Math.random() * 0.7);
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        this.scatterTgt[i3] = r * Math.sin(ph) * Math.cos(th);
        this.scatterTgt[i3 + 1] = r * Math.cos(ph);
        this.scatterTgt[i3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
    }

    // 离开图像模式时清除图像颜色目标，恢复调色板
    if (newMode !== 'image') {
      this.colorTargets = null;
    }
  }

  /** 供 ImageToParticles 模块写入目标位置与颜色 */
  setImageTargets(positions, colors) {
    this.imageTargets = positions;
    this.colorTargets = colors;
  }

  clearImageTargets() {
    this.imageTargets = null;
    this.colorTargets = null;
  }

  /** 转场脉冲：从中心向外的爆发（进入创作界面时使用） */
  burst(strength = 2.2) {
    const { pos, vel } = this;
    for (let i = 0; i < pos.length; i += 3) {
      const d = Math.hypot(pos[i], pos[i + 1], pos[i + 2]) || 1;
      const f = (strength * (0.5 + Math.random())) / d;
      vel[i] += pos[i] * f * 0.06;
      vel[i + 1] += pos[i + 1] * f * 0.06;
      vel[i + 2] += pos[i + 2] * f * 0.06;
    }
  }

  /** 指针视差（首页电影级运镜） */
  setPointerParallax(nx, ny) {
    this.pointerX = nx;
    this.pointerY = ny;
  }

  /** 每帧更新目标位置（委托 formations 模块） */
  updateTargets(t, handX, handY) {
    if(this.particleExperience&&this.mode!=='image'){
      const halfH=Math.tan(this.camera.fov*Math.PI/360)*this.camera.position.z;
      writeViewportTargets(this.tgt,this.fieldSeeds,{count:this.activeCount,mode:this.mode,time:t,halfH,halfW:halfH*this.camera.aspect,cameraZ:this.camera.position.z,handX,handY});
    }else computeFormationTargets(this,t,handX,handY);
    if(this.particleExperience)blendFormationTargets(this.tgt,this.transitionFrom,this.transitionTime/(this.reducedMotion?.35:1.35),this.activeCount,this.reducedMotion);
  }

  /** 弹簧-阻尼物理（原版算法 + 音频能量增强的湍流） */
  stepPhysics() {
    const { pos, vel, tgt, hues, swipeX, swipeY } = this;
    const K = CONFIG.particles.springK;
    const D = CONFIG.particles.damping;
    const noise = CONFIG.particles.noise * (1 + this.energy * 2.5);

    for (let i = 0; i < this.activeCount; i++) {
      const i3 = i * 3;

      const dx = tgt[i3] - pos[i3];
      const dy = tgt[i3 + 1] - pos[i3 + 1];
      const dz = tgt[i3 + 2] - pos[i3 + 2];

      vel[i3] += dx * K;
      vel[i3 + 1] += dy * K;
      vel[i3 + 2] += dz * K;

      vel[i3] += swipeX * (0.7 + hues[i] * 0.6);
      vel[i3 + 1] += swipeY * (0.7 + hues[i] * 0.6);

      vel[i3] += (Math.random() - 0.5) * noise;
      vel[i3 + 1] += (Math.random() - 0.5) * noise;
      vel[i3 + 2] += (Math.random() - 0.5) * noise;

      vel[i3] *= D;
      vel[i3 + 1] *= D;
      vel[i3 + 2] *= D;

      pos[i3] += vel[i3];
      pos[i3 + 1] += vel[i3 + 1];
      pos[i3 + 2] += vel[i3 + 2];
    }

    this.swipeX *= 0.82;
    this.swipeY *= 0.82;

    this.geo.attributes.position.needsUpdate = true;
  }

  /** 颜色更新：调色板插值 或 向图像颜色过渡 */
  updateColors() {
    const { col, sz, hues } = this;

    if (this.colorTargets) {
      // 图像模式：平滑过渡到图像采样色
      const rate = CONFIG.particles.imageColorLerp;
      const targets = this.colorTargets;
      for (let i = 0; i < this.activeCount; i++) {
        const i3 = i * 3;
        col[i3] += (targets[i3] - col[i3]) * rate;
        col[i3 + 1] += (targets[i3 + 1] - col[i3 + 1]) * rate;
        col[i3 + 2] += (targets[i3 + 2] - col[i3 + 2]) * rate;
      }
      this.geo.attributes.aColor.needsUpdate = true;
      return;
    }

    const spd = CONFIG.particles.colorLerp;
    this.palH += (this.tgtH - this.palH) * spd * 4;
    this.palS += (this.tgtS - this.palS) * spd;
    this.palL += (this.tgtL - this.palL) * spd;

    for (let i = 0; i < this.activeCount; i++) {
      const i3 = i * 3;
      if(this.culturalStage){
        const k=hues[i],light=.58+k*.5,gold=k>.72,cyan=k>.42&&k<=.72;
        col[i3]+=(light*(gold?.86:cyan?.3:.25)-col[i3])*.06;
        col[i3+1]+=(light*(gold?.66:cyan?.7:.46)-col[i3+1])*.06;
        col[i3+2]+=(light*(gold?.3:cyan?.73:.35)-col[i3+2])*.06;
      }else{
        // Allocation-free HSL conversion for the legacy non-cultural formations.
        const h=((this.palH+(hues[i]-.5)*.14)%1+1)%1,l=this.palL*(.6+sz[i]/12),a=this.palS*Math.min(l,1-l);
        for(let c=0;c<3;c++){const k=((c===0?0:c===1?8:4)+h*12)%12;col[i3+c]=l-a*Math.max(-1,Math.min(k-3,9-k,1));}
      }
    }
    this.geo.attributes.aColor.needsUpdate = true;
  }

  /** 相机缓慢环绕 + 指针视差（电影级运镜） */
  updateCamera() {
    const camAngle = this.time * CONFIG.camera.orbitSpeed;
    this.camera.position.x = Math.sin(camAngle) * CONFIG.camera.orbitAmpX + this.pointerX * 2.2;
    this.camera.position.y = Math.cos(camAngle * 0.7) * CONFIG.camera.orbitAmpY + this.pointerY * 1.6;
    this.camera.lookAt(0, 0, 0);
  }

  /** 主帧更新 */
  frame(dt, handX, handY) {
    this.time += dt;
    this.transitionTime+=dt;
    this.material.uniforms.uTime.value = this.time;
    this.material.uniforms.uEnergy.value = this.energy;

    if (!this.culturalStage) this.updateCamera();
    if(this.activeCount){
      this.updateTargets(this.time,handX,handY);
      this.physicsTime=Math.min(.05,this.physicsTime+dt);
      while(this.physicsTime>=1/60){this.stepPhysics();this.physicsTime-=1/60;}
      this.updateColors();
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose(){window.removeEventListener('resize',this.onResize);this.scene.remove(this.points);this.geo.dispose();this.material.dispose();this.renderer.dispose();}
}

export { N as PARTICLE_COUNT };
