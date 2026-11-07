export function sampleSurface(triangles,count,{random=Math.random}={}){
 const cumulative=[],valid=[];let total=0;
 for(let i=0;i+8<triangles.length;i+=9){const ax=triangles[i+3]-triangles[i],ay=triangles[i+4]-triangles[i+1],az=triangles[i+5]-triangles[i+2],bx=triangles[i+6]-triangles[i],by=triangles[i+7]-triangles[i+1],bz=triangles[i+8]-triangles[i+2],area=Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)/2;if(area>1e-12){total+=area;cumulative.push(total);valid.push(i);}}
 if(!total)throw new RangeError('器物没有可采样的表面');const result=new Float32Array(count*3);
 for(let n=0;n<count;n++){const pick=random()*total;let lo=0,hi=cumulative.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(cumulative[mid]<pick)lo=mid+1;else hi=mid;}const i=valid[lo],u=Math.sqrt(random()),v=random(),a=1-u,b=u*(1-v),c=u*v;for(let j=0;j<3;j++)result[n*3+j]=a*triangles[i+j]+b*triangles[i+3+j]+c*triangles[i+6+j];}return result;
}
export function transformSurface(positions,matrix){
 if(matrix?.length!==16||!Array.from(matrix).every(Number.isFinite))throw new TypeError('Invalid surface transform');let cx=0,cy=0,cz=0;const count=positions.length/3;
 for(let i=0;i<positions.length;i+=3){const x=positions[i],y=positions[i+1],z=positions[i+2];positions[i]=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12];positions[i+1]=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13];positions[i+2]=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14];cx+=positions[i];cy+=positions[i+1];cz+=positions[i+2];}
 return {x:count?cx/count:0,y:count?cy/count:0,z:count?cz/count:0};
}
