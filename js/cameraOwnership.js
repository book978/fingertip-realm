/** A lease prevents a late grant or stale owner's close from affecting a newer camera. */
export function createCameraOwnership({mediaDevices=globalThis.navigator?.mediaDevices}={}){
 let generation=0,current=null,pendingOwner=null;
 function release(owner){
  if(owner&&owner!==current?.owner&&owner!==pendingOwner)return;
  generation++;pendingOwner=null;const previous=current;current=null;
  if(previous){previous.stream.getTracks().forEach(t=>t.stop());previous.video?.pause?.();if(previous.video?.srcObject===previous.stream)previous.video.srcObject=null;}
 }
 return {release,
  async acquire(owner,video){
   release();const token=++generation;pendingOwner=owner;
   try{
    if(!mediaDevices?.getUserMedia)throw new Error('当前浏览器无法使用摄像头');
    const stream=await mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});
    if(token!==generation){stream.getTracks().forEach(t=>t.stop());return null;}
    pendingOwner=null;current={owner,stream,video};if(video)video.srcObject=stream;
    return {stream,release(){if(token===generation)release(owner);}};
   }catch(error){if(token===generation){pendingOwner=null;current=null;}throw error;}
  },
  getSnapshot(){return {owner:current?.owner??pendingOwner,pending:!!pendingOwner,live:!!current};},
 };
}
