/** On-demand export only: no camera, DOM capture, extra RAF, or per-frame allocation. */
export function createCanvasComposite(sources,createCanvas=()=>document.createElement('canvas')){
 const canvas=createCanvas(),ctx=canvas.getContext('2d');let locked=false;
 if(!ctx)throw new Error('当前浏览器无法合成留影');
 function draw(){
  const source=sources[0];
  if(!locked&&(canvas.width!==source.width||canvas.height!==source.height)){canvas.width=source.width;canvas.height=source.height;}
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(const item of sources)if(item.width&&item.height)ctx.drawImage(item,0,0,canvas.width,canvas.height);
  return canvas;
 }
 return {canvas,draw,begin(){draw();locked=true;return canvas;},end(){locked=false;},get recording(){return locked;}};
}
