export function createLocalLandmarker({signal}={}){
 // Legacy Hands leaves an initialized window.Module with aborting accessors.
 // A separate same-origin realm keeps both Emscripten runtimes independent.
 return new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe');frame.hidden=true;frame.dataset.faceRuntime='';frame.title='本地面部识别运行环境';
  frame.setAttribute('aria-hidden','true');frame.src=new URL('./faceRuntime.html?v=isolated-20261023',import.meta.url).href;
  let settled=false;
  const detach=()=>{signal?.removeEventListener('abort',abort);frame.remove();};
  function fail(error){if(settled)return;settled=true;detach();reject(error);}
  function abort(){fail(new DOMException('面部识别启动已取消','AbortError'));}
  frame.onerror=()=>fail(new Error('本地面部识别运行环境未能加载'));
  frame.onload=async()=>{
   try{
    if(settled)return;
    const create=frame.contentWindow?.createFaceLandmarker;
    if(typeof create!=='function')throw new Error('本地面部识别运行环境初始化失败');
    const model=await create();
    if(settled){model.close();return;}
    settled=true;signal?.removeEventListener('abort',abort);let closed=false;
    resolve({detectForVideo:(...args)=>model.detectForVideo(...args),close(){if(closed)return;closed=true;try{model.close();}finally{detach();}}});
   }catch(error){fail(error);}
  };
  signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted)abort();else document.body.append(frame);
 });
}
export function describeFaceTrackingError(error){
 const name=error?.name||'Error',stage=error?.stage;
 if(name==='NotAllowedError'||name==='SecurityError')return '摄像头访问被浏览器或系统阻止（'+name+'）。请在 Edge 地址栏的网站权限中允许摄像头；若已允许，请检查 Windows 是否允许桌面应用访问摄像头，然后重试。';
 if(name==='NotFoundError'||name==='DevicesNotFoundError')return '没有找到可用摄像头（'+name+'）。请连接或启用摄像头后重试。';
 if(name==='NotReadableError'||name==='TrackStartError')return '摄像头无法启动（'+name+'）。请关闭其他摄像头页面、相机或会议软件，确认摄像头未被占用后重试。';
 if(name==='TimeoutError')return ({camera:'等待摄像头响应超时。请检查 Edge 的摄像头授权提示，再点击重试。',model:'面部识别模型加载超时，摄像头已释放。请刷新当前页面后重试。',video:'摄像头已连接，但画面启动超时。请关闭其他使用摄像头的程序后重试。'})[stage]||'识别响应超时，请重试。';
 const label=({camera:'摄像头连接',model:'面部识别模型加载',video:'摄像头画面播放',inference:'面部识别运行'})[stage]||'试戴启动';
 return label+'失败（'+name+'）：'+(error?.message||'未知错误')+'。请刷新当前页面后重试。';
}
export function createFaceTracker({video,camera,factory=createLocalLandmarker,onStatus=()=>{},onResult=()=>{},timeouts={}}){
 let generation=0,pending=null,lease=null,tracker=null,status='idle',error=null,lastTime=-1,lastInference=-Infinity;
 const limits={camera:30000,model:20000,video:10000,...timeouts},cancellations=new Set();
 function state(value,details=null){status=value;error=value==='error'||value==='denied'?details:null;onStatus(value,details);}
 function bounded(operation,stage,disposeLate=()=>{},onCancel=()=>{}){
  return new Promise((resolve,reject)=>{
   let settled=false;
   function finish(callback,value){if(settled)return false;settled=true;clearTimeout(timer);cancellations.delete(cancel);callback(value);return true;}
   const cancel=()=>{if(finish(reject,Object.assign(new Error('试戴已取消'),{name:'AbortError'})))onCancel();};
   const timer=setTimeout(()=>{if(finish(reject,Object.assign(new Error(stage+' startup timed out'),{name:'TimeoutError'})))onCancel();},limits[stage]);
   cancellations.add(cancel);
   try{Promise.resolve(operation()).then(value=>{if(!finish(resolve,value))Promise.resolve().then(()=>disposeLate(value)).catch(()=>{});},reason=>finish(reject,reason));}
   catch(reason){finish(reject,reason);}
  });
 }
 async function stop(){generation++;pending=null;for(const cancel of cancellations)cancel();const owned=lease;lease=null;owned?.release();camera.release('face');video.pause?.();video.srcObject=null;const previous=tracker;tracker=null;lastTime=-1;lastInference=-Infinity;state('idle');try{await previous?.close?.();}catch{/* Camera was released before model disposal. */}}
 function fail(reason,stage,token){if(token!==generation)return;const details={stage,name:reason?.name||'Error',message:String(reason?.message||reason||'Unknown error')};void stop();state(reason?.name==='NotAllowedError'?'denied':'error',details);}
 async function begin(token){
  let stage='camera';state('requesting');try{
   const owned=await bounded(()=>camera.acquire('face',video),stage,value=>value?.release());if(token!==generation){owned?.release();return false;}if(!owned)return false;lease=owned;
   stage='model';state('loading',{stage});const loading=new AbortController();const model=await bounded(()=>factory({signal:loading.signal}),stage,value=>value?.close?.(),()=>loading.abort());
   if(token!==generation){await model.close?.();return false;}tracker=model;
   stage='video';state('loading',{stage});await bounded(()=>video.play(),stage);if(token!==generation)return false;state('tracking');return true;
  }catch(reason){fail(reason,stage,token);return false;}
 }
 return {get status(){return status;},get error(){return error?{...error}:null;},
  start(){if(pending)return pending;if(status==='tracking')return Promise.resolve(true);const token=++generation;const task=begin(token);pending=task;task.finally(()=>{if(pending===task)pending=null;});return task;},stop,
  process(now){
   if(status!=='tracking'||!tracker||video.readyState<2||video.currentTime===lastTime||now-lastInference<66)return;
   lastTime=video.currentTime;lastInference=now;
   try{const result=tracker.detectForVideo(video,now);onResult(result,now);}catch(reason){fail(reason,'inference',generation);}
  },
 };
}
