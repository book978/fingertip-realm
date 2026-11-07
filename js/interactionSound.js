import {SOUND_CUES} from './soundCues.js?v=0.4.0';
export function createSceneSoundEvents(){let scene=null,mode='normal',turning=false;return {sample(s){const cues=[];if(s.screen!=='stage')scene=null;if(s.screen==='stage'&&!s.paused&&s.audioReady!==false){if(scene!==s.id){cues.push(({mask:'mask-appear',tree:'tree-rise',shadow:'figure-arrive'})[s.id]||'chapter');scene=s.id;}else{if(s.mode!==mode){const key=({explode:'explode',slice:'slice',restore:'restore',rotate:'rotate'})[s.mode];if(key)cues.push(key);}if(s.turning&&!turning)cues.push('rotate');}}mode=s.mode;turning=s.turning;return cues;}};}
export function createInteractionSound({engine}){
 let enabled=false,paused=false,disposed=false,volume=.7;const last=new Map();let busy=[];
 function boundary(){busy=[];engine.stopCues();}
 return {
  setEnabled(on){if(disposed)return;enabled=!!on;if(enabled){if(!engine.started)engine.start({ambient:false});if(!paused)engine.resume();else engine.suspend();engine.setCueVolume(volume);}else{boundary();engine.suspend();}},
  setVolume(v){if(!Number.isFinite(v))return;volume=Math.max(0,Math.min(1,v));if(engine.started)engine.setCueVolume(volume);},
  emit(kind,now){const score=SOUND_CUES[kind];if(disposed||!enabled||paused||!score||!Number.isFinite(now))return false;busy=busy.filter(t=>t>now);if(busy.length>=2||now-(last.get(kind)??-Infinity)<score.cooldown)return false;
   if(engine.playCue(kind)===false)return false;last.set(kind,now);busy.push(now+score.duration*1000);return true;
  },boundary,
  setPaused(on){on=!!on;if(paused===on||disposed)return;paused=on;if(on){boundary();engine.suspend();}else if(enabled)engine.resume();},
  getSnapshot(){return {enabled,paused,volume,disposed};},
  dispose(){if(disposed)return;boundary();disposed=true;enabled=false;last.clear();engine.dispose();},
 };
}
