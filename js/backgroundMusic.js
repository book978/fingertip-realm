export function createBackgroundMusic({createAudio=()=>new Audio(),url,onStatus=()=>{},fadeMs=400}={}){
 const media=createAudio();media.src=url;media.loop=true;media.preload='none';media.volume=0;
 let enabled=false,hidden=false,disposed=false,volume=.7,chapterId='mask',status='off',generation=0,animation=null;
 const snapshot=()=>({enabled,status,volume,chapterId});
 const publish=s=>{status=s;onStatus(snapshot());};
 const target=()=>enabled&&!hidden?volume*.22*(chapterId==='shadow'?.5:1):0;
 function fade(value,after){if(animation!==null)cancelAnimationFrame(animation);animation=null;if(!fadeMs||typeof requestAnimationFrame==='undefined'){media.volume=value;after?.();return;}const start=performance.now(),from=media.volume;function step(now){const t=Math.min(1,(now-start)/fadeMs);media.volume=Math.max(0,Math.min(1,from+(value-from)*t));if(t<1)animation=requestAnimationFrame(step);else{animation=null;after?.();}}animation=requestAnimationFrame(step);}
 async function start(){const request=++generation;if(disposed||hidden||!enabled)return false;publish('loading');try{await media.play();if(request!==generation||disposed||hidden||!enabled){if(disposed||hidden||!enabled)media.pause();return false;}publish('playing');fade(target());return true;}catch{if(request===generation&&!disposed&&enabled&&!hidden)publish('error');return false;}}
 function loopFade(){if(animation!==null||status!=='playing')return;const d=media.duration,t=media.currentTime;const gain=Number.isFinite(d)?Math.min(1,t/.4,(d-t)/.4):1;media.volume=target()*Math.max(0,gain);}
 function error(){if(enabled&&!disposed){++generation;media.pause();publish('error');}}
 media.addEventListener('timeupdate',loopFade);media.addEventListener('error',error);
 return {getSnapshot:snapshot,
 async setEnabled(on){if(disposed)return false;enabled=!!on;if(enabled){if(status==='playing'||status==='loading')return true;if(hidden){publish('paused');return false;}return start();}++generation;publish('off');fade(0,()=>{if(!enabled)media.pause();});return false;},
 setVolume(v){if(Number.isFinite(v)){volume=Math.max(0,Math.min(1,v));fade(target());}},
 setChapter(id){chapterId=id;fade(target());},
 setHidden(on){hidden=!!on;if(hidden){++generation;if(animation!==null){cancelAnimationFrame(animation);animation=null;}media.volume=0;media.pause();publish(enabled?'paused':'off');}else if(enabled)start();},
 dispose(){disposed=true;enabled=false;++generation;if(animation!==null)cancelAnimationFrame(animation);media.pause();media.removeEventListener('timeupdate',loopFade);media.removeEventListener('error',error);media.removeAttribute?.('src');publish('off');}
 };
}
