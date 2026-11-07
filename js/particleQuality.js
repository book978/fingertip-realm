const profiles = [
 {ambientCount:1000,relicCount:5000,pixelRatio:.85},
 {ambientCount:2400,relicCount:8500,pixelRatio:1.1},
 {ambientCount:4200,relicCount:12000,pixelRatio:1.5},
];

/** Time-window feedback, with a much slower recovery than degradation. */
export function createParticleQuality({deviceMemory=8,hardwareConcurrency=8,pixelRatio=1,reducedMotion=false}={}){
 const ceiling=deviceMemory<=2||hardwareConcurrency<=2?0:deviceMemory<=4||hardwareConcurrency<=4?1:2;
 let level=ceiling,preference='auto',windowMs=0,frames=0,headroomMs=0;
 function getSnapshot(){
  const selected=preference==='reduced'||reducedMotion?Math.min(level,1):level,p=profiles[selected];
  return {level:selected,preference,ambientCount:preference==='off'?0:p.ambientCount,relicCount:p.relicCount,
   pixelRatio:Math.min(pixelRatio,p.pixelRatio),motionScale:preference==='still'||preference==='off'?0:preference==='reduced'||reducedMotion?.18:1};
 }
 return {getSnapshot,setPreference(value){if(['auto','reduced','still','off'].includes(value))preference=value;},
  sample(ms){
   // Visibility gaps, debugger stops and resource uploads are not sustained GPU pressure.
   if(!Number.isFinite(ms)||ms<=0||ms>250)return;
   windowMs+=ms;frames++;
   if(windowMs<1500)return;
   const average=windowMs/frames;
   if(average>32&&level>0){level--;headroomMs=0;}
   else if(average<19){headroomMs+=windowMs;if(headroomMs>=12000&&level<ceiling){level++;headroomMs=0;}}
   else headroomMs=0;
   windowMs=0;frames=0;
  },
 };
}
