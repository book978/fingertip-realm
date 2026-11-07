import {createMaskMotion} from './maskMotion.js?v=awakening1';
import {createBirdMotion} from './birdMotion.js?v=awakening1';
import {createTreeMotion} from './treeMotion.js?v=journey3';
import {createFigureMotion} from './figureMotion.js?v=0.4.4';
import {createAwakeMaskStage} from './awakeMaskStage.js?v=journey3';
import {createAwakeBirdStage} from './awakeBirdStage.js?v=0.4.4';
import {createAwakeTreeStage} from './awakeTreeStage.js?v=journey3';
import {createFigureStage} from './figureStage.js?v=0.4.4';
import {createChapterSession} from './chapterSession.js?v=0.4.4';
import {createSceneBackdrop} from './sceneBackdrop.js?v=0.4.4';
export function createChapterRuntime(options){
 let active=null,size={width:innerWidth,height:innerHeight};
 const factories={mask:[createMaskMotion,createAwakeMaskStage],bird:[createBirdMotion,createAwakeBirdStage],tree:[createTreeMotion,createAwakeTreeStage],shadow:[createFigureMotion,createFigureStage]};
 function dispose(){if(!active)return;active.controller.cancelPerformance();active.stage.dispose();active.background.dispose();options.environment.resetView();active=null;}
 return {activate(id,snapshot){if(!factories[id])throw new Error('未知章节');dispose();const [mf,sf]=factories[id],motion=mf({reducedMotion:options.reduceMotion}),controller=createChapterSession({chapterId:id,motion,reduceMotion:options.reduceMotion}),stage=sf(options),background=createSceneBackdrop({...options,chapterId:id});
 if(snapshot)controller.restore(snapshot);stage.layout(size);background.layout(size);active={id,controller,stage,background,hotspotId:null};return active;},getActive(){return active;},layout(s){if(s.stageRect&&(!s.stageRect.width||!s.stageRect.height))return;size=s;active?.stage.layout(s);active?.background.layout(s);},dispose};
}
