import {PERFORMANCE_SECONDS} from './awakeningData.js?v=awakening1';
export function createCompletionDirector({chapterId,reduceMotion=false}){
 const durationSec=reduceMotion?.4:PERFORMANCE_SECONDS[chapterId]??5;let status='idle',elapsedSec=0,completed=false,paused=false,cues=[];
 const api={start({replay=false}={}){if(status==='playing'||completed&&!replay)return false;status='playing';elapsedSec=0;cues=[];return true;},
 advance(dtSec){if(paused||status!=='playing')return;const before=elapsedSec/durationSec;elapsedSec=Math.min(durationSec,elapsedSec+Math.max(0,Number.isFinite(dtSec)?dtSec:0));if(durationSec-elapsedSec<1e-9)elapsedSec=durationSec;
 if(chapterId==='bird'&&before<.28&&elapsedSec/durationSec>=.28)cues.push('bird-call');
 if(elapsedSec>=durationSec){status='done';completed=true;}},
 skip(){if(status!=='playing')return false;elapsedSec=durationSec;status='done';completed=true;cues=[];return true;},
 pause(on){paused=!!on;},cancel(){status=completed?'done':'idle';elapsedSec=completed?durationSec:0;cues=[];},
 reset(){status='idle';elapsedSec=0;completed=false;paused=false;cues=[];},
 restore(saved){completed=!!saved?.completed;status=completed?'done':'idle';elapsedSec=completed?durationSec:0;paused=false;cues=[];},
 getSnapshot(){return {status,elapsedSec,durationSec,progress:elapsedSec/durationSec,completed};},drainCues(){const list=cues;cues=[];return list;}};return api;
}
