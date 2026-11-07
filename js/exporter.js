import {CONFIG} from './config.js?v=awakening1';
export function createRecordingSaver({takeRecording,saveRecording,onSaved=()=>{},onError=()=>{}}){
 let pending=null;
 return {
  get busy(){return pending!==null;},
  stop(){
   if(pending)return pending;
   const recording=takeRecording();if(!recording)return;
   pending=Promise.resolve().then(()=>saveRecording(recording)).then(onSaved,onError).finally(()=>{pending=null;});
   return pending;
  }
 };
}
export class Exporter {
 static async saveImage(canvas,filename){
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('图像导出失败');
  const name=filename||'青铜与灯影-'+timestamp()+'.png';downloadBlob(blob,name);return name;
 }
 static startRecording(canvas,{filenamePrefix='青铜与灯影',onError=()=>{}}={}){
  if(!canvas.captureStream||typeof MediaRecorder==='undefined')throw new Error('当前浏览器不支持录制，请使用保存留影。');
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime)throw new Error('当前浏览器不支持 WebM，请使用保存留影。');
  const stream=canvas.captureStream(30),cleanup=()=>stream.getTracks().forEach(t=>t.stop());let recorder;
  try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:CONFIG.export.videoBitsPerSecond});}catch(e){cleanup();throw e;}
  const chunks=[];let settled=false,resolveDone,rejectDone;
  const done=new Promise((resolve,reject)=>{resolveDone=resolve;rejectDone=reject;});done.catch(()=>{});
  function fail(error,notify=true){
   if(settled)return;settled=true;cleanup();rejectDone(error);
   try{if(recorder.state!=='inactive')recorder.stop();}catch{}
   if(notify)onError(error);
  }
  recorder.ondataavailable=e=>{if(e.data.size&&!settled)chunks.push(e.data);};
  recorder.onerror=e=>fail(e.error||new Error('录制失败'));
  recorder.onstop=()=>{if(settled)return;settled=true;cleanup();resolveDone({blob:new Blob(chunks,{type:mime}),name:filenamePrefix+'-'+timestamp()+'.webm'});};
  try{recorder.start(250);}catch(e){cleanup();throw e;}
  return {
   get recording(){return !settled&&recorder.state==='recording';},
   stop(){if(!settled&&recorder.state!=='inactive'){try{recorder.stop();}catch(e){fail(e);}}return done;},
   cancel(){fail(new Error('录制已取消'),false);}
  };
 }
 static async saveRecording(recording){const {blob,name}=await recording.stop();if(!blob.size)throw new Error('空录制');downloadBlob(blob,name);return name;}
 static hooks=[];
 static registerExportHook(fn){Exporter.hooks.push(fn);}
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function timestamp(){const d=new Date(),pad=n=>String(n).padStart(2,'0');return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());}
