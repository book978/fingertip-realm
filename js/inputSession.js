export function createInputSession({staleCameraMs=250,onSample=()=>{}}={}){
 let source='pointer',latest=null;
 return {setSource(s){source=s;latest=null;},cancel(){latest=null;},
 accept(s){if(s.source===source&&Number.isFinite(s.timeMs)&&Number.isFinite(s.x)&&Number.isFinite(s.y)){latest={...s};if(source==='pointer')onSample({...latest});}},
 read(now){if(!latest)return null;return {...latest,capturedAtMs:latest.timeMs,timeMs:now,visible:latest.visible&&(source!=='camera'||now-latest.timeMs<=staleCameraMs)};}};
}
