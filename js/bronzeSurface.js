import * as THREE from 'three';
/** Shared seeded multi-scale patina, relief normals and roughness. */
export function createBronzeTextures({size=2048,seed=7291}={}){
 let state=seed;const rand=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
 const grids=[8,24,80,220].map(n=>({n,data:Float32Array.from({length:(n+1)**2},rand)}));
 function noise(x,y,{n,data}){const a=x*n,b=y*n,i=Math.floor(a),j=Math.floor(b),u=a-i,v=b-j,s=u*u*(3-2*u),t=v*v*(3-2*v),k=j*(n+1)+i;return (data[k]*(1-s)+data[k+1]*s)*(1-t)+(data[k+n+1]*(1-s)+data[k+n+2]*s)*t;}
 const canvases=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;}),contexts=canvases.map(c=>c.getContext('2d')),images=contexts.map(c=>c.createImageData(size,size)),heights=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const nx=x/size,ny=y/size,a=noise(nx,ny,grids[0]),b=noise(nx,ny,grids[1]),c=noise(nx,ny,grids[2]),fine=noise(nx,ny,grids[3]);
  const field=a*.45+b*.35+c*.2,patina=Math.max(0,Math.min(1,(field-.36)*4.5)),fleck=fine>.72?-.1:0,shade=.68+.42*c+fleck,i=(y*size+x)*4;
  const base=[119,113,83],green=[65,101,87];for(let k=0;k<3;k++)images[0].data[i+k]=(base[k]*(1-patina)+green[k]*patina)*shade;
  images[0].data[i+3]=255;const rough=130+patina*92+fine*25;images[1].data[i]=images[1].data[i+1]=images[1].data[i+2]=rough;images[1].data[i+3]=255;heights[y*size+x]=patina*.5+c*.2+fine*.15;
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x,k=i*4,dx=(heights[y*size+(x+1)%size]-heights[y*size+(x+size-1)%size])*5,dy=(heights[((y+1)%size)*size+x]-heights[((y+size-1)%size)*size+x])*5;images[2].data.set([128-dx*127,128-dy*127,252,255],k);}
 contexts.forEach((c,i)=>c.putImageData(images[i],0,0));const [map,roughnessMap,normalMap]=canvases.map(c=>new THREE.CanvasTexture(c));map.colorSpace=THREE.SRGBColorSpace;
 for(const t of [map,roughnessMap,normalMap]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;}
 return {map,roughnessMap,normalMap,dispose(){map.dispose();roughnessMap.dispose();normalMap.dispose();}};
}
