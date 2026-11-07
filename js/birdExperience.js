const ids=['beak','wing','tail'];
export function createBirdExperience({dwellMs=450}={}){
 let observed,active,dwell,progress,light;
 function reset(){observed=[];active=null;dwell=null;progress=0;light={x:0,y:0,visible:false};}
 function observe(id){if(!ids.includes(id))return false;if(!observed.includes(id))observed.push(id);active=id;dwell=null;progress=0;return true;}
 reset();return {reset,observe,
 handleInput(s,p){light={x:s.x,y:s.y,visible:s.visible};if(!s.visible||s.pressed||!ids.includes(p.hotspotId)){dwell=null;progress=0;return;}active=p.hotspotId;if(observed.includes(active)){dwell=null;progress=0;return;}if(dwell?.id!==active)dwell={id:active,since:s.timeMs};},
 tick(now){if(dwell){progress=Math.min(1,Math.max(0,(now-dwell.since)/dwellMs));if(progress>=1)observe(dwell.id);}},
 cancelInput(){dwell=null;progress=0;light.visible=false;},restore(s){reset();observed=ids.filter(id=>s?.observedIds?.includes(id));},
 getSnapshot(){return {phase:observed.length===3?'complete':'observe',complete:observed.length===3,observedIds:[...observed],activeHotspotId:active,dwellProgress:progress,light:{...light}};}
 };
}
