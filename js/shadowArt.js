/** Original cut-leather illustrations, painted per articulated part. */
export function paintPuppetPart(kind,role){
 const cv=document.createElement('canvas');cv.width=256;cv.height=kind==='head'?320:512;const c=cv.getContext('2d'),h=cv.height;
 const red=role==='dan'?'#b3482c':'#863722',gold='#dbb66a',ink='#392b20',teal=role==='dan'?'#3d7061':'#345344';
 const paths={torso:'M92 22 Q126 6 157 24 L189 73 L175 167 L190 255 L222 439 Q136 502 39 445 L76 265 L65 173 L58 72Z',upper:'M91 7 Q128 -2 161 12 L210 320 Q181 417 167 498 L75 495 Q67 420 49 330Z',lower:'M77 9 L174 9 Q187 127 197 240 L223 426 L192 493 L53 490 L30 431 L64 222Z',leg:'M76 9 L178 9 L186 232 L166 498 L78 498 L62 237Z',boot:'M74 5 L172 5 L178 335 Q204 383 243 417 L238 484 L50 485 L54 389Z',hand:'M85 470 L80 280 L48 198 Q45 169 65 180 L99 239 L95 96 Q99 66 113 95 L120 220 L126 62 Q140 39 145 69 L145 220 L161 87 Q177 65 178 101 L168 239 L191 150 Q211 134 207 166 L184 309 L178 469Z'};
 if(kind==='head'){
  c.lineJoin='round';c.lineCap='round';
  if(role==='warrior'){
   const hat=new Path2D('M41 139 L26 83 L68 92 L51 28 L96 55 L128 6 L150 53 L206 25 L189 87 L236 78 L210 141 L173 161 L74 164Z');
   c.fillStyle=red;c.fill(hat);c.strokeStyle=gold;c.lineWidth=5;c.stroke(hat);
   for(let i=0;i<8;i++){c.strokeStyle=i%2?gold:teal;c.lineWidth=3;c.beginPath();c.moveTo(128,125);c.quadraticCurveTo(40+i*23,87,57+i*21,47+Math.abs(i-3.5)*9);c.stroke();}
   for(let i=0;i<9;i++){c.beginPath();c.arc(58+i*18,127,5,0,7);c.fillStyle=gold;c.fill();c.fillStyle=red;c.beginPath();c.arc(58+i*18,127,2,0,7);c.fill();}
  }else{
   c.fillStyle=ink;c.beginPath();c.ellipse(128,116,64,71,-.2,0,7);c.fill();c.fillStyle=red;
   for(let i=0;i<6;i++){const x=65+i*24,y=70-Math.sin(i/5*Math.PI)*34;c.beginPath();c.arc(x,y,12,0,7);c.fill();c.strokeStyle=gold;c.lineWidth=3;c.stroke();c.fillStyle=gold;c.beginPath();c.arc(x,y,4,0,7);c.fill();c.fillStyle=red;}
   c.strokeStyle=gold;c.lineWidth=3;for(let i=0;i<5;i++){c.beginPath();c.moveTo(73+i*24,83);c.lineTo(66+i*23,139);c.stroke();}
  }
  const face=new Path2D('M134 126 Q164 126 175 148 L177 158 L200 168 L180 178 L182 192 Q171 214 150 207 L150 251 L110 251 L119 194 Q104 168 115 143Z');
  c.fillStyle='#e0bb79';c.fill(face);c.strokeStyle=ink;c.lineWidth=3;c.stroke(face);
  c.strokeStyle=ink;c.lineWidth=4;c.beginPath();c.moveTo(145,148);c.quadraticCurveTo(160,141,169,150);c.stroke();c.lineWidth=2;c.beginPath();c.moveTo(147,157);c.quadraticCurveTo(158,162,169,156);c.stroke();c.beginPath();c.arc(162,157,2.5,0,7);c.fillStyle=ink;c.fill();
  c.strokeStyle=red;c.lineWidth=3;c.beginPath();c.moveTo(168,189);c.lineTo(182,187);c.stroke();
  c.fillStyle=teal;c.fillRect(109,230,43,19);c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(109,230,43,19);
  if(role==='warrior'){c.strokeStyle=ink;c.lineWidth=3;for(let i=0;i<7;i++){c.beginPath();c.moveTo(145+i*4,197);c.bezierCurveTo(154+i*4,220,130+i*4,245,143+i*4,281);c.stroke();}}
  else{c.strokeStyle=gold;c.lineWidth=3;c.beginPath();c.ellipse(130,185,7,12,0,0,7);c.stroke();for(let i=0;i<3;i++){c.beginPath();c.moveTo(126+i*4,195);c.lineTo(122+i*5,236+i*3);c.stroke();c.beginPath();c.arc(122+i*5,238+i*3,3,0,7);c.fillStyle=red;c.fill();}}
 }else{
  const path=new Path2D(paths[kind]);c.save();c.clip(path);const g=c.createLinearGradient(20,0,230,h);g.addColorStop(0,kind==='hand'?'#dfb977':red);g.addColorStop(.55,kind==='hand'?'#c49855':role==='dan'?'#8a3828':'#a96136');g.addColorStop(1,kind==='hand'?'#e7c78c':teal);c.fillStyle=g;c.fillRect(0,0,256,h);
  if(kind!=='hand'){
   c.strokeStyle=gold;c.lineWidth=4;
   for(let row=0;row<9;row++)for(let col=0;col<5;col++){const x=35+col*47+(row%2)*20,y=35+row*57;c.beginPath();c.ellipse(x,y,17,22,.3,0,7);c.stroke();c.lineWidth=1.7;c.beginPath();c.moveTo(x-10,y+6);c.quadraticCurveTo(x+18,y-17,x-7,y-13);c.stroke();c.lineWidth=4;}
   c.fillStyle=gold;c.globalAlpha=.8;c.fillRect(54,0,7,h);c.fillRect(186,0,7,h);c.globalAlpha=1;
   c.globalCompositeOperation='destination-out';for(let row=0;row<8;row++)for(let col=0;col<4;col++){const x=54+col*47,y=52+row*57;c.beginPath();c.ellipse(x,y,3.5,7,.4,0,7);c.fill();}c.globalCompositeOperation='source-over';
   c.strokeStyle=ink;c.globalAlpha=.1;c.lineWidth=.6;for(let i=0;i<80;i++){c.beginPath();c.moveTo(20,(i*37)%h);c.lineTo(250,(i*37)%h+12);c.stroke();}c.globalAlpha=1;
  }
  c.restore();c.strokeStyle=ink;c.lineWidth=7;c.stroke(path);c.strokeStyle=gold;c.lineWidth=2;c.stroke(path);
  if(kind==='torso'){c.strokeStyle=gold;c.lineWidth=6;c.beginPath();c.moveTo(95,25);c.quadraticCurveTo(150,105,180,240);c.stroke();c.fillStyle=teal;c.fillRect(77,230,107,26);c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(77,230,107,26);for(let i=0;i<5;i++){c.beginPath();c.arc(88+i*21,242,5,0,7);c.stroke();}}
 }
 return cv;
}
export function paintScreen(backdrop){
 const cv=document.createElement('canvas');cv.width=1600;cv.height=1000;const c=cv.getContext('2d');
 const g=c.createRadialGradient(800,440,20,800,480,1000);g.addColorStop(0,'#f3dfae');g.addColorStop(.6,'#d4b87d');g.addColorStop(1,'#6c4a30');c.fillStyle=g;c.fillRect(0,0,1600,1000);
 c.strokeStyle='#654d2e';c.globalAlpha=.06;c.lineWidth=.5;for(let i=0;i<2300;i++){const x=(i*79.31)%1600;c.beginPath();c.moveTo(x,0);c.lineTo(x+4,1000);c.stroke();}for(let y=0;y<1000;y+=3){c.beginPath();c.moveTo(0,y);c.lineTo(1600,y+1);c.stroke();}c.globalAlpha=1;
 c.fillStyle='#79694a';c.globalAlpha=.11;for(let layer=0;layer<3;layer++){c.beginPath();c.moveTo(0,1000);for(let i=0;i<=14;i++)c.lineTo(i*130,850-layer*60+Math.sin(i*.9+layer)*55);c.lineTo(1600,1000);c.fill();}
 c.globalAlpha=.19;c.strokeStyle='#685539';c.lineWidth=3;
 if(backdrop==='moon'){c.beginPath();c.arc(1240,220,80,0,Math.PI*2);c.stroke();c.fillStyle='#e1cc96';c.fill();for(let i=0;i<8;i++){c.beginPath();c.moveTo(80,730+i*5);c.quadraticCurveTo(210,610,330,650+i*8);c.stroke();}}
 else{c.beginPath();c.moveTo(1130,500);c.quadraticCurveTo(1260,480,1355,390);c.quadraticCurveTo(1440,475,1560,500);c.lineTo(1130,500);c.stroke();c.strokeRect(1210,510,290,280);c.strokeRect(1240,535,230,225);for(let i=0;i<5;i++){c.beginPath();c.moveTo(1240+i*57,535);c.lineTo(1240+i*57,760);c.stroke();}}
 c.globalAlpha=1;
 for(const x of [0,1460]){const fold=c.createLinearGradient(x,0,x+140,0);fold.addColorStop(0,'#351a13');fold.addColorStop(.45,'#702e1d');fold.addColorStop(.8,'#472016');fold.addColorStop(1,'#2a1912');c.fillStyle=fold;c.fillRect(x,0,140,1000);c.strokeStyle='#b38d4c';c.globalAlpha=.5;for(let i=0;i<7;i++){c.beginPath();c.moveTo(x+18+i*18,0);c.lineTo(x+18+i*18,1000);c.stroke();}c.globalAlpha=1;}
 c.fillStyle='#3d2316';c.fillRect(0,0,1600,55);c.fillRect(0,950,1600,50);c.strokeStyle='#b69759';c.lineWidth=3;c.strokeRect(13,13,1574,974);c.lineWidth=1;c.strokeRect(152,69,1296,868);
 c.fillStyle='#725431';c.font='22px serif';c.fillText('一 方 素 幕 · 万 般 人 间',205,120);c.fillStyle='#9c4c31';c.fillRect(205,145,29,43);c.fillStyle='#d7bd84';c.font='20px serif';c.fillText('影',209,174);return cv;
}
