/* ---------- fake screenshots ---------- */
function rng(seed){let s=(seed*2654435761)>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const shotCache=new Map();
function makeShot(v,salt){
  const key=v+':'+salt;if(shotCache.has(key))return shotCache.get(key);
  const W=800,H=500,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');const R=rng(v*97+salt*13+5);
  const rect=(x,y,w,h,f,r=0,s)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=1.5;c.stroke()}};
  const bar=(x,y,w,f='#DAD6CD',h=7)=>rect(x,y,w,h,f,3.5);
  const txt=(s,x,y,sz,f,wt=500,al='left')=>{c.fillStyle=f;c.textAlign=al;c.font=`${wt} ${sz}px Inter,system-ui,sans-serif`;c.fillText(s,x,y)};
  const IND='#4F5BD5',HL='#E5EAFF';
  rect(0,0,W,H,'#FFFFFF');rect(0,0,144,H,'#F4F2EE');c.fillStyle='#E7E3DB';c.fillRect(143,0,1,H);
  rect(16,16,18,18,IND,5);txt('Ledgerly',42,30,13,'#2F2F2F',600);
  const nav=['Overview','Invoices','Clients','Payments','Settings'];let click={x:.5,y:.5};
  nav.forEach((n,i)=>{const y=62+i*34;const act=v===0?i===1:i===1;if(act){rect(8,y-6,128,28,v===0?HL:'#E8EAF8',6,v===0?IND:null)}rect(20,y+1,12,12,act?IND:'#CFCBC2',3);txt(n,40,y+11,12,act?'#2F2F2F':'#6B675F',act?600:500)});
  rect(144,0,W-144,48,'#FFFFFF');c.fillStyle='#EFEBE3';c.fillRect(144,48,W-144,1);rect(168,10,220,28,'#F4F2EE',14);txt('Search',186,28,11,'#9A968E',400);rect(W-46,10,28,28,'#CFCBC2',14);
  const X=168,BW=W-X-24;
  if(v===0){txt('Overview',X,92,20,'#2F2F2F',600);for(let i=0;i<3;i++){const x=X+i*((BW+12)/3);rect(x,112,(BW-24)/3,86,'#FBFAF8',8,'#EFEBE3');bar(x+14,128,60,'#DAD6CD',6);txt(['£48,210','£12,904','14 open'][i],x+14,168,20,'#2F2F2F',600)}
    for(let i=0;i<12;i++){const h=30+R()*110;rect(X+i*50,440-h,34,h,i===8?IND:'#E4E1D9',4)}
    click={x:(70)/W,y:(62+34+7)/H};}
  else if(v===1){txt('Invoices',X,92,20,'#2F2F2F',600);rect(W-170,70,146,30,IND,6);txt('New invoice',W-97,90,12,'#fff',600,'center');
    c.fillStyle='#EFEBE3';[0,1,2,3,4,5,6].forEach(i=>{const y=122+i*46;if(i===2){rect(X-6,y-8,BW+12,42,HL,6,IND)}else c.fillRect(X,y+36,BW,1);txt(['INV-2039','INV-2040','INV-2041','INV-2042','INV-2043','INV-2044','INV-2045'][i],X+8,y+18,12,'#2F2F2F',600);bar(X+120,y+11,[90,70,110][i%3]);bar(X+330,y+11,50);txt(['£1,204.00','£860.50','£33.34','£2,118.00','£97.20','£402.00','£510.75'][i],X+BW-10,y+18,12,'#2F2F2F',500,'right')});
    click={x:(X+60)/W,y:(122+2*46+14)/H};}
  else if(v===2||v===4){txt('INV-2041',X,92,20,'#2F2F2F',600);bar(X,108,90,'#DAD6CD',6);rect(X,134,230,34,'#FBFAF8',6,'#E4E1D9');txt('Acme Ltd',X+12,156,12,'#2F2F2F',500);rect(X+250,134,150,34,'#FBFAF8',6,'#E4E1D9');bar(X+264,148,70);
    c.fillStyle='#EFEBE3';c.fillRect(X,200,BW,1);['Item','Qty','Price'].forEach((h,i)=>txt(h,[X,X+360,X+BW-10][i],196,10,'#9A968E',600,i===2?'right':'left'));
    [0,1,2].forEach(i=>{const y=214+i*40;bar(X,y+10,[170,120,150][i]);bar(X+360,y+10,24);bar(X+BW-70,y+10,60);c.fillStyle='#F4F2EE';c.fillRect(X,y+36,BW,1)});
    if(v===2){rect(X-2,340,140,32,HL,6,IND);txt('+ Add line item',X+68,361,12,IND,600,'center');click={x:(X+68)/W,y:356/H};}
    else{rect(W-150,64,126,32,IND,6);txt('Save invoice',W-87,84,12,'#fff',600,'center');rect(X,350,BW,0,null);click={x:(W-87)/W,y:80/H};bar(X,360,200,'#EEEBE4');bar(X,380,140,'#EEEBE4')}
  }
  else if(v===3){txt('INV-2041',X,92,20,'#2F2F2F',600);bar(X,112,140);for(let i=0;i<3;i++){bar(X,160+i*34,[200,150,180][i]);bar(X+BW-80,160+i*34,60)}
    c.fillStyle='#00000059';c.fillRect(144,48,W-144,H-48);c.fillStyle='#00000059';c.fillRect(0,0,144,H);c.fillStyle='#00000059';c.fillRect(144,0,W-144,48);
    const mx=250,my=130,mw=330,mh=250;rect(mx,my,mw,mh,'#fff',12);txt('Check total',mx+22,my+36,15,'#2F2F2F',600);bar(mx+22,my+54,170,'#DAD6CD',6);
    rect(mx+22,my+82,mw-44,36,'#FBFAF8',6,'#E4E1D9');txt('Line items',mx+34,my+105,12,'#6B675F',500);
    rect(mx+22,my+130,mw-44,40,HL,6,IND);txt('Total',mx+34,my+155,12,'#6B675F',500);txt('£33.34',mx+mw-34,my+155,14,'#2F2F2F',600,'right');
    rect(mx+mw-112,my+192,90,32,IND,6);txt('Review',mx+mw-67,my+212,12,'#fff',600,'center');click={x:(mx+mw/2)/W,y:(my+150)/H};}
  else{txt('INV-2041',X,92,20,'#2F2F2F',600);rect(X+110,70,64,22,'#E8F4EC',11);txt('Saved',X+142,85,10,'#33564A',600,'center');
    [0,1,2].forEach(i=>{const y=124+i*40;bar(X,y+10,[170,120,150][i]);bar(X+360,y+10,24);bar(X+BW-70,y+10,60);c.fillStyle='#F4F2EE';c.fillRect(X,y+36,BW,1)});
    rect(W-250,300,226,100,'#FBFAF8',8,'#EFEBE3');txt('Subtotal',W-234,328,12,'#6B675F',500);txt('£33.33',W-38,328,12,'#2F2F2F',500,'right');rect(W-240,344,206,40,HL,6,IND);txt('Total',W-228,369,12,'#6B675F',500);txt('£33.34',W-44,369,14,'#B3431F',600,'right');click={x:(W-44-30)/W,y:364/H};}
  const out={cv,x:click.x,y:click.y};shotCache.set(key,out);return out;
}
const dispCache=new Map();
function makeDisplay(n){if(dispCache.has(n))return dispCache.get(n);const cv=document.createElement('canvas');cv.width=240;cv.height=150;const c=cv.getContext('2d');
  const g=c.createLinearGradient(0,0,240,150);g.addColorStop(0,'#2E4A40');g.addColorStop(1,'#82B09A');c.fillStyle=g;c.fillRect(0,0,240,150);c.fillStyle='#ffffff55';c.fillRect(0,0,240,8);
  const win=(x,y,w,h)=>{c.fillStyle='#FBFAF8';c.beginPath();c.roundRect(x,y,w,h,4);c.fill();c.fillStyle='#E8E4DC';c.fillRect(x,y+8,w,1);[0,1,2].forEach(i=>{c.fillStyle=['#FF5F57','#FEBC2E','#28C840'][i];c.fillRect(x+5+i*6,y+3,3,3)});c.fillStyle='#DAD6CD';for(let i=0;i<4;i++)c.fillRect(x+8,y+16+i*10,w*(.4+.12*((i+n)%3)),4)};
  if(n){win(40,24,110,80);win(120,50,100,76)}else{win(24,22,150,100);win(150,40,70,70)}
  c.fillStyle='#ffffff40';c.beginPath();c.roundRect(80,136,80,8,4);c.fill();dispCache.set(n,cv);return cv}
function paintShots(root=document){
  $$('canvas.shot',root).forEach(cv=>{if(cv._p)return;cv._p=1;const s=makeShot(+cv.dataset.v,+cv.dataset.salt);cv.getContext('2d').drawImage(s.cv,0,0,cv.width,cv.height)});
  $$('canvas.dsp',root).forEach(cv=>{if(cv._p)return;cv._p=1;cv.getContext('2d').drawImage(makeDisplay(+cv.dataset.n),0,0)});
}
