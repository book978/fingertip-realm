const phases={base:'Ⅰ 地光勾勒底座',trunk:'Ⅱ 主干向上显现',branches:'Ⅲ 枝条与立鸟展开',orbit:'Ⅳ 环绕，看见纵深',light:'Ⅴ 流光，从干到枝'};
const birdPhases={base:'Ⅰ 栖座，由暗而明',head:'Ⅱ 目光与鸟首显现',body:'Ⅲ 青铜鸟身凝聚',wings:'Ⅳ 羽翼，循光展开',tail:'Ⅴ 尾羽与足部落定',orbit:'Ⅵ 一次环绕，循鸟入林'};
export function createThirdStepUI({onTryOn,onForm,onScatter,onBirdReplay,onBirdSkip,onTreeReplay,onTreeSkip,onStructure}){
 const host=document.getElementById('chapter-controls'),home=document.getElementById('btn-tryon-home');if(home){home.disabled=false;home.onclick=onTryOn;}
 document.body.dataset.release='0.4.4';const release=document.getElementById('third-release-note');if(release)release.textContent='四阶段完整版 · 0.4.4';
 function click(e){const b=e.target.closest('[data-third]');if(!b||b.disabled)return;const type=b.dataset.third;if(type==='tryon')onTryOn();else if(type==='gold'||type==='bronze')onForm(type);else if(type==='scatter'||type==='gather')onScatter(type==='scatter');else if(type==='bird-replay')onBirdReplay();else if(type==='bird-skip')onBirdSkip();else if(type==='tree-replay')onTreeReplay();else if(type==='tree-skip')onTreeSkip();else if(type==='structure')onStructure();}
 host.addEventListener('click',click);
 return {
  render({id,lab,expression,bird,tree,birdEntry,assetStatus,structureEnabled=false}){
   const supported=!lab&&expression==='solid'&&id!=='shadow';let panel=document.getElementById('third-feature-panel');document.body.dataset.gold=id==='bird'&&bird.progress>0?'on':'off';
   if(!supported){panel?.remove();return;}
   if(!panel||panel.dataset.chapter!==id){panel?.remove();panel=document.createElement('section');panel.id='third-feature-panel';panel.className='third-feature-panel';panel.dataset.chapter=id;
    let body='<p class="third-kicker">第三步 · 新体验</p>';
    if(id==='mask')body+='<button data-third="tryon">开启面具试戴 ↗</button><p>与你的面部相随，也可无相机示范。</p>';
    if(id==='bird')body+='<button data-third="bird-replay">重播青铜神鸟登场</button><button data-third="bird-skip">跳过神鸟登场 →</button><p class="third-bird-status" role="status"></p><progress class="third-bird-progress" max="1" value="0" aria-label="神鸟登场进度"></progress><button data-third="gold">化作太阳神鸟 ✧</button><button data-third="bronze">还原青铜神鸟 ↶</button><div class="third-pair"><button data-third="scatter">金光散开</button><button data-third="gather">重新聚合</button></div><p class="third-gold-status" role="status"></p><progress class="third-gold-progress" max="1" value="0" aria-label="金饰转化进度"></progress><p>太阳神鸟金饰 · 金沙遗址<br>古蜀不同遗址间的艺术呼应。<br><a href="https://www.jinshasitemuseum.com/seardetail/681" target="_blank" rel="noopener">查看金沙博物馆资料 ↗</a></p>';
    if(id==='tree')body+='<button data-third="tree-replay">重播神树登场 ✧</button><button data-third="tree-skip">跳过登场 →</button><p class="third-tree-status" role="status"></p><progress max="1" value="0" aria-label="神树登场进度"></progress><p>生长、展开与流光为数字艺术演绎。</p>';
    body+='<button data-third="structure" class="third-structure">文物拆解 / 横切 ↗</button>';panel.innerHTML=body;host.prepend(panel);
   }
   const goldActive=id==='bird'&&bird.progress>0,entering=(id==='tree'&&tree.status==='playing')||(id==='bird'&&birdEntry.status==='playing'),locked=goldActive||entering;
   const grid=host.querySelector('.action-grid');if(grid){grid.inert=locked;grid.classList.toggle('third-inactive',locked);}const expressionToggle=host.querySelector('.expression-toggle');if(expressionToggle)expressionToggle.inert=locked;
   panel.querySelector('[data-third="structure"]').disabled=locked;
   if(id==='bird'){
    const message=assetStatus==='loading'?'正在准备镂空金饰…':assetStatus==='error'?'金饰暂不可用，可继续青铜互动。':bird.form==='gold'?'四鸟绕日 · 拖动转动，张掌停稳散开 / 握拳聚合。':bird.progress>0?'金光离铜，循环成形…':'以一束金光，连接古蜀的两处遗址。';const status=panel.querySelector('.third-gold-status');if(status.textContent!==message)status.textContent=message;
    panel.querySelector('[data-third="gold"]').disabled=assetStatus!=='ready'||entering;panel.querySelector('[data-third="gold"]').setAttribute('aria-pressed',String(bird.target===1));panel.querySelector('[data-third="bronze"]').disabled=entering;panel.querySelector('[data-third="bronze"]').setAttribute('aria-pressed',String(bird.target===0));
    panel.querySelectorAll('[data-third="scatter"],[data-third="gather"]').forEach(b=>b.disabled=bird.form!=='gold');panel.querySelector('.third-gold-progress').value=bird.progress;
    panel.querySelector('[data-third="bird-replay"]').hidden=entering;panel.querySelector('[data-third="bird-replay"]').disabled=goldActive;panel.querySelector('[data-third="bird-skip"]').hidden=!entering;panel.querySelector('.third-bird-progress').value=birdEntry.progress;panel.querySelector('.third-bird-progress').hidden=!entering;panel.querySelector('.third-bird-status').textContent=entering?birdPhases[birdEntry.phase]:'';
    if(entering)document.getElementById('stage-instruction').textContent=birdPhases[birdEntry.phase]+' · 数字艺术登场，可跳过';else if(goldActive)document.getElementById('stage-instruction').textContent=bird.form==='gold'?'金沙遗址 · 太阳神鸟金饰 · 艺术化呈现｜拖动转动，张掌停稳散开，握拳聚合':'三星堆青铜意象 → 金沙金饰｜跨遗址的艺术呼应';
   }
   if(id==='tree'){
    panel.querySelector('[data-third="tree-replay"]').hidden=entering;panel.querySelector('[data-third="tree-skip"]').hidden=!entering;panel.querySelector('progress').value=tree.progress;
    const message=entering?phases[tree.phase]:'三层九枝，九鸟相应。可继续开花、轻摇或探索结构。',status=panel.querySelector('.third-tree-status');if(status.textContent!==message)status.textContent=message;
    if(entering)document.getElementById('stage-instruction').textContent=phases[tree.phase]+' · 数字艺术登场，可跳过';
   }
  },
  dispose(){host.removeEventListener('click',click);},
 };
}
