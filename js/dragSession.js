/** Shared grab lock and tracking grace for tree and shadow stages. */
export function createDragSession({lossGraceMs=300}={}){
 let id=null,down=false,armed=false,firstPointer=true,lostAt=null;
 function clear(pointerReady){id=null;down=false;armed=false;firstPointer=pointerReady;lostAt=null;}
 function tick(now){if(lostAt!==null&&now-lostAt>=lossGraceMs){id=null;down=false;armed=false;firstPointer=false;}}
 return {get id(){return id;},cancel(){clear(true);},tick,
 step(s,hit){
  if(!s.visible){if(lostAt===null)lostAt=s.timeMs;tick(s.timeMs);return {id,active:false};}
  if(lostAt!==null){tick(s.timeMs);lostAt=null;}
  if(!s.pressed&&s.armAllowed!==false)armed=true;
  let started=false,released=false,held=id;
  if(s.pressed&&!down&&(armed||(s.source==='pointer'&&firstPointer))){id=hit||null;held=id;started=!!id;firstPointer=false;}
  if(!s.pressed&&down){held=id;released=!!id;id=null;}
  down=s.pressed;
  return {id:held,started,released,active:!!id&&s.pressed};
 }};
}
