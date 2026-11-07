const names={normal:'完整形态',rotate:'缓慢旋转',explode:'结构展开',slice:'横向切层',restore:'正在复原'};
export function createStructureUI({onToggle,onCommand,onAdjust,onSelect,onParticles,onCameraOff,onBoundary}){
 const host=document.getElementById('chapter-controls');let visible=false,state=null;
 const click=e=>{
  const button=e.target.closest('[data-structure]');if(!button)return;onBoundary();const command=button.dataset.structure;
  if(command==='toggle')onToggle();else if(command==='particles')onParticles();else if(command==='camera-off')onCameraOff();else if(command==='left'||command==='right')onAdjust('localYaw',command==='left'?-.2:.2);else if(command==='zoom-in'||command==='zoom-out')onAdjust('zoom',command==='zoom-in'?.08:-.08);else onCommand(command);
 };
 const change=e=>{if(e.target.id==='structure-part'){onBoundary();onSelect(e.target.value||null);}};
 const key=e=>{
  if(!visible||!state?.enabled||e.altKey||e.ctrlKey||e.metaKey||e.repeat||document.querySelector('dialog[open]')||e.target.closest('input,select,textarea'))return;
  const commands={e:'explode',x:'slice',r:'restore',a:'rotate',n:'normal'},k=e.key.toLowerCase();
  if(commands[k]){onBoundary();onCommand(commands[k]);}
  else if(k==='p'){onBoundary();onParticles();}
  else if(e.key==='ArrowLeft'||e.key==='ArrowRight')onAdjust(state.selected?'localYaw':'yaw',e.key==='ArrowLeft'?-.15:.15);
  else if(e.key==='ArrowUp'||e.key==='ArrowDown')onAdjust('pitch',e.key==='ArrowUp'?-.06:.06);
  else if(e.key==='+'||e.key==='=')onAdjust('zoom',.08);else if(e.key==='-')onAdjust('zoom',-.08);else return;e.preventDefault();
 };
 host.addEventListener('click',click);host.addEventListener('change',change);document.addEventListener('keydown',key);
 return {
  render({snapshot,parts=[],supported=false,screen,camera,playing}){
   state=snapshot;visible=supported&&screen==='stage'&&!playing;let panel=document.getElementById('structure-panel');
   if(!supported){panel?.remove();return;}
   if(!panel){panel=document.createElement('section');panel.id='structure-panel';panel.className='structure-panel';panel.innerHTML='<button data-structure="toggle" class="structure-entry" aria-expanded="false">结构探索 <span>⤢</span></button><div class="structure-body" hidden><div class="structure-actions">'+[['normal','完整'],['rotate','慢转'],['explode','拆解'],['slice','横切'],['restore','复原'],['particles','粒子化']].map(([v,n])=>'<button data-structure="'+v+'">'+n+'</button>').join('')+'</div><label for="structure-part">局部观察</label><select id="structure-part"><option value="">转动整体</option>'+parts.map(p=>'<option value="'+p.id+'">'+p.label+'</option>').join('')+'</select><div class="structure-local"><button data-structure="left" aria-label="向左观察局部">↶</button><button data-structure="right" aria-label="向右观察局部">↷</button><button data-structure="zoom-out" aria-label="缩小文物">−</button><button data-structure="zoom-in" aria-label="放大文物">＋</button></div><p class="structure-status" role="status" aria-live="polite"></p><progress class="structure-hold" max="1" value="0" aria-label="手势保持进度"></progress><p class="structure-note">张掌转动，停稳拆解；快挥横切，握拳复原；捏合选部件。<br>拖动 / 方向键观察 · E 拆解 · X 横切 · R 复原 · P 粒子<br><em>程序化器形与模拟切面，仅作数字艺术演示，不代表考古内部结构。</em></p><button data-structure="camera-off" class="structure-camera" hidden>关闭摄像头，使用鼠标</button></div>';host.append(panel);}
   const s=snapshot,toggle=panel.querySelector('[data-structure="toggle"]');toggle.setAttribute('aria-expanded',String(s.enabled));toggle.firstChild.textContent=s.enabled?'返回动作互动 ':'结构探索 ';panel.querySelector('.structure-body').hidden=!s.enabled;
   for(const b of panel.querySelectorAll('.structure-actions button'))b.setAttribute('aria-pressed',String(b.dataset.structure===s.mode));
   const selector=panel.querySelector('select');if(document.activeElement!==selector)selector.value=s.selected||'';selector.disabled=s.slice>.05;
   const selected=parts.find(p=>p.id===s.selected)?.label;const status=names[s.mode]+(selected?' · '+selected:'')+'｜'+s.gesture,el=panel.querySelector('.structure-status');if(el.textContent!==status)el.textContent=status;
   panel.querySelector('progress').value=s.hold;panel.querySelector('[data-structure="camera-off"]').hidden=!camera;
  },
  dispose(){host.removeEventListener('click',click);host.removeEventListener('change',change);document.removeEventListener('keydown',key);},
 };
}
