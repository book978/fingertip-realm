// Original architectural light study, generated locally without image requests.
export function createDialogueBackdrop(){
 const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const c=canvas.getContext('2d'),w=1920,h=1080,vx=1010,vy=570;
 const background=c.createLinearGradient(0,0,w,h);background.addColorStop(0,'#071812');background.addColorStop(.5,'#041016');background.addColorStop(1,'#0c2025');c.fillStyle=background;c.fillRect(0,0,w,h);
 const haze=(x,y,r,color)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);};haze(600,470,670,'#89734130');haze(1340,490,610,'#72b1b326');
 const polygon=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 polygon([[0,760],[vx,vy],[w,750],[w,h],[0,h]],'#10201f');
 c.lineWidth=1;for(let i=-8;i<=8;i++){c.strokeStyle='#71908717';c.beginPath();c.moveTo(vx,vy);c.lineTo(vx+i*260,h);c.stroke();}
 for(let i=0;i<11;i++){const y=vy+Math.pow(i/10,1.8)*(h-vy);c.strokeStyle='#758b7917';c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const near=1-i*.16,x=side<0?85+i*156:w-85-i*156,top=90+i*60,bottom=970-i*72,width=94*near;
  const wall=c.createLinearGradient(x-width,0,x+width,0);wall.addColorStop(0,'#040e10');wall.addColorStop(.55,side<0?'#243128':'#183238');wall.addColorStop(1,'#071516');c.fillStyle=wall;c.fillRect(x-width/2,top,width,bottom-top);
  c.fillStyle=side<0?'#c7a77355':'#8ec5c055';c.fillRect(x-width/2,top,2,bottom-top);haze(x-width/2,top+70,90,side<0?'#c6a46e16':'#79c0ca16');
  c.strokeStyle='#b8bb9b18';c.strokeRect(x-width/2-9,top-9,width+18,bottom-top+18);
 }
 c.strokeStyle='#a6b6a432';c.lineWidth=1.5;c.strokeRect(755,230,500,410);c.strokeStyle='#bdad7840';c.beginPath();c.moveTo(740,650);c.lineTo(1280,650);c.stroke();
 for(const x of [830,1190]){const g=c.createLinearGradient(0,190,0,760);g.addColorStop(0,'#b9d5c066');g.addColorStop(1,'#b9d5c000');c.fillStyle=g;c.fillRect(x,190,2,570);}
 const shade=c.createRadialGradient(w/2,h/2,150,w/2,h/2,1100);shade.addColorStop(0,'#00000000');shade.addColorStop(1,'#000a0dc0');c.fillStyle=shade;c.fillRect(0,0,w,h);
 return canvas;
}
