import {createCompletionDirector} from './completionDirector.js?v=awakening1';
export function createChapterSession({chapterId,motion,reduceMotion=false}){
 const director=createCompletionDirector({chapterId,reduceMotion});let paused=false;
 const blocked=()=>paused||director.getSnapshot().status==='playing';
 const settle=()=>{motion.cancelInput();motion.drainCues();motion.settlePerformance?.();};
 const api={handleInput(frame,probe){if(!blocked())motion.handleInput(frame,probe);},trigger(action,nowMs){return blocked()?false:motion.trigger(action,nowMs);},
 tick(nowMs,dtSec){if(paused)return;if(director.getSnapshot().status==='playing'){director.advance(dtSec);if(director.getSnapshot().status==='done')settle();}else motion.tick(nowMs,dtSec);},
 cancelInput(){motion.cancelInput();},beginPerformance(options){if(paused)return false;const started=director.start(options);if(started){motion.cancelInput();motion.drainCues();}return started;},
 skipPerformance(){if(director.skip()){settle();return true;}return false;},cancelPerformance(){director.cancel();motion.cancelInput();motion.drainCues();},
 setPaused(on){paused=!!on;director.pause(paused);if(paused){motion.cancelInput();motion.drainCues();}},
 reset(){director.reset();motion.reset();},restore(saved){motion.restore(saved?.motion);director.restore(saved?.performance);paused=false;},
 getSnapshot(){const performance=director.getSnapshot();return structuredClone({chapterId,complete:performance.completed,motion:motion.getSnapshot(),performance});},
 finishEntrance(){motion.finishEntrance?.();},settleForm(){motion.settlePerformance?.();},
 drainCues(){return paused?[]:[...motion.drainCues(),...director.drainCues()];}};
 for(const method of ['setZoom','setRole','setBackdrop','setControlMode','setDepth','setPose','setView'])api[method]=value=>{if(blocked()||!motion[method])return false;if(['setRole','setControlMode'].includes(method))motion.cancelInput();return motion[method](value)!==false;};
 return api;
}
