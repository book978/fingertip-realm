const ids=['mask','bird','tree','shadow'];
export function createJourneyState(){
 let state;const clone=v=>structuredClone(v);
 function restart(){state={screen:'home',activeChapterId:'mask',completedIds:[],unlockedIds:['mask'],snapshots:{}};}
 restart();
 return {
  open(){state.screen='stage';return state.activeChapterId;},backHome(){state.screen='home';},
  saveCurrent(snapshot,{complete=false}={}){const id=state.activeChapterId;state.snapshots[id]=clone(snapshot);state.completedIds=ids.filter(i=>i===id?complete:state.completedIds.includes(i));},
  advance(){const index=ids.indexOf(state.activeChapterId);if(index===3||!state.completedIds.includes(state.activeChapterId))return null;const id=ids[index+1];if(!state.unlockedIds.includes(id))state.unlockedIds.push(id);state.activeChapterId=id;state.screen='stage';return id;},
  visit(id){if(!state.unlockedIds.includes(id))return false;state.activeChapterId=id;state.screen='stage';return true;},
  resetCurrent(){delete state.snapshots[state.activeChapterId];state.completedIds=state.completedIds.filter(id=>id!==state.activeChapterId);},
  restart,finish(){if(state.activeChapterId!=='shadow'||state.completedIds.length!==4)return false;state.screen='ending';return true;},
  getSnapshot(){return clone(state);}
 };
}
