import {CHAPTERS,SOURCES,BIRD_DETAILS} from './journeyData.js?v=0.4.2';
import {CHAPTER_ACTIONS,CHAPTER_GESTURES,BEAST_ROLES,BEAST_BACKDROPS} from './awakeningData.js?v=awakening1';
const $=id=>document.getElementById(id);export const dom={canvas:$('main-canvas'),video:$('camera-video'),overlay:$('camera-overlay')};
let timer,controlsKey='',navKey='',renderKey='';
export function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,3400);}
export function openInput(){$('input-dialog').showModal();}
export function transition(meta,on){$('chapter-transition').hidden=!on;if(meta){$('transition-en').textContent=meta.en;$('transition-number').textContent=meta.number;$('transition-title').textContent=meta.title;}}
export function finger(s){const c=$('finger-cursor');c.hidden=!s?.visible;if(s?.visible){c.style.left=(s.x+1)*innerWidth/2+'px';c.style.top=(1-s.y)*innerHeight/2+'px';c.classList.toggle('pressed',s.pressed);}}
export function mount(c){
 $('source-links').innerHTML=SOURCES.map(s=>'<a target="_blank" rel="noopener" href="'+s.url+'">'+s.name+' ↗</a>').join('');
 $('btn-enter').onclick=()=>{c.onEnter();c.onBoundary();openInput();};$('btn-lab').onclick=()=>{c.onLab();c.onBoundary();openInput();};
 $('btn-restart-home').onclick=c.onRestart;$('btn-exit').onclick=c.onExit;$('brand-home').onclick=e=>{e.preventDefault();c.onExit();};$('btn-ending-home').onclick=c.onExit;$('btn-replay').onclick=c.onRestart;
 $('btn-input').onclick=()=>{c.onBoundary();openInput();};$('choose-camera').onclick=()=>{$('input-dialog').close();c.onSource('camera');};$('choose-pointer').onclick=()=>{$('input-dialog').close();c.onSource('pointer');};
 $('btn-gesture-input').onclick=$('btn-input').onclick;
 $('btn-reset').onclick=c.onReset;$('btn-next').onclick=c.onNext;$('btn-perform').onclick=c.onPerform;$('btn-skip').onclick=c.onSkip;$('btn-replay-show').onclick=c.onReplay;
 $('btn-save').onclick=c.onSave;$('btn-ending-save').onclick=c.onSave;$('btn-record').onclick=c.onRecord;$('btn-sound').onclick=c.onSound;
 $('volume-slider').oninput=e=>c.onVolume(Number(e.target.value)/100);
 $('chapter-nav').onclick=e=>{const b=e.target.closest('[data-chapter]');if(b&&!b.disabled)c.onVisit(b.dataset.chapter);};
 $('chapter-controls').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.expr)c.onExpression(b.dataset.expr);else if(b.dataset.mode)c.onParticleMode(b.dataset.mode);else if(b.dataset.action)c.onAction(b.dataset.action,b.dataset.value);};
 $('chapter-controls').onchange=e=>{if(e.target.id==='backdrop-select')c.onAction('backdrop',e.target.value);};
 $('chapter-controls').oninput=e=>{if(e.target.id==='depth-slider')c.onAction('depth',Number(e.target.value));else if(e.target.id==='figure-pose')c.onAction('pose',Number(e.target.value));else if(e.target.id==='figure-view')c.onAction('view',Number(e.target.value));};
 $('btn-camera-preview').onclick=()=>{dom.overlay.hidden=!dom.overlay.hidden;$('camera-preview').classList.toggle('collapsed',dom.overlay.hidden);$('btn-camera-preview').textContent=dom.overlay.hidden?'展开':'收起';$('btn-camera-preview').setAttribute('aria-expanded',String(!dom.overlay.hidden));c.onLayout();};
 document.querySelectorAll('[data-dialog]').forEach(b=>b.onclick=()=>{c.onBoundary();$(b.dataset.dialog).showModal();});
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',c.onBoundary);d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});});
 $('boot-status').hidden=true;$('btn-enter').disabled=false;
}
const modes=[['image','凝聚','握拳'],['scatter','散开','张掌'],['implode','归指','捏合'],['vortex','旋流','指向'],['wave','涟漪','剪刀手']];
function modeButtons(items,attribute,current){return items.map(([id,name])=>'<button '+attribute+'="'+id+'" class="'+(id===current?'selected':'')+'" aria-pressed="'+(id===current)+'">'+name+'</button>').join('');}
export function render({journey:j,chapter:s,id,inputStatus,music,recording,error,expression='solid',lab=false,particleMode='image',hotspotId,structureEnabled=false,exhibitKey=null}){
 const meta=CHAPTERS.find(c=>c.id===id),m=s.motion,camera=inputStatus.source==='camera',playing=s.performance.status==='playing',done=s.complete;
 const currentSlider=$('depth-slider');if(currentSlider&&document.activeElement!==currentSlider)currentSlider.value=m.depth;
 const key=JSON.stringify([j.screen,j.activeChapterId,j.completedIds,j.unlockedIds,Object.keys(j.snapshots),id,m.roleId,m.backdropId,m.controlMode,s.performance.status,done,inputStatus,music,recording,error,expression,lab,particleMode,hotspotId,structureEnabled,exhibitKey]);if(key===renderKey)return;renderKey=key;
 document.body.dataset.screen=j.screen==='stage'?'studio':j.screen;document.body.dataset.chapter=id;document.body.dataset.camera=camera&&j.screen==='stage'?'on':'off';
 $('screen-home').hidden=j.screen!=='home';$('screen-studio').hidden=j.screen!=='stage';$('screen-ending').hidden=j.screen!=='ending';
 const hasProgress=Object.keys(j.snapshots).length>0;$('btn-enter').querySelector('span').textContent=hasProgress?'继续旅程':'启程';$('btn-restart-home').hidden=!hasProgress;
 const nk=JSON.stringify([lab,id,j.unlockedIds,j.completedIds]);if(nk!==navKey){navKey=nk;$('chapter-nav').innerHTML=(lab?CHAPTERS.slice(0,3):CHAPTERS).map((c,i)=>'<button data-chapter="'+c.id+'" class="'+(c.id===id?'active':j.completedIds.includes(c.id)?'done':'')+'" '+(!lab&&!j.unlockedIds.includes(c.id)?'disabled':'')+' aria-current="'+(c.id===id?'step':'false')+'"><i>0'+(i+1)+'</i>'+c.title+'</button>').join('');}
 $('chapter-en').textContent=lab?'THE PARTICLE ATELIER · 12,000 POINTS':meta.en;$('studio-title').textContent=lab?'万物，聚散于指尖':meta.title;
 $('progress-label').textContent=expression==='particles'?'PARTICLE EXPRESSION':'WAKE THE ANCIENT FORM';
 $('progress-state').textContent=expression==='particles'?'让光，随手而动':playing?'此刻，正在绽放':id==='shadow'?'与你，隔光相望':'与你，轻轻相应';
 const ck=JSON.stringify([id,expression,lab,m.roleId,m.backdropId,m.controlMode,particleMode]);if(ck!==controlsKey){controlsKey=ck;let controls='';
  if(expression==='particles')controls='<div class="particle-modes">'+modeButtons(modes,'data-mode',particleMode)+'</div><p class="control-note">光点取自这件文物的三维表面。<br>凝聚后按住拖动，可转动形貌。</p>';
  else{
   if(id==='shadow')controls+='<button class="dialogue-entry" data-action="dialogue-start">开启三回合对话 ↗</button><p class="dialogue-note">聆听一句，再选择你的回答。<br>三个问题，与你共同完成。</p><button class="dialogue-entry" data-action="replay">重播立人登场 ✧</button><button class="dialogue-entry" data-action="skip">跳过登场 →</button><p id="dialogue-status" class="dialogue-status"></p><progress id="dialogue-progress" class="dialogue-progress" max="1" value="0" aria-label="立人登场进度"></progress>';
   const actions=id==='shadow'?[['front','回到正面']]:CHAPTER_ACTIONS[id];controls+='<div class="action-grid">'+actions.map(([action,name])=>'<button data-action="'+action+'">'+name+'<span>↗</span></button>').join('')+'</div>';
   if(id==='mask')controls+='<label class="control-label">转动与距离</label><div class="mini-tools"><button data-action="zoom" data-value="-0.1" aria-label="缩小">−</button><span>按住文物转动</span><button data-action="zoom" data-value="0.1" aria-label="放大">＋</button></div>';
   if(id==='shadow')controls+='<label class="figure-slider">观赏角度<input id="figure-view" type="range" min="-.65" max=".65" step=".01" value="'+m.yaw+'"></label><p class="dialogue-note">立人保持原有姿态，双手留空。<br>对话为当代虚构，不代替历史结论。</p><a class="figure-source" target="_blank" rel="noopener" href="https://artsandculture.google.com/asset/bronze-standing-figure/tAHel879cGywPQ">三星堆博物馆 · 立人像资料 ↗</a>';

  }
  if(id!=='shadow'&&!lab)controls+='<div class="expression-toggle">'+modeButtons([['solid','青铜'],['particles','粒子']],'data-expr',expression)+'</div>';
  $('chapter-controls').innerHTML=controls;
 }
 $('chapter-controls').inert=playing;
 const slider=$('depth-slider');if(slider&&document.activeElement!==slider)slider.value=m.depth;
 const detail=id==='bird'&&expression==='solid'?BIRD_DETAILS[hotspotId]:null;
 $('guide-number').textContent=lab?'光':meta.number;$('guide-title').textContent=detail?.title||(expression==='particles'?'形散，意不散':meta.object);
 $('guide-text').textContent=detail?.text||(expression==='particles'?'握拳凝器，张掌散开。以手指引出旋流与涟漪，再将光收回指尖。':meta.hint);
 $('guide-note').textContent=meta.note;
 let tips=expression==='particles'?modes.map(([,name,hand])=>[hand,name]):id==='shadow'&&m.controlMode==='light'?[['平移张掌','移动灯位'],['手掌靠近／远离','影子放大／收紧']]:CHAPTER_GESTURES[id];
 if(id==='shadow')tips=[['开启对话','中文语音 · 三回合二选一'],['聆听后回答','选项也可用键盘操作'],['拖动 / 滑杆','转动观察青铜立人']];
 if(structureEnabled&&expression==='solid')tips=[['张掌移动','转动 · 远近缩放'],['张掌停稳 1.1 秒','结构拆解'],['张掌快速横挥','横向切层'],['握拳保持 0.65 秒','沿原路复原'],['捏合指向部件','高亮与局部观察']];
 if(id==='bird'&&exhibitKey?.[0]!=='bronze'&&exhibitKey?.[0])tips=[['张掌移动','转动金饰'],['张掌停稳半秒','金光散开'],['握拳保持','重新聚合'],['还原青铜','继续原动作与结构']];
 const tipKey=JSON.stringify(tips);if($('gesture-tips').dataset.key!==tipKey){$('gesture-tips').dataset.key=tipKey;$('gesture-tips').innerHTML=tips.map(([a,b],i)=>'<div><i>0'+(i+1)+'</i><span>'+a+'<small>'+b+'</small></span></div>').join('');}
 $('stage-instruction').textContent=playing?'以光为引，万象初醒':expression==='particles'?(modes.find(x=>x[0]===particleMode)?.[1]+' · 移动指尖，让光随你流动'):id==='mask'?'按住转动 · 眨眼、展耳，与你相遇':id==='bird'?'扇手起飞 · 指尖画圈，循鸟入林':id==='tree'?'张掌托举 · 舒展五指，让花开在枝头':m.controlMode==='light'?'拖动光点 · 改变离幕距离，照见不同兽影':'聆听青铜回声，再给出你的回答';
 $('stage-hint').textContent=playing?'可跳过演出，停留在完成姿态':camera?'手势互动 · 也可点击动作按钮':'鼠标与键盘皆可体验';
 if(structureEnabled&&expression==='solid'){$('stage-instruction').textContent='结构探索 · 拖动转动 / 选中部件观察 · 模拟切面仅作数字艺术演示';$('stage-hint').textContent='E 拆解 · X 横切 · R 复原 · 方向键转动';}
 $('btn-perform').hidden=lab||playing||done;$('btn-perform').textContent=id==='shadow'?'落幕 ✧':'完成这一幕 ✧';
 $('btn-skip').hidden=!playing;$('btn-replay-show').hidden=lab||!done||playing;$('btn-next').hidden=!lab&&(!done||playing);$('btn-next').disabled=false;$('btn-next').textContent=lab?'开始四幕旅程 →':id==='shadow'?'留住这段旅程 →':meta.next+' →';
 $('btn-reset').textContent=lab?'↺ 粒子重聚':'↺ 本幕重来';
 $('input-label').textContent=camera?({requesting:'等待授权',loading:'模型加载中',tracking:'手势操作',idle:'准备手势'}[inputStatus.state]||'摄像头不可用'):'鼠标操作';
 $('btn-gesture-input').textContent=id==='shadow'?'切换操作方式 ↗':!camera?'手势未开启 · 点击开启 ↗':inputStatus.state==='tracking'?(inputStatus.visible?'手势已就绪 · 切换 ↗':'请将手放入摄像头画面'):'手势准备中 · 查看 ↗';
 $('camera-preview').hidden=!camera||j.screen!=='stage';$('tracking-status').textContent=inputStatus.state==='tracking'?(inputStatus.visible?'已追踪手部':'请将手放入画面'):inputStatus.state==='requesting'?'正在请求摄像头':'正在准备手势识别';
 $('btn-sound').setAttribute('aria-pressed',String(music.enabled));$('btn-sound').querySelector('i').textContent=music.status==='error'?'重试':music.status==='loading'?'加载':music.enabled?'开':'关';
 $('volume-value').textContent=Math.round(music.volume*100)+'%';$('music-status').textContent={off:'点击页首「音乐」开启',loading:'正在准备配乐…',playing:'Eastern Thought · 正在播放',paused:'页面隐藏时暂停播放',error:'配乐未能播放，点击页首「重试」再试一次'}[music.status];
 $('btn-record').textContent=recording?'停止并保存':'开始录制';$('record-state').textContent=error||(recording?'正在录制舞台画面…':'WebM 视频 · 建议 5–15 秒 · 无声');
}
