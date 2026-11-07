// An original fictional encounter, not a claim about the relic's identity or voice.
export const RELIC_DIALOGUE={
 opening:{turn:1,text:'远道而来的朋友，你好。你停在这里，是想知道我的名字，还是想听听青铜留下的故事？',choices:[['我想知道，你是谁。','identity'],['我想听听，你的故事。','story']]},
 identity:{turn:2,text:'人们称我为青铜大立人。至于我曾是谁，仍藏在未解的历史里。你觉得，一件文物最值得留下的是什么？',choices:[['是它经历过的真实岁月。','memory'],['是它让今天的人产生的想象。','imagination']]},
 story:{turn:2,text:'我的故事，留在衣上的纹路、弯曲的双臂，还有那些未解的疑问里。你觉得，一件文物最值得留下的是什么？',choices:[['是它经历过的真实岁月。','memory'],['是它让今天的人产生的想象。','imagination']]},
 memory:{turn:3,text:'岁月让青铜改变了颜色，也把曾经的生活留给后来的人。离开这里后，你愿意怎样延续这次相遇？',choices:[['认真了解，让更多人认识古蜀。','learn'],['用自己的创作，回应这份古老。','create']]},
 imagination:{turn:3,text:'想象让遥远的历史与今天相连，而真实的遗存，是想象扎根的地方。离开这里后，你愿意怎样延续这次相遇？',choices:[['认真了解，让更多人认识古蜀。','learn'],['用自己的创作，回应这份古老。','create']]},
 learn:{turn:3,text:'那就带着好奇继续前行吧。还没有答案的问题，也值得被认真记住。谢谢你，听见来自青铜的一次回声。'},
 create:{turn:3,text:'那就让这次相遇，在你的创作里继续生长吧。愿每一次新的表达，都记得回望真实的历史。谢谢你，远道而来的朋友。'}
};
export function createRelicDialogue(){
 let key=null,phase='idle',token=0,answers=[];
 function load(next){key=next;phase='speaking';token++;}
 const api={start(){answers=[];load('opening');},reset(){key=null;phase='idle';answers=[];token++;},speechFinished(t){if(t!==token||phase!=='speaking')return false;phase=RELIC_DIALOGUE[key].choices?'choosing':'finished';return true;},speechFailed(t){if(t!==token||phase!=='speaking')return false;phase='silent';return true;},continueSilently(){if(phase!=='silent')return false;phase=RELIC_DIALOGUE[key].choices?'choosing':'finished';return true;},answer(index){const options=RELIC_DIALOGUE[key]?.choices;if(phase!=='choosing'||!Number.isInteger(index)||!options?.[index])return false;answers.push(options[index][0]);load(options[index][1]);return true;},replay(){if(!key)return false;phase='speaking';token++;return true;},getSnapshot(){const n=RELIC_DIALOGUE[key];return {key,phase,token,turn:n?.turn||0,text:n?.text||'',audio:key?'dialogue-'+key+'.wav':null,choices:phase==='choosing'?n.choices.map(([text],index)=>({text,index})):[],answers:[...answers]};}};return api;
}
