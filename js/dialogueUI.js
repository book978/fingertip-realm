import {dialogueAt} from './figureMotion.js?v=0.4.0';
let panel,key='';
export function renderDialogueUI(snapshot,voice={},conversation={},options={}){
 if(!panel&&options.visible){panel=document.createElement('section');panel.id='conversation-panel';panel.setAttribute('aria-label','与青铜回声对话');document.querySelector('.stage-column').append(panel);panel.onclick=e=>{const b=e.target.closest('button[data-talk]');if(b&&!b.disabled)options.onAction(b.dataset.talk,b.dataset.value);};}
 if(!panel)return;panel.inert=snapshot.performance.status==='playing';panel.setAttribute('aria-disabled',String(panel.inert));panel.hidden=!options.visible;if(!options.visible)return;
 const p=snapshot.performance.status==='playing'?snapshot.performance.progress:snapshot.motion.entrance;
 const status=document.getElementById('dialogue-status');if(status)status.textContent=p<1?'光尘凝形 · 古蜀的身影正在浮现':'青铜静立，回声等待你的回答。';
 const progress=document.getElementById('dialogue-progress');if(progress){progress.value=p;progress.hidden=p===1;}const skip=document.querySelector('[data-action="skip"]');if(skip)skip.hidden=p===1;
 const slider=document.getElementById('figure-view');if(slider&&document.activeElement!==slider)slider.value=snapshot.motion.yaw;
 const start=document.querySelector('[data-action="dialogue-start"]');if(start)start.textContent=conversation.phase==='idle'?'开启三回合对话 ↗':'重新对话 ↻';
 const state=conversation.phase,renderKey=JSON.stringify([conversation.token,state,voice.status,conversation.choices]);if(renderKey===key)return;key=renderKey;
 const line=conversation.text||'穿过三千年的光，留下一次属于你的回答。';
 let buttons='';if(state==='idle')buttons='<button data-talk="dialogue-start">与青铜回声交谈 →</button>';
 else if(state==='choosing')buttons=conversation.choices.map(c=>'<button data-talk="dialogue-answer" data-value="'+c.index+'"><span>◇</span>'+c.text+'</button>').join('');
 else if(state==='silent')buttons='<button data-talk="dialogue-replay">重新聆听</button><button data-talk="dialogue-continue">已读完，继续 →</button>';
 else if(state==='finished')buttons='<button data-talk="dialogue-start">再聊一次 ↻</button>';
 const hint=state==='speaking'?(voice.status==='paused'?'已暂停，关闭弹窗后继续':conversation.answers.length===3?'正在讲述 · 一句告别':'正在讲述 · 聆听后可回答'):state==='choosing'?'选择你的回答':state==='silent'?'声音已关闭或暂不可用，可阅读后继续':state==='finished'?'三回合对话结束 · 可继续观赏或落幕':'三回合 · 原创艺术化对话';
 panel.innerHTML='<header><span>青铜回声</span><small>'+(conversation.turn?'0'+conversation.turn+' / 03':'ACROSS THREE THOUSAND YEARS')+'</small></header><p class="conversation-line" aria-live="polite">'+line+'</p><div class="conversation-choices">'+buttons+'</div><footer>'+hint+'</footer>';
}
