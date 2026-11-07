import {ParticleSystem} from './particles.js?v=immersive1';
import {createParticlePresentation} from './particlePresentation.js?v=immersive1';
import {createCanvasComposite} from './canvasComposite.js?v=immersive1';
import {createStageEnvironment} from './stageEnvironment.js?v=awakening1';
import {createJourneyState} from './journeyState.js?v=awakening1';
import {createInputSession} from './inputSession.js?v=0.4.4';
import {createChapterRuntime} from './chapterRuntime.js?v=0.4.4';
import {createParticleExperience} from './particleExperience.js?v=0.4.4';
import {createAwakeInputRouter} from './awakeInputRouter.js?v=0.4.4';
import {createFrameClock} from './frameClock.js?v=awakening1';
import {CHAPTERS} from './journeyData.js?v=0.4.4';
import {GestureController} from './gestures.js?v=journey3';
import {AudioEngine} from './audio.js?v=0.4.4';
import {createBackgroundMusic} from './backgroundMusic.js?v=awakening1';
import {Exporter,createRecordingSaver} from './exporter.js?v=awakening1';
import * as ui from './ui.js?v=0.4.4';
import {createStructureExperience} from './structureExperience.js?v=structure2';
import {createStructureUI} from './structureUI.js?v=structure2';
import {createCameraOwnership} from './cameraOwnership.js?v=journey3';
import {createTryOn} from './tryOn.js?v=journey3';
import {createBirdTransformation,createTreeEntrance,createBirdEntrance} from './exhibitSequences.js?v=journey3';
import {createRelicDialogue} from './relicDialogue.js?v=0.4.4';
import {createNarration} from './narration.js?v=0.4.4';
import {renderDialogueUI} from './dialogueUI.js?v=0.4.4';
import {createInteractionSound,createSceneSoundEvents} from './interactionSound.js?v=0.4.4';
import {createThirdStepUI} from './thirdStepUI.js?v=0.4.4';
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const particles=new ParticleSystem(ui.dom.canvas);particles.culturalStage=true;particles.camera.fov=42;particles.camera.position.set(0,0,94);particles.camera.lookAt(0,0,0);particles.camera.updateProjectionMatrix();
const environment=createStageEnvironment(particles),journey=createJourneyState();
const particleLayer=document.getElementById('relic-particle-layer');
const presentation=createParticlePresentation({particles,canvas:particleLayer,reducedMotion:reduceMotion});
const capture=createCanvasComposite([ui.dom.canvas,particleLayer]);
const runtime=createChapterRuntime({scene:particles.scene,camera:particles.camera,canvas:ui.dom.canvas,environment,reduceMotion}),cloud=createParticleExperience(particles);
const structure=createStructureExperience({reducedMotion:reduceMotion});let particleBlend=0;
const cameraOwnership=createCameraOwnership(),birdGold=createBirdTransformation({reducedMotion:reduceMotion}),treeEntrance=createTreeEntrance({reducedMotion:reduceMotion}),birdEntrance=createBirdEntrance({reducedMotion:reduceMotion}),entranceSeen=new Set();let entranceSettled=false,tryonGeneration=0,pendingPerformance=null;
const audio=new AudioEngine(),music=createBackgroundMusic({url:new URL('../assets/audio/eastern-thought.mp3',import.meta.url).href,createAudio:()=>{const e=document.createElement('audio');e.id='background-music';e.hidden=true;document.body.append(e);return e;}});
const sounds=createInteractionSound({engine:audio});
const dialogue=createRelicDialogue();let voiceToken=0;
const narration=createNarration({onEnded:()=>dialogue.speechFinished(voiceToken),onError:()=>dialogue.speechFailed(voiceToken),url:new URL('../assets/audio/dialogue-opening.wav',import.meta.url).href,createAudio:()=>{const e=document.createElement('audio');e.id='dialogue-narration';e.hidden=true;document.body.append(e);return e;}});
let lab=false,labId='mask',expression='solid',inputStatus={source:'pointer',state:'idle',visible:false},pointerDown=false,capturedPointerId=null;
let transitioning=false,navigationGeneration=0,inputGeneration=0,layoutDirty=true,completedBefore=false,recorder=null,recordError='',mpPromise,disposed=false;const frameClock=createFrameClock();
const active=()=>runtime.getActive(),chapterId=()=>active()?.id||'mask',getScreen=()=>journey.getSnapshot().screen;
const blocked=()=>getScreen()!=='stage'||transitioning||document.hidden||!!document.querySelector('dialog[open]');
const router=createAwakeInputRouter({getActive:active,getExpression:()=>expression,getStructure:()=>structure,routeExhibitInput:frame=>{if(chapterId()==='bird'&&birdEntrance.getSnapshot().status==='playing')return true;if(chapterId()==='bird'&&(birdGold.getSnapshot().progress>0||birdGold.getSnapshot().target===1)){birdGold.input(frame);return true;}return chapterId()==='tree'&&treeEntrance.getSnapshot().status==='playing';},isBlocked:blocked,onParticleSample:s=>cloud.update(s),onParticleGesture:(name,t)=>cloud.gesture(name,t)});
const input=createInputSession({onSample:s=>router.consume(s)});
const gesture=new GestureController({video:ui.dom.video,overlayCanvas:ui.dom.overlay,cameraManager:cameraOwnership,trackerFactory:async()=>{await loadMediaPipe();return new window.Hands({locateFile:f=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/'+f});}});
const tryOn=createTryOn({camera:cameraOwnership,reducedMotion:reduceMotion,onEnter:()=>enter(),onClose:()=>{sounds.setPaused(document.hidden);tryonGeneration++;boundary();frameClock.reset();layoutDirty=true;}});
function loadMediaPipe(){if(window.Hands)return Promise.resolve();if(!mpPromise)mpPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';script.crossOrigin='anonymous';const timer=setTimeout(()=>{script.remove();reject(new Error('模型加载超时'));},20000);script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);reject(new Error('模型加载失败'));};document.head.append(script);}).catch(e=>{mpPromise=null;throw e;});return mpPromise;}
function boundary(){pointerDown=false;if(capturedPointerId!==null&&ui.dom.canvas.hasPointerCapture(capturedPointerId))ui.dom.canvas.releasePointerCapture(capturedPointerId);capturedPointerId=null;input.cancel();router.cancel();cloud.cancelInput();birdGold.cancelInput();sounds.boundary();if(active())active().hotspotId=null;ui.finger({visible:false});}
function store(){if(!lab&&getScreen()!=='home'&&active()){const s=active().controller.getSnapshot();journey.saveCurrent(s,{complete:s.complete});}}
function activate(id,snapshot){stopDialogue();structure.setEnabled(false);pendingPerformance=null;birdGold.reset();treeEntrance.cancel();birdEntrance.cancel();entranceSettled=false;particleBlend=expression==='particles'?1:0;cloud.disable(active()?.stage);runtime.activate(id,snapshot);environment.setTheme(id);environment.resetView();music.setChapter(id);completedBefore=active().controller.getSnapshot().complete;layoutDirty=true;if(expression==='particles')cloud.enable(active().stage,active().controller.getSnapshot());else if(getScreen()==='stage'&&!lab&&!snapshot?.complete&&!entranceSeen.has(id)){if(id==='tree')treeEntrance.start();if(id==='bird')birdEntrance.start();}}
activate('mask');
function layout(){
 const w=innerWidth,h=innerHeight,screen=getScreen();let rect;
 if(screen==='stage'){const r=document.getElementById('stage-region').getBoundingClientRect();rect={x:r.x,y:r.y,width:r.width,height:r.height};}
 else rect=w>1100?{x:w*.47,y:h*.14,width:w*.49,height:h*.64}:{x:w*.16,y:h*.43,width:w*.8,height:h*.36};
 if(rect.width<=0||rect.height<=0)return;
 runtime.layout({width:w,height:h,stageRect:rect});
 const halfH=Math.tan(42*Math.PI/360)*94,halfW=halfH*w/h,cx=((rect.x+rect.width/2)/w*2-1)*halfW,cy=(1-(rect.y+rect.height/2)/h*2)*halfH;
 particles.culturalBounds={x:cx,y:cy,scale:Math.max(.12,Math.min(rect.width/w*halfW*2/85,rect.height/h*halfH*2/70))};
 presentation.layout({x:cx,y:cy});
 if(expression==='particles'&&screen==='stage'){cloud.relayout(active().stage);}
 layoutDirty=false;
}
const observer=new ResizeObserver(()=>{layoutDirty=true;});observer.observe(document.getElementById('stage-region'));observer.observe(document.getElementById('camera-preview'));
addEventListener('resize',()=>{layoutDirty=true;});addEventListener('scroll',()=>{layoutDirty=true;},true);
async function switchInput(source){const request=++inputGeneration;boundary();inputStatus={source,state:source==='camera'?'requesting':'idle',visible:false};input.setSource(source);layoutDirty=true;if(source==='pointer'){await gesture.stop();return;}const ready=await gesture.start();if(request!==inputGeneration)return;if(ready)inputStatus.state='tracking';else if(getScreen()==='stage'){inputStatus={source:'pointer',state:'idle',visible:false};input.setSource('pointer');layoutDirty=true;ui.toast('摄像头未能启动，已切换鼠标。可从右上方重试。');}}
gesture.on('camera',({state})=>{if(inputStatus.source==='camera'){inputStatus.state=state;layoutDirty=true;}});
gesture.on('input',sample=>{if(inputStatus.source==='camera'){inputStatus.visible=sample.visible;input.accept(sample);}});
function enter(){++navigationGeneration;transitioning=false;ui.transition(null,false);boundary();lab=false;expression='solid';const id=journey.open();activate(id,journey.getSnapshot().snapshots[id]);location.hash='journey';}
function enterLab(){store();++navigationGeneration;boundary();lab=true;expression='particles';journey.open();activate(labId);location.hash='particles';}
async function exit(){stopDialogue();const op=++navigationGeneration;store();boundary();transitioning=false;ui.transition(null,false);active()?.controller.cancelPerformance();environment.resetView();await stopRecording();if(op!==navigationGeneration)return;++inputGeneration;inputStatus={source:'pointer',state:'idle',visible:false};input.setSource('pointer');await gesture.stop();if(op!==navigationGeneration)return;journey.backHome();lab=false;expression='solid';activate('mask');location.hash='home';}
async function restart(){await exit();journey.restart();enter();ui.openInput();}
function finishTreeEntrance(){if(chapterId()!=='tree'||treeEntrance.getSnapshot().status!=='playing')return;treeEntrance.skip();active().controller.finishEntrance();entranceSeen.add('tree');entranceSettled=true;}
function finishBirdEntrance(){if(chapterId()!=='bird'||birdEntrance.getSnapshot().status!=='playing')return;birdEntrance.skip();active().controller.settleForm();entranceSeen.add('bird');entranceSettled=true;}
function switchExpression(value){if(chapterId()==='shadow'||lab||active().controller.getSnapshot().performance.status==='playing')return;if(chapterId()==='bird'&&birdGold.getSnapshot().progress>0){birdGold.scatter(value==='particles');return;}finishTreeEntrance();finishBirdEntrance();boundary();const next=value==='particles'?'particles':'solid';if(next===expression)return;expression=next;if(expression==='particles'){if(!particles.particleExperience)cloud.enable(active().stage,active().controller.getSnapshot(),{fromCurrent:true});structure.command('restore');}else cloud.setMode('image');}
function toggleStructure(){finishTreeEntrance();finishBirdEntrance();boundary();if(expression==='particles')switchExpression('solid');structure.setEnabled(!structure.getSnapshot().enabled);layoutDirty=true;}
async function openTryOn(){const op=++tryonGeneration;store();boundary();await stopRecording();if(op!==tryonGeneration)return;await switchInput('pointer');if(op!==tryonGeneration)return;sounds.setPaused(true);narration.setPaused(true);tryOn.open();frameClock.reset();}
function setGoldForm(form){if(chapterId()!=='bird'||birdEntrance.getSnapshot().status==='playing'||active().controller.getSnapshot().performance.status==='playing')return;pendingPerformance=null;boundary();if(expression==='particles')switchExpression('solid');structure.setEnabled(false);active().controller.settleForm();birdGold.setForm(form);sounds.emit(form==='gold'?'gold-transform':'restore',performance.now());}
const structureUI=createStructureUI({onBoundary:boundary,onToggle:toggleStructure,onCommand:mode=>{structure.command(mode);sounds.emit(({explode:'explode',slice:'slice',restore:'restore',rotate:'rotate'})[mode],performance.now());},onAdjust:(axis,value)=>structure.adjust(axis,value),onSelect:id=>structure.select(id),onParticles:()=>switchExpression('particles'),onCameraOff:()=>switchInput('pointer')});
const thirdUI=createThirdStepUI({onTryOn:openTryOn,onForm:setGoldForm,onScatter:on=>{boundary();birdGold.scatter(on);},onBirdReplay:()=>{boundary();sounds.emit('chapter',performance.now());structure.setEnabled(false);active().controller.settleForm();birdEntrance.start();entranceSettled=false;},onBirdSkip:finishBirdEntrance,onTreeReplay:()=>{boundary();sounds.emit('tree-rise',performance.now());structure.setEnabled(false);treeEntrance.start();entranceSettled=false;},onTreeSkip:finishTreeEntrance,onStructure:toggleStructure});
async function navigate(id,next=false){if(transitioning)return;store();const j=journey.getSnapshot();if(!next&&!lab&&!j.unlockedIds.includes(id))return;const op=++navigationGeneration;stopDialogue();boundary();await stopRecording();if(op!==navigationGeneration)return;
 if(lab&&!next){labId=id;activate(id);return;}if(lab&&next){enter();return;}
 if(next&&!active().controller.getSnapshot().complete)return;
 if(next&&chapterId()==='shadow'){store();if(!journey.finish())return;active().controller.cancelPerformance();environment.resetView();++inputGeneration;inputStatus={source:'pointer',state:'idle',visible:false};input.setSource('pointer');await gesture.stop();layoutDirty=true;location.hash='ending';return;}
 const target=next?CHAPTERS[CHAPTERS.findIndex(c=>c.id===chapterId())+1]?.id:id;if(!target)return;
 transitioning=true;ui.transition(CHAPTERS.find(c=>c.id===target),true);active().controller.cancelPerformance();environment.resetView();await new Promise(resolve=>setTimeout(resolve,reduceMotion?120:650));if(op!==navigationGeneration)return;
 if(next)journey.advance();else journey.visit(target);expression='solid';activate(target,journey.getSnapshot().snapshots[target]);ui.transition(null,false);transitioning=false;location.hash='journey';
}
function pointerSample(e,pressed){const r=ui.dom.canvas.getBoundingClientRect();return {source:'pointer',x:(e.clientX-r.left)/r.width*2-1,y:1-(e.clientY-r.top)/r.height*2,pressed,visible:true,timeMs:performance.now()};}
ui.dom.canvas.addEventListener('pointerdown',e=>{if(blocked()||inputStatus.source!=='pointer'||e.button!==0)return;pointerDown=true;capturedPointerId=e.pointerId;ui.dom.canvas.setPointerCapture(e.pointerId);if(expression==='solid')sounds.emit('rotate',performance.now());input.accept(pointerSample(e,true));});
ui.dom.canvas.addEventListener('pointermove',e=>{if(getScreen()==='stage'&&inputStatus.source==='pointer')input.accept(pointerSample(e,pointerDown));});
ui.dom.canvas.addEventListener('pointerup',e=>{if(inputStatus.source==='pointer')input.accept(pointerSample(e,false));pointerDown=false;if(ui.dom.canvas.hasPointerCapture(e.pointerId))ui.dom.canvas.releasePointerCapture(e.pointerId);capturedPointerId=null;});
ui.dom.canvas.addEventListener('pointerleave',()=>{if(!pointerDown)boundary();});ui.dom.canvas.addEventListener('pointercancel',boundary);ui.dom.canvas.addEventListener('lostpointercapture',()=>{if(pointerDown)boundary();});addEventListener('blur',boundary);
async function save(){try{await Exporter.saveImage(capture.draw(),'青铜与灯影-'+CHAPTERS.find(c=>c.id===chapterId()).title+'-'+Date.now()+'.png');ui.toast('这一刻，已为你留存。');}catch{ui.toast('留影未能保存，请再试一次。');}}
const recordingSaver=createRecordingSaver({takeRecording:()=>{const current=recorder;recorder=null;return current;},saveRecording:r=>Exporter.saveRecording(r),onSaved:()=>ui.toast('舞台片段已保存。'),onError:e=>{recordError=e.message;ui.toast('录制未能保存，可使用「保存留影」。');}});
const stopRecording=()=>recordingSaver.stop();
async function record(){if(recordingSaver.busy)return;if(recorder)return stopRecording();recordError='';try{
 const source=Exporter.startRecording(capture.begin(),{filenamePrefix:'青铜与灯影-'+CHAPTERS.find(c=>c.id===chapterId()).title,onError:e=>{capture.end();recordError=e.message;recorder=null;ui.toast('录制已停止，请重新开始或保存留影。');}});
 recorder={get recording(){return source.recording;},stop(){return source.stop().finally(()=>capture.end());},cancel(){source.cancel();capture.end();}};
 }catch(e){capture.end();recordError=e.message;ui.toast(e.message);}}
function sound(){const m=music.getSnapshot(),on=m.status==='error'||!m.enabled;music.setEnabled(on);narration.setVolume(m.volume);narration.setEnabled(on);if(!on)dialogue.speechFailed(voiceToken);try{sounds.setVolume(m.volume);sounds.setEnabled(on);if(on)sounds.emit('chapter',performance.now());}catch{ui.toast('动作音效暂不可用，配乐仍可单独播放。');}}
function stopDialogue(){narration.stop();dialogue.reset();}
function speakDialogue(){const s=dialogue.getSnapshot();voiceToken=s.token;narration.setSource(new URL('../assets/audio/'+s.audio,import.meta.url).href);narration.setPaused(false);if(!music.getSnapshot().enabled){dialogue.speechFailed(voiceToken);return;}narration.play().then(ok=>{if(!ok&&narration.getSnapshot().status==='error')dialogue.speechFailed(s.token);});}
function action(type,value){
 if(chapterId()==='shadow'){
  if(type.startsWith('dialogue-')&&(blocked()||active().controller.getSnapshot().performance.status==='playing'))return;
  if(type==='dialogue-start'){if(!music.getSnapshot().enabled)sound();active().controller.setPaused(false);active().controller.trigger('skip');dialogue.start();speakDialogue();return;}
  if(type==='dialogue-answer'){if(dialogue.answer(Number(value)))speakDialogue();return;}
  if(type==='dialogue-continue'){dialogue.continueSilently();return;}
  if(type==='dialogue-replay'){if(!music.getSnapshot().enabled)sound();if(dialogue.replay())speakDialogue();return;}
  if(['skip','replay'].includes(type))stopDialogue();
 }
 finishTreeEntrance();boundary();structure.setEnabled(false);const c=active().controller;c.setPaused(false);
 if(type==='zoom')c.setZoom(c.getSnapshot().motion.zoom+Number(value));
 else if(type==='pose')c.setPose(Number(value));else if(type==='view'){c.setView(Number(value));sounds.emit('rotate',performance.now());}else if(type==='role')c.setRole(value);else if(type==='backdrop')c.setBackdrop(value);else if(type==='controlMode')c.setControlMode(value);else if(type==='depth')c.setDepth(Number(value));else c.trigger(type,performance.now());
 if(chapterId()==='tree'&&type==='grow')sounds.emit('tree-rise',performance.now());
}
function perform(replay=false){stopDialogue();if(chapterId()==='bird'&&birdGold.getSnapshot().progress>0){pendingPerformance=replay;birdGold.setForm('bronze');return;}pendingPerformance=null;finishTreeEntrance();finishBirdEntrance();birdGold.reset();structure.setEnabled(false);particleBlend=0;if(expression==='particles'||particles.particleExperience){boundary();expression='solid';cloud.disable(active().stage);}boundary();active().controller.setPaused(false);if(active().controller.beginPerformance({replay}))sounds.emit(chapterId()==='shadow'?'figure-arrive':chapterId()==='tree'?'tree-rise':'chapter',performance.now());}
ui.mount({onEnter:enter,onLab:enterLab,onExit:exit,onRestart:restart,onBoundary:boundary,onSource:switchInput,onReset:()=>{stopDialogue();boundary();pendingPerformance=null;birdGold.reset();treeEntrance.cancel();birdEntrance.cancel();entranceSettled=false;structure.setEnabled(false);if(!lab)journey.resetCurrent();active().controller.reset();completedBefore=false;if(expression==='particles')cloud.enable(active().stage,active().controller.getSnapshot());},onNext:()=>navigate(null,true),onVisit:id=>navigate(id),onExpression:switchExpression,onParticleMode:mode=>{boundary();cloud.setMode(mode);},onAction:action,onPerform:()=>perform(),onReplay:()=>perform(true),onSkip:()=>{stopDialogue();active().controller.skipPerformance();store();},onSave:save,onRecord:record,onSound:sound,onLayout:()=>{layoutDirty=true;},onVolume:v=>{music.setVolume(v);sounds.setVolume(v);narration.setVolume(v);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&getScreen()!=='home')exit();});
document.addEventListener('visibilitychange',()=>{frameClock.reset();boundary();music.setHidden(document.hidden);narration.setPaused(document.hidden);if(document.hidden){tryOn.pause();sounds.setPaused(true);}else sounds.setPaused(false);});
addEventListener('hashchange',()=>{if(location.hash==='#home'&&getScreen()!=='home'&&!disposed){tryOn.close();exit();}});
addEventListener('pagehide',event=>{gesture.stop();tryOn.close();cameraOwnership.release();recorder?.cancel();sounds.setPaused(true);narration.setPaused(true);music.setHidden(true);if(event.persisted)return;disposed=true;narration.dispose();sounds.dispose();thirdUI.dispose();tryOn.dispose();structureUI.dispose();music.dispose();observer.disconnect();presentation.dispose();runtime.dispose();environment.dispose();particles.dispose();});
const soundEvents=createSceneSoundEvents();
addEventListener('pageshow',()=>{frameClock.reset();music.setHidden(document.hidden);sounds.setPaused(document.hidden);narration.setPaused(document.hidden);});
function frame(now){
 if(disposed)return;
 requestAnimationFrame(frame);if(document.hidden){frameClock.reset();return;}const time=frameClock.step(now),dt=time.renderSec;if(tryOn.active){tryOn.update(now,dt);return;}const a=active(),screen=getScreen(),pause=blocked(),sample=input.read(now);
 if(inputStatus.source==='camera')inputStatus.visible=!!sample?.visible;
 const goldActive=a.id==='bird'&&(birdGold.getSnapshot().progress>0||birdGold.getSnapshot().target===1),entering=(a.id==='tree'&&treeEntrance.getSnapshot().status==='playing')||(a.id==='bird'&&birdEntrance.getSnapshot().status==='playing');
 a.controller.setPaused(pause||expression==='particles'||structure.getSnapshot().enabled||goldActive||entering);if(screen==='stage'&&!pause){router.consume(sample);structure.tick(dt);if(a.stage.sunBird?.status==='ready')birdGold.tick(time.elapsedSec);treeEntrance.tick(time.elapsedSec);birdEntrance.tick(time.elapsedSec);if(a.id==='tree'&&treeEntrance.getSnapshot().status==='done'&&!entranceSettled){a.controller.finishEntrance();entranceSeen.add('tree');entranceSettled=true;}if(a.id==='bird'&&birdEntrance.getSnapshot().status==='done'&&!entranceSettled){a.controller.settleForm();entranceSeen.add('bird');entranceSettled=true;}if(a.id==='bird'&&pendingPerformance!==null&&birdGold.getSnapshot().progress===0)perform(pendingPerformance);if(expression==='solid')a.controller.tick(now,time.elapsedSec);if(inputStatus.source==='camera')ui.finger(sample||{visible:false});}else ui.finger({visible:false});
 const s=a.controller.getSnapshot();if(s.complete!==completedBefore&&screen==='stage'){store();completedBefore=s.complete;}
 sounds.setPaused(pause);narration.setPaused(pause);const cues=a.controller.drainCues();if(!pause)for(const cue of cues)sounds.emit(cue,now);for(const cue of soundEvents.sample({screen,id:a.id,paused:pause,audioReady:!sounds.getSnapshot().enabled||audio.ctx?.state==='running',mode:structure.getSnapshot().enabled?structure.getSnapshot().mode:'normal',turning:pointerDown}))sounds.emit(cue,now);
 const goldState=birdGold.getSnapshot(),treeState=treeEntrance.getSnapshot(),birdEntryState=birdEntrance.getSnapshot();
 ui.render({journey:journey.getSnapshot(),chapter:s,id:a.id,inputStatus,music:music.getSnapshot(),recording:!!recorder?.recording,error:recordError,expression,lab,particleMode:cloud.mode,hotspotId:a.hotspotId,structureEnabled:structure.getSnapshot().enabled,exhibitKey:[goldState.form,goldState.target,treeState.status,birdEntryState.status]});
 structureUI.render({snapshot:structure.getSnapshot(),parts:a.stage.structure?.parts,supported:!!a.stage.structure&&!lab&&expression==='solid'&&!goldActive&&!entering,screen,camera:inputStatus.source==='camera',playing:s.performance.status==='playing'});
 thirdUI.render({id:a.id,lab,expression,bird:goldState,tree:treeState,birdEntry:birdEntryState,assetStatus:a.stage.sunBird?.status,structureEnabled:structure.getSnapshot().enabled});renderDialogueUI(s,narration.getSnapshot(),dialogue.getSnapshot(),{visible:a.id==='shadow'&&screen==='stage',onAction:action});
 if(layoutDirty)layout();
 const structural=structure.getSnapshot();
 let display=(structural.enabled||goldActive||entering)?a.stage.particleSnapshot(s):s;if(entering&&a.id==='tree')display={...display,motion:{...display.motion,bloom:s.motion.bloom}};a.stage.setDialogueActive?.(dialogue.getSnapshot().phase!=='idle');a.stage.setSpeaking?.(dialogue.getSnapshot().phase==='speaking'&&narration.getSnapshot().status==='playing');a.stage.applySnapshot(display,dt);
 if(!pause){const target=expression==='particles'?1:0;particleBlend+=Math.sign(target-particleBlend)*Math.min(Math.abs(target-particleBlend),dt/(reduceMotion?.25:1.25));if(particleBlend===0&&expression==='solid'&&particles.particleExperience)cloud.disable(a.stage);}
 a.stage.structure?.update(structural,{opacity:(1-particleBlend)*(a.id==='bird'?goldState.bronze:1)*(entering?(a.id==='bird'?birdEntryState.support:treeState.base):1)});a.stage.sunBird?.update(goldState,dt);a.stage.revealEntrance?.(a.id==='bird'?birdEntryState:treeState);particles.material.uniforms.uArtifactOpacity.value=particleBlend;
 a.stage.root.visible=particleBlend<1||screen!=='stage';
 environment.updateView({chapterId:a.id,performance:s.performance,pointer:sample,dragging:!!s.motion.dragging||!!s.motion.grabbedId,dtSec:dt});
 a.background.update(dt,{pointer:sample,dragging:pointerDown,performance:s.performance,expression});particles.energy*=.96;
 const halfH=Math.tan(particles.camera.fov*Math.PI/360)*particles.camera.position.z,halfW=halfH*particles.camera.aspect;
 presentation.update(dt,time.elapsedSec,{active:expression==='particles'&&screen==='stage',mode:cloud.mode,pointer:pause?null:sample,energy:particles.energy});
 particles.frame(dt,sample?.visible?sample.x*halfW:particles.culturalBounds?.x||0,sample?.visible?sample.y*halfH:particles.culturalBounds?.y||0);
 if(capture.recording)capture.draw();
 ui.dom.canvas.style.cursor=screen==='stage'&&inputStatus.source==='pointer'?(pointerDown?'grabbing':expression==='particles'?'crosshair':'default'):'default';
}
window.__realm={particles,gesture,journey,runtime,cloud,structure,birdGold,birdEntrance,treeEntrance,tryOn,cameraOwnership,sounds,audio,music,narration,dialogue,visit:navigate,enter,enterLab,get experience(){return active().controller;},get artifact(){return active().stage;}};
requestAnimationFrame(frame);
