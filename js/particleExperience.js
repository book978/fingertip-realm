import {createRelicParticleForm} from './relicParticles.js?v=0.4.0';
export function createParticleExperience(ps){
 const sizes=ps.sz.slice();let form=null,mode='image',yaw=0,pitch=0,last=null,candidate=null,gestureSince=0,lastCapture=-Infinity,layoutMatrix=null;
 function appearance(active){ps.setParticleActivity(active);for(let i=0;i<sizes.length;i++)ps.sz[i]=sizes[i]*(active?.75:.18);ps.geo.attributes.aSize.needsUpdate=true;}
 function setMode(value){if(!form||!['image','scatter','vortex','wave','implode'].includes(value))return;mode=value;ps.setMode(value);if(value==='image')ps.setImageTargets(form.positions,form.colors);ps.energy=.3;}
 function cancelInput(){last=null;candidate=null;lastCapture=-Infinity;}
 return {get mode(){return mode;},cancelInput,
 enable(stage,snapshot,{fromCurrent=false}={}){stage.root.visible=true;const from=fromCurrent?createRelicParticleForm(stage.structure?.particleObject??stage.particleObject).positions:null;stage.applySnapshot(stage.particleSnapshot(snapshot),0);form=createRelicParticleForm(stage.particleObject);stage.root.updateWorldMatrix(true,false);layoutMatrix=stage.root.matrixWorld.clone();stage.applySnapshot(snapshot,0);yaw=pitch=0;cancelInput();appearance(true);if(from){ps.pos.set(from);ps.vel.fill(0);ps.geo.attributes.position.needsUpdate=true;}setMode('image');stage.root.visible=false;},
 relayout(stage){if(!form||!layoutMatrix)return false;stage.root.updateWorldMatrix(true,false);const next=stage.root.matrixWorld;if(layoutMatrix.equals(next))return false;const delta=next.clone().multiply(layoutMatrix.clone().invert());form.reproject(delta);form.rotate(yaw,pitch);layoutMatrix.copy(next);return true;},
 getSnapshot(){return {mode,yaw,pitch,samples:form?form.positions.length/3:0};},
 disable(stage){form=null;cancelInput();appearance(false);ps.setMode('idle');ps.clearImageTargets();ps.palH=ps.tgtH=.15;ps.palS=ps.tgtS=.2;ps.palL=ps.tgtL=.26;if(stage)stage.root.visible=true;},setMode,
 gesture(name,now){if(now===lastCapture)return;lastCapture=now;if(candidate!==name){candidate=name;gestureSince=now;return;}if(now-gestureSince<110)return;const map={fist:'image',open:'scatter',point:'vortex',peace:'wave',pinch:'implode'};if(map[name]&&map[name]!==mode)setMode(map[name]);},
 update(s){if(!form)return;if(s?.visible&&mode==='image'){if(s.source==='camera'){yaw+=(s.x*.6-yaw)*.03;pitch+=(-s.y*.2-pitch)*.03;}else if(s.pressed&&last?.pressed){yaw+=(s.x-last.x)*2;pitch=Math.max(-.4,Math.min(.4,pitch-(s.y-last.y)));}}if(s&&!s.visible){cancelInput();if(mode!=='image')setMode('image');}last=s?.visible?{...s}:null;if(mode==='image')form.rotate(yaw,pitch);}
 };
}
