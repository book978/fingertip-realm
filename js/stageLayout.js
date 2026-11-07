export function fitStage({viewportWidth,viewportHeight,stageRect,fov=42,cameraZ=94,spanW=64,spanH=58}){
 const width=Math.max(1,viewportWidth||1280),height=Math.max(1,viewportHeight||720),halfH=Math.tan(fov*Math.PI/360)*Math.abs(cameraZ||94),halfW=halfH*width/height;
 const r=stageRect?.width>0&&stageRect?.height>0?stageRect:{x:width*.2,y:height*.16,width:width*.6,height:height*.68};
 return {scale:Math.max(.0001,Math.min(halfW*2*r.width/width/Math.max(1,spanW),halfH*2*r.height/height/Math.max(1,spanH))*.9),position:{x:((r.x+r.width/2)/width*2-1)*halfW,y:(1-(r.y+r.height/2)/height*2)*halfH,z:0}};
}
