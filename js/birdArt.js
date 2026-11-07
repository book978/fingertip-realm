import * as THREE from 'three';
import {createRelicModeller} from './relicModelling.js?v=0.4.2';
// Modelled from the user's bronze-bird photograph: three pierced crest terminals,
// hooked beak, scrollwork open wings, pendant tail and tall pierced socket.
export function createBronzeBird(k,object){
 const {loft}=createRelicModeller(k),wings=[],eyes=[],tails=[],feet=[];k.bronze.color.setHex(0xd1ceae);k.bronze.roughness=.8;k.bronze.metalness=.62;k.bronze.normalScale.set(.48,.48);
 const relief=k.bronze.clone();relief.color.setHex(0xd8d0ab);relief.roughness=.67;const shadow=k.bronze.clone();shadow.color.setHex(0x59705e);shadow.roughness=.94;
 loft([[-8,1.3,1.25,0],[-6,3.2,2.05,-.1],[-2.8,4.6,2.7,-.6],[.8,4.2,2.65,-1.5],[4,2.8,2.1,-3.6],[7,2.2,1.85,-5.5],[10.7,2.45,1.9,-6.25]],object,k.bronze,{roundness:2.25});
 const head=new THREE.Group();head.position.set(-6.7,11.4,0);object.add(head);k.ellipsoid([0,0,0],[3.05,3.2,2.05],head);
 const beak=new THREE.Shape();beak.moveTo(-1.8,1.95);beak.bezierCurveTo(-5.2,3.25,-7.4,2.5,-7.15,.55);beak.quadraticCurveTo(-7.4,-.8,-6.55,-1.25);beak.quadraticCurveTo(-6.4,.4,-5.6,.28);beak.quadraticCurveTo(-3.55,-.5,-1.75,-.6);beak.closePath();k.solid(beak,2.5,head,k.bronze,.27).position.z=-1.25;
 const jaw=new THREE.Group();jaw.position.set(-2.5,-.7,0);head.add(jaw);const lower=new THREE.Shape();lower.moveTo(.7,.15);lower.quadraticCurveTo(-2,-.65,-3.8,-.1);lower.quadraticCurveTo(-3.6,-1.35,-.2,-1.3);lower.closePath();k.solid(lower,1.75,jaw,k.bronze,.15).position.z=-.87;
 for(const sign of [-1,1]){const eye=k.ellipsoid([-.25,.45,sign*2.04],[1.08,1.17,.2],head,shadow);eye.userData.openScaleY=eye.scale.y;eyes.push(eye);const rim=k.ring([-.25,.45,sign*2.27],1.07,.18,head,relief);rim.scale.y=1.09;if(sign<0)rim.rotation.y=Math.PI;k.ellipsoid([-.25,.45,sign*2.34],[.68,.8,.21],head,k.bronze);
  k.curve([[-2.9,.3,sign*1.3],[-2.15,-1.4,sign*1.9],[-.4,-2.4,sign*2.0],[1.5,-2.05,sign*1.65],[2.35,-.6,sign*1.25]],.22,relief,head);k.curve([[.3,-1.15,sign*2.1],[1.3,-1.2,sign*1.93],[1.6,-.4,sign*1.76]],.09,shadow,head);
 }
 function drop(x,y,parent,scale=1){const shape=new THREE.Shape();shape.moveTo(x,y-1.2*scale);shape.bezierCurveTo(x-1.2*scale,y-.5*scale,x-1.08*scale,y+.9*scale,x,y+2*scale);shape.bezierCurveTo(x+1.08*scale,y+.9*scale,x+1.2*scale,y-.5*scale,x,y-1.2*scale);const hole=new THREE.Path();hole.absellipse(x,y+.32*scale,.43*scale,.7*scale,0,Math.PI*2,true);shape.holes.push(hole);const mesh=k.solid(shape,.65,parent,k.bronze,.12);mesh.name='teardrop-crest';return mesh;}
 // Three separately legible teardrop holes, rather than decorative horns.
 for(let i=0;i<3;i++){const x=.1+i*2.12,y=11.1-i*.35;k.curve([[i*.65-.4,2.2],[2+i,3.8],[x+.8,7.1],[x,y-1.1]],.46,k.bronze,head);drop(x,y,head,.93).position.z=-.33;}
 k.curve([[1.7,-1.4,0],[3.3,-1.6,0],[3.65,-.9,0]],.35,k.bronze,head);
 // Scalloped cast breast bands on both sides, following the curved body.
 for(const sign of [-1,1])for(let row=0;row<5;row++){const y=-5.6+row*1.55,z=sign*(row<2?2.03:2.62);for(let col=0;col<2;col++){const x=-3.5+col*2.1-row*.12;k.curve([[x,y,z],[x+.75,y-.38,z+sign*.08],[x+1.55,y-.02,z]],.075,relief,object);}}
 for(const sign of [-1,1]){
  const shoulder=new THREE.Group();shoulder.position.set(-.4,-1.1,sign*2.25);object.add(shoulder);const outer=new THREE.Group();shoulder.add(outer);const featherGroups=[];
  const wing=new THREE.Shape();wing.moveTo(-1.5,1);wing.bezierCurveTo(3,1.8,8.2,2.4,11.3,5.65);wing.quadraticCurveTo(12.4,6.8,12.85,5.8);wing.bezierCurveTo(13.4,2.2,10.8,-.55,7.8,-2.15);wing.bezierCurveTo(3.6,-4.6,-.1,-4.7,-1.5,-1.6);wing.closePath();
  for(let i=0;i<3;i++){const y=-1.6+i*1.25,h=new THREE.Path();h.moveTo(3,y);h.bezierCurveTo(6,y+.15,9,y+1.1,11.4,y+2.7);h.lineTo(11.25,y+3.35);h.bezierCurveTo(8,y+1.8,6,y+.95,3.15,y+.77);h.closePath();wing.holes.push(h);}
  k.solid(wing,.7,outer,k.bronze,.15).position.z=-.35;
  k.curve([[1.9,1.4,.55],[.1,1.45,.6],[-.95,.2,.6],[-.65,-1.6,.6],[1.2,-2.3,.6],[2.25,-1.65,.6],[2.1,-.4,.6],[1.1,-.25,.6],[.8,-1.1,.6]],.22,relief,outer);
  k.curve([[-1.2,.9,.57],[3,1.85,.57],[8.3,3.05,.57],[11.4,5.8,.57]],.085,relief,outer);wings.push({shoulder,outer,sign,featherGroups});
  const foot=new THREE.Group();foot.position.set(sign*.95,-7.1,.1);object.add(foot);feet.push(foot);k.curve([[0,0,0],[sign*.45,-1.9,.2],[.2,-3.2,.3]],.47,k.bronze,foot);for(let j=-1;j<=1;j++)k.curve([[.2,-2.8,.3],[j*.9,-3.35,1.1],[j*1.15,-3.12,1.8]],.21,k.bronze,foot);
 }
 const tail=new THREE.Group();tail.position.set(9.6,2,-.3);object.add(tail);
 const tailShape=new THREE.Shape();tailShape.moveTo(-.7,-1);tailShape.bezierCurveTo(1,3.9,1.1,8.7,3.15,12.2);tailShape.lineTo(5.3,16.9);tailShape.quadraticCurveTo(6.5,18.5,6.8,17.5);tailShape.lineTo(5.65,12.8);tailShape.lineTo(4.1,9.7);tailShape.bezierCurveTo(2.3,5,3.3,.7,4.5,-4.6);tailShape.quadraticCurveTo(6,-9.1,8,-10.1);tailShape.lineTo(7.3,-11.4);tailShape.bezierCurveTo(3.2,-10.9,1.1,-8.4,.4,-4.25);tailShape.lineTo(-.7,-1);tailShape.closePath();
 const slot=new THREE.Path();slot.moveTo(2.15,.7);slot.bezierCurveTo(2.1,5,3.2,10,5.2,14.2);slot.lineTo(4.25,10);slot.bezierCurveTo(2.8,5,3.1,2,3.4,-.4);slot.closePath();tailShape.holes.push(slot);
 const pendant=k.solid(tailShape,.85,tail,k.bronze,.16);pendant.position.z=-.43;tails.push(pendant);
 for(let i=0;i<3;i++){const f=k.curve([[1.8+i*.65,1,.2+i*.42],[2.2+i*.7,-4,.2+i*.42],[4+i*.7,-9-i*.5,.2+i*.42],[5+i*.8,-10.6-i*.5,.2+i*.42]],.25,k.bronze,tail);tails.push(f);}
 for(const sign of [-1,1]){k.curve([[2.35,8,sign*.65],[.8,9.1,sign*.72],[-1.2,8.8,sign*.72],[-2,7.6,sign*.72],[-1,6.7,sign*.72],[.1,7.05,sign*.72],[.15,7.8,sign*.72]],.33,relief,tail);k.curve([[3.9,10.6,sign*.48],[4.8,13.4,sign*.48],[7,17.6,sign*.48]],.25,k.bronze,tail);}
 const loop=k.ring([7.4,-11.6,.1],.83,.14,tail,relief);loop.scale.y=1.3;
 // Tall, hollow attachment socket replaces the earlier short rectangular perch.
 const perch=new THREE.Group();k.root.add(perch);perch.userData.excludeFromParticles=true;
 const socket=new THREE.Shape();socket.moveTo(-2.45,-24.7);socket.quadraticCurveTo(-3.1,-23.1,-2.1,-21.3);socket.lineTo(-2.15,-16.8);socket.bezierCurveTo(-2.4,-13,-4,-12.1,-3.55,-10.4);socket.quadraticCurveTo(0,-8.5,3.55,-10.4);socket.bezierCurveTo(4,-12.1,2.4,-13,2.15,-16.8);socket.lineTo(2.1,-21.3);socket.quadraticCurveTo(3.1,-23.1,2.45,-24.7);socket.closePath();
 const arch=new THREE.Path();arch.moveTo(-1.05,-21.5);arch.lineTo(-1.2,-16.1);arch.bezierCurveTo(-1.2,-13.5,1.2,-13.5,1.2,-16.1);arch.lineTo(1.05,-21.5);arch.closePath();socket.holes.push(arch);
 for(const x of [-1.3,1.3]){const h=new THREE.Path();h.absellipse(x,-23.35,.45,.49,0,Math.PI*2,true);socket.holes.push(h);}k.solid(socket,2.6,perch,k.bronze,.16).position.z=-1.3;
 for(const sign of [-1,1]){k.curve([[sign*2.1,-20.8,1.45],[sign*2.3,-16,1.45],[sign*2.3,-13.4,1.45],[sign*4.9,-11.6,.1]],.3,relief,perch);k.curve([[sign*.6,-7.9,1],[sign*1.7,-8.5,1.5],[sign*2.2,-7.7,1.55],[sign*1.7,-6.9,1.5]],.26,k.bronze,object);}
 return {wings,eyes,tails,feet,head,jaw,tail,perch};
}
