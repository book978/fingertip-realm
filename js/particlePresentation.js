import {createParticleQuality} from './particleQuality.js?v=immersive1';
import {createFullscreenParticles} from './fullscreenParticles.js?v=immersive1';
import {normalizeProtectedRects} from './particleSafety.js?v=immersive1';

const protectedSelector='.site-header,#screen-home .hero-copy,#screen-home .artifact-caption,#screen-home .home-bottom,#screen-home .vertical-note,#screen-studio .chapter-nav,#screen-studio .studio-heading,#screen-studio .progress-panel,#screen-studio .guide-panel,#screen-studio .camera-preview,#screen-studio .stage-instruction,#screen-studio .studio-bottom,#screen-ending .ending-copy,#screen-ending .ending-bottom';

export function createParticlePresentation({particles,canvas,reducedMotion=false}){
 const setting=document.getElementById('environment-particle-setting'),status=document.getElementById('environment-particle-status');
 const quality=createParticleQuality({deviceMemory:navigator.deviceMemory,hardwareConcurrency:navigator.hardwareConcurrency,pixelRatio:devicePixelRatio,reducedMotion});
 let state='ready',lastQuality='',disposed=false;
 const field=createFullscreenParticles({canvas,camera:particles.camera,onStatus:s=>{state=s;lastQuality='';}});
 function change(){quality.setPreference(setting.value);lastQuality='';}
 setting.addEventListener('change',change);
 return {field,
  layout(focus){
   const rects=normalizeProtectedRects([...document.querySelectorAll(protectedSelector)].map(el=>el.getBoundingClientRect()),innerWidth,innerHeight);
   particles.setProtectedRects(rects);field.layout({rects,focus});
  },
  update(dt,elapsedSec,details){
   if(disposed)return;
   quality.sample(elapsedSec*1000);const budget=quality.getSnapshot();
   const key=[budget.level,budget.preference,budget.pixelRatio,state].join(':');
   if(key!==lastQuality){
    particles.setParticleBudget(budget.relicCount);particles.setPixelRatio(budget.pixelRatio);lastQuality=key;
    status.textContent=state==='ready'?`环境 ${budget.ambientCount.toLocaleString()} · 文物最多 ${budget.relicCount.toLocaleString()} 颗 · 按设备性能调整。${reducedMotion?' 已遵循系统减少动态设置。':''}`:state==='lost'?'环境粒子暂时暂停，正在等待图形恢复；舞台仍可操作。':'当前设备无法开启额外粒子层，已保留原有文物舞台。';
   }
   field.resize(innerWidth,innerHeight,budget.pixelRatio);
   field.update(dt,{...details,quality:budget});
  },
  dispose(){if(disposed)return;disposed=true;setting.removeEventListener('change',change);field.dispose();},
 };
}
