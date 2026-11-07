import {createMotionGestureRecognizer} from './motionGestures.js?v=awakening1';import {MOTION_ROUTES} from './awakeningData.js?v=awakening1';
export function createAwakeInputRouter({getActive,getExpression,getStructure=()=>null,routeExhibitInput=()=>false,isBlocked=()=>false,onParticleSample=()=>{},onParticleGesture=()=>{}}){
 const recognizer=createMotionGestureRecognizer();return {cancel(){recognizer.clear();getStructure()?.cancel();getActive()?.controller.cancelInput();},consume(frame){if(isBlocked())return;const active=getActive();if(!active)return;
 if(getExpression()!=='particles'&&routeExhibitInput(frame)){recognizer.clear();return;}
 if(getExpression()!=='particles'&&getStructure()?.getSnapshot().enabled){recognizer.clear();const hit=frame?.visible?active.stage.structure?.pick(frame):null;getStructure().input(frame,hit);return;}
 if(!frame)return;
 if(getExpression()==='particles'){recognizer.clear();onParticleSample(frame);if(frame.source==='camera'&&frame.visible&&frame.timeMs-(frame.capturedAtMs??frame.timeMs)<=250&&frame.features)onParticleGesture(frame.features.staticGesture,frame.capturedAtMs??frame.timeMs);return;}
 const probe=active.stage.probe(frame);active.hotspotId=probe?.hotspotId||null;active.controller.handleInput(frame,probe);const routes=MOTION_ROUTES[active.id]||{};
 const result=recognizer.update(frame,{enabledTypes:Object.keys(routes)});for(const event of result.events)active.controller.trigger(routes[event.type],event.timeMs);
 }};
}
