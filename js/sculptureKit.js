import * as THREE from 'three';import {createStageKit} from './stageKit.js?v=awakening1';
/** Small modelling vocabulary shared by the three original articulated relics. */
export function createSculptureKit(options){
 const kit=createStageKit(options),bronze=options.environment.createBronzeMaterial(),gold=options.environment.createGoldMaterial(),dark=new THREE.MeshStandardMaterial({color:0x112e26,metalness:.62,roughness:.82});
 function solid(shape,depth=1,parent=kit.root,material=bronze,bevel=.28){const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:32});const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.05+.31,uv.getY(i)*.05+.16);return kit.mesh(g,material,parent);}
 function ellipsoid(position,scale,parent=kit.root,material=bronze){const m=kit.mesh(new THREE.SphereGeometry(1,48,32),material,parent);m.position.set(...position);m.scale.set(...scale);return m;}
 function ring(position,radius,tube=.12,parent=kit.root,material=gold){const m=kit.mesh(new THREE.TorusGeometry(radius,tube,8,64),material,parent);m.position.set(...position);return m;}
 function leaf(length,width){const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(-width*.75,length*.3,-width*.65,length*.8,0,length);s.bezierCurveTo(width*.65,length*.8,width*.75,length*.3,0,0);return s;}
 function glyph(x,y,z,scale=1,parent=kit.root){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);kit.curve([[-2,-2,0],[-2,2,0],[2,2,0],[2,-1,0],[0,-1,0],[0,1,0]],.09,gold,g);return g;}
 return {...kit,bronze,gold,dark,solid,ellipsoid,ring,leaf,glyph};
}
