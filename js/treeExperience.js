import {createDragSession} from './dragSession.js?v=awakening1';
export function createTreeExperience({baseY=-22,topY=23}={}){
 const grab=createDragSession();let progress=0,offset=0;
 const emberY=()=>baseY+progress*(topY-baseY);
 function reset(){progress=0;grab.cancel();}
 return {reset,cancelInput(){grab.cancel();},tick(now){grab.tick(now);},
 handleInput(s,p){const g=grab.step(s,p.handleId);if(!s.visible||!Number.isFinite(p.point?.y))return;if(g.started)offset=emberY()-p.point.y;if(g.active)progress=Math.max(progress,Math.min(1,Math.max(0,(p.point.y+offset-baseY)/(topY-baseY))));},
 lightNextLevel(){progress=Math.min(1,(Math.floor(progress*3+1e-8)+1)/3);},restore(s){reset();if(Number.isFinite(s?.progress))progress=Math.min(1,Math.max(0,s.progress));},
 getSnapshot(){return {complete:progress>=1,progress,litLevels:Math.min(3,Math.floor(progress*3+1e-8)),grabbedId:grab.id,ember:{x:0,y:emberY()}};}
 };
}
