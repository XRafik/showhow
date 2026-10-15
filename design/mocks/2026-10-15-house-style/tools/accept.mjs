import {chromium} from '/Users/mohamedb/dev/projects/showhow/node_modules/playwright/index.mjs';
const url='file:///Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/index.html';
const res=[];const ok=(n,pass,info='')=>{res.push([n,pass]);console.log(pass?'PASS':'FAIL',n,info)};
const b=await chromium.launch({channel:'chrome'});
async function fresh(opts={}){const ctx=await b.newContext({viewport:{width:1440,height:900},...opts});const pg=await ctx.newPage();const errs=[];pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));await pg.goto(url);await pg.waitForTimeout(700);pg.errs=errs;return pg}
const wait=(pg,ms)=>pg.waitForTimeout(ms);const SEL=(pg,v)=>pg.selectOption('#screen',v);
let pg=await fresh();
// 1 + 10
let all=[...pg.errs];const opts=await pg.$$eval('#screen option',o=>o.map(x=>x.value));let hs=[];
for(const o of opts){pg.errs.length=0;await SEL(pg,o);await wait(pg,o==='F2'||o==='F4'||o==='R2'?300:450);all.push(...pg.errs.map(e=>o+': '+e));
  const m=await pg.evaluate(()=>{const q=s=>document.querySelector(s);const mn=q('.main'),ap=q('#app'),ed=q('.editor');return {m:mn?mn.scrollWidth-mn.clientWidth:0,e:ed?ed.scrollWidth-ed.clientWidth:0,a:ap.scrollWidth-ap.clientWidth,d:document.documentElement.scrollWidth-document.documentElement.clientWidth}});
  if(m.m>0||m.e>0||m.a>0||m.d>0)hs.push(o+JSON.stringify(m))}
ok('1 no console errors (load + all '+opts.length+' screens)',all.length===0,JSON.stringify(all));
ok('10 no horizontal scroll on any screen',hs.length===0,JSON.stringify(hs));
// 3 selected row
pg=await fresh();await SEL(pg,'A');await wait(pg,400);
const sr=await pg.evaluate(()=>{const r=document.querySelector('.row.selected'),c=getComputedStyle(r);return {bg:c.backgroundColor,bs:c.boxShadow,bl:c.borderLeftWidth+' '+c.borderLeftStyle}});
ok('3 selected row: fill, no left border / inset bar',sr.bg!=='rgba(0, 0, 0, 0)'&&(sr.bs==='none')&&/^0px/.test(sr.bl),JSON.stringify(sr));
// 4 sidebar canvases
const c0=await pg.locator('.sidebar canvas').count();
await SEL(pg,'C');await wait(pg,400);await pg.click('[data-action=make]');await wait(pg,400);await pg.click('[data-action=generate]');await wait(pg,1200);
const c1=await pg.evaluate(()=>({n:document.querySelectorAll('.sidebar canvas').length,inRow:!!document.querySelector('.row.selected .rstrip canvas')}));
ok('4 no sidebar dither at rest; 1 on the processing row during F2',c0===0&&c1.n===1&&c1.inRow,`rest=${c0} F2=${JSON.stringify(c1)}`);
// 2 cancel
await pg.click('[data-action=cancel-generation]');await wait(pg,500);const ct=await pg.locator('.toast').textContent().catch(()=>'');const eo=await pg.locator('[data-action=make]').count();const c2=await pg.locator('.sidebar canvas').count();
ok('2a generation cancel: toast + empty output state + strip gone',/Stopped\. Nothing was changed\./.test(ct)&&eo===1&&c2===0,`${ct} make=${eo} strips=${c2}`);
// 3(gen) full run
await pg.click('[data-action=make]');await wait(pg,400);await pg.click('[data-action=generate]');const t0=Date.now();let steps=0,landed=false,devSeen=0;
while(Date.now()-t0<12000){const st=await pg.evaluate(()=>({s:document.querySelectorAll('#gnew .step').length,d:!!document.querySelector('canvas.dither[data-kind=dev]'),l:!document.querySelector('.mkcard')&&document.querySelectorAll('.step').length===4}));steps=Math.max(steps,st.s);if(st.d)devSeen++;if(st.l){landed=true;break}await wait(pg,100)}
ok('2b generation C->F1->F2->F3: 4 steps develop, lands within 11s',steps===4&&devSeen>0&&landed&&Date.now()-t0<=11000,`steps=${steps} dev=${devSeen} landed=${landed} ${Date.now()-t0}ms`);
// F4
await SEL(pg,'F4');await wait(pg,6600);const f4=await pg.evaluate(()=>({failed:!!document.querySelector('.mkcard.failed'),steps:document.querySelectorAll('.step').length,txt:document.querySelector('#mkfoot')?.textContent,strips:document.querySelectorAll('.sidebar canvas').length,tag:document.querySelector('.row.selected .tag')?.textContent}));
ok('2c F4 failure: card failed, 2 developed steps stay, row FAILED',f4.failed&&f4.steps===2&&/ChatGPT stopped responding/.test(f4.txt)&&f4.strips===0&&f4.tag==='FAILED',JSON.stringify(f4));
// 8 develop mid + pixel check
pg=await fresh();await SEL(pg,'C');await wait(pg,400);await pg.click('[data-action=make]');await wait(pg,400);await pg.click('[data-action=generate]');
let mid=null;const t1=Date.now();
while(Date.now()-t1<6000){const p=await pg.evaluate(()=>{const d=document.querySelector('canvas.dither[data-kind=dev]');return d?+d.dataset.p:null});if(p!==null&&p>0.25&&p<0.8){mid={p,t:Date.now()-t1};break}await wait(pg,15)}
let px=null;if(mid){const buf=await pg.locator('.gnew .step .thumb').first().screenshot();px=await pg.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const avg=(x0,x1)=>{const d=x.getImageData(x0,0,x1-x0,c.height).data;let s=0;for(let i=0;i<d.length;i+=4)s+=(d[i]+d[i+1]+d[i+2])/3;return s/(d.length/4)};const w=c.width;return {left:avg(0,Math.round(w*.12)),right:avg(Math.round(w*.88),w)}},buf.toString('base64'))}
ok('8 develop: mosaic on one side of the edge, screenshot on the other (mid-develop)',!!mid&&px&&px.left>px.right+40,JSON.stringify({mid,px}));
// 5 button fonts
const fonts=[];
for(const s of ['A','B','C','D','G1','G2','I','I-export','J-ai','pdf','F1','F4']){pg.errs.length=0;await SEL(pg,s);await wait(pg,450);const bad=await pg.evaluate(()=>[...document.querySelectorAll('.btn,.tab,.stab,.stab2,.seg button,.tbtn')].filter(e=>e.offsetParent&&e.textContent.trim()).map(e=>{const c=getComputedStyle(e);return {t:e.textContent.trim().slice(0,20),f:c.fontFamily.split(',')[0],s:c.fontSize,u:c.textTransform}}).filter(o=>!/JetBrains Mono/.test(o.f)||o.s!=='11px'&&!/^10px$/.test(o.s)||o.u!=='uppercase'));fonts.push(...bad.map(o=>s+':'+JSON.stringify(o)))}
ok('5 every button label is JetBrains Mono, uppercase, 11px (tabs/segs 10-11px)',fonts.length===0,JSON.stringify(fonts.slice(0,6)));
// 6 no Instrument Serif
let serif=[];for(const s of ['A','D','G1','I','J-ai','pdf']){await SEL(pg,s);await wait(pg,350);serif.push(...await pg.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>/Instrument/i.test(getComputedStyle(e).fontFamily)).map(e=>e.tagName)))}
const linked=await pg.evaluate(()=>/Instrument/.test(document.documentElement.outerHTML));
ok('6 no element uses Instrument Serif (and it is not loaded)',serif.length===0&&!linked,`${serif.length} elements; referenced=${linked}`);
// 7 offset shadow
pg=await fresh();const sh={};
await SEL(pg,'A');await wait(pg,350);sh.mark=await pg.evaluate(()=>getComputedStyle(document.querySelector('.mark')).boxShadow);
await SEL(pg,'G1');await wait(pg,600);sh.sheet=await pg.evaluate(()=>getComputedStyle(document.querySelector('.sheet')).boxShadow);sh.card=await pg.evaluate(()=>getComputedStyle(document.querySelector('.disp[aria-checked=true]')).boxShadow);
await SEL(pg,'G-countdown');await wait(pg,350);sh.cd=await pg.evaluate(()=>getComputedStyle(document.querySelector('.cdtile')).boxShadow);
await SEL(pg,'G2');await wait(pg,400);sh.hud=await pg.evaluate(()=>getComputedStyle(document.querySelector('.hud')).boxShadow);
await SEL(pg,'B');await wait(pg,300);await pg.evaluate(()=>toast('x'));await wait(pg,500);sh.toast=await pg.evaluate(()=>getComputedStyle(document.querySelector('.toast')).boxShadow);
const has=v=>/4px 4px 0px/.test(v||'');
ok('7 offset shadow on logo mark, sheet, selected source card, countdown tile, HUD, toast',Object.values(sh).every(has),JSON.stringify(sh));
// 2d record + countdown
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('[data-action=record]');await wait(pg,500);await pg.click('[data-action=start]');
const nums=[];for(let i=0;i<7;i++){nums.push(await pg.evaluate(()=>document.querySelector('#cdn')?.textContent||'-'));await wait(pg,450)}
await wait(pg,300);const tm0=await pg.locator('#timer').textContent().catch(()=>'');await wait(pg,3000);const tm=await pg.locator('#timer').textContent();await pg.click('[data-action=stop]');await wait(pg,2300);
const srow=await pg.locator('.row.selected').textContent();const tg=await pg.locator('.row.selected .tag').textContent();
const seq=nums.filter(n=>n!=='-').filter((n,i,a)=>a.indexOf(n)===i).join('');
ok('2d record: countdown 3-2-1, HUD timer, Stop -> new row Untitled recording + NO GUIDE',seq==='321'&&/^00:0[34]$/.test(tm)&&/Untitled recording/.test(srow)&&tg==='NO GUIDE',`countdown=${seq} timer=${tm} row=${srow}`);
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('[data-action=record]');await wait(pg,500);await pg.click('[data-action=start]');await wait(pg,800);await pg.keyboard.press('Escape');await wait(pg,300);
ok('2e countdown cancels with Escape',await pg.locator('#cdn').count()===0&&await pg.locator('.hud').count()===0);
// import
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('[data-action=import]');await wait(pg,400);await pg.click('[data-action=choose]');await wait(pg,2800);
const ir=await pg.locator('.row.selected').textContent();const dk=await pg.locator('.hdr .mono').textContent();ok('2f import path: row IMPORTED, imported deck',/IMPORTED/.test(ir)&&/IMPORTED/.test(dk),`${ir} / ${dk}`);
// editor
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('[data-action=editor]');await wait(pg,400);const z0=await pg.locator('.pill.z').count();await pg.click('[data-action=apply]');await wait(pg,1000);const zp=await pg.locator('.zoom-pill').count();const z3=await pg.locator('.pill.z').count();const ap=await pg.locator('.proposal').textContent();const cut=await pg.locator('.pill.cut').count();
await pg.click('.rail [data-action=export]');await wait(pg,300);await pg.click('[data-action=run-export]');await wait(pg,3300);const ex=await pg.locator('.sheet').textContent();
ok('2g editor path: Apply -> third zoom pill (2 prepopulated + CUT stay), Export -> rendering -> Exported',z0===2&&z3===3&&zp===1&&cut===1&&/Applied/.test(ap)&&/Exported/.test(ex)&&/Show in Finder/i.test(ex),`pill=${zp} cut=${cut} ${ap.trim()} | ${ex.slice(0,40)}`);
// settings + dark
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('[data-action=settings]');await wait(pg,300);const sTitle=await pg.locator('h1.title').textContent();
await SEL(pg,'J-expired');await wait(pg,300);await pg.click('[data-action=sign]');await wait(pg,1500);const sg=await pg.locator('.sec').first().textContent();
const c0b=await pg.evaluate(()=>getComputedStyle(document.querySelector('#app')).backgroundColor);await pg.click('#theme');await wait(pg,200);const c1b=await pg.evaluate(()=>getComputedStyle(document.querySelector('#app')).backgroundColor);
ok('2h settings: opens, Sign in again -> Connected, dark toggle recolours',sTitle==='Settings'&&/Connected/.test(sg)&&c1b===c0b?false:true,`${sTitle} | ${sg.slice(0,60)} | ${c0b}->${c1b}`);
// pdf + remake + copy + hold + tabs
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('[data-action=pdf]');await wait(pg,500);await pg.click('[data-action=run-pdf]');await wait(pg,3400);const pd=await pg.locator('.sheet').textContent();
ok('2i PDF export: progress -> Saved to Downloads',/Saved to Downloads/.test(pd),pd.slice(0,60));
await pg.click('[data-action=close]');await wait(pg,400);await pg.click('[data-action=remake]');await wait(pg,500);await pg.click('[data-action=do-remake]');const t3=Date.now();let rl=false;while(Date.now()-t3<12000){const x=await pg.evaluate(()=>!document.querySelector('.mkcard')&&document.querySelectorAll('.step').length===4);if(x){rl=true;break}await wait(pg,150)}
ok('2j remake: confirm -> run -> 4 new steps',rl,`${Date.now()-t3}ms`);
pg=await fresh();await SEL(pg,'B');await wait(pg,400);const btn=pg.locator('[data-action=copy]');const w0=(await btn.boundingBox()).width;await btn.click();await wait(pg,500);const w1=(await btn.boundingBox()).width;
const lab1=await pg.evaluate(()=>({done:document.querySelector('[data-action=copy]').classList.contains('done'),b:getComputedStyle(document.querySelector('[data-action=copy] .lab .b')).opacity,a:getComputedStyle(document.querySelector('[data-action=copy] .lab .a')).opacity,txt:document.querySelector('[data-action=copy] .lab .b').textContent}));
await wait(pg,1800);const dn=await pg.evaluate(()=>document.querySelector('[data-action=copy]').classList.contains('done'));const w2=(await btn.boundingBox()).width;
ok('2k copy: label -> Copied, reverts ~2s, width unchanged',lab1.done&&lab1.txt==='Copied'&&+lab1.b===1&&+lab1.a===0&&!dn&&Math.abs(w0-w1)<.5&&Math.abs(w0-w2)<.5,`w ${w0}/${w1}/${w2}`);
pg=await fresh();await SEL(pg,'A');await wait(pg,400);const rows=()=>pg.locator('.row').count();const n0=await rows();
await pg.click('[data-action=menu]');await wait(pg,200);let hb=await pg.locator('#menu [data-hold]').boundingBox();await pg.mouse.move(hb.x+40,hb.y+10);await pg.mouse.down();await wait(pg,600);await pg.mouse.up();await wait(pg,400);const n1=await rows();
if(!(await pg.locator('#menu').count()))await pg.click('[data-action=menu]');await wait(pg,200);hb=await pg.locator('#menu [data-hold]').boundingBox();await pg.mouse.move(hb.x+40,hb.y+10);await pg.mouse.down();await wait(pg,2100);await pg.mouse.up();await wait(pg,500);const n2=await rows();
ok('2l hold-to-delete (menu): 600ms no, 2.1s yes',n1===n0&&n2===n0-1,`rows ${n0}/${n1}/${n2}`);
await SEL(pg,'A');await wait(pg,400);const s0=await pg.locator('.step').count();let sb=pg.locator('.step [data-hold]').first();await sb.scrollIntoViewIfNeeded();let sbb=await sb.boundingBox();await pg.mouse.move(sbb.x+10,sbb.y+6);await pg.mouse.down();await wait(pg,2150);await pg.mouse.up();await wait(pg,500);const s1=await pg.locator('.step').count();
ok('2m hold-to-delete (step row)',s1===s0-1,`${s0}->${s1}`);
await SEL(pg,'A');await wait(pg,300);const u0=await pg.evaluate(()=>document.querySelector('#ul').style.transform);await pg.click('[data-output=brief]');await wait(pg,400);const u1=await pg.evaluate(()=>document.querySelector('#ul').style.transform);
ok('2n tabs underline slides',u0!==u1,`${u0}->${u1}`);
// motion 0.1x
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('#m-10');await pg.click('[data-action=record]');const tt0=Date.now();let tEnd=null,dur=null;
for(let i=0;i<400;i++){const r=await pg.evaluate(()=>{const s=document.querySelector('.sheet');return s?{o:s.getAnimations().length,d:getComputedStyle(s).transitionDuration}:null});if(r){dur=r.d;if(r.o===0&&Date.now()-tt0>300){tEnd=Date.now()-tt0;break}}await wait(pg,20)}
ok('2o Motion 0.1x: sheet transition >= 2s',tEnd!==null&&tEnd>=2000,`${tEnd}ms ${dur}`);
// 9 reduced motion
pg=await fresh({reducedMotion:'reduce'});await SEL(pg,'C');await wait(pg,400);await pg.click('[data-action=make]');await wait(pg,500);
const rs=await pg.evaluate(()=>{const c=getComputedStyle(document.querySelector('.sheet'));return {tp:c.transitionProperty,tf:c.transform}});
await pg.click('[data-action=generate]');const t2=Date.now();let l2=false,partial=0;while(Date.now()-t2<12500){const x=await pg.evaluate(()=>{const d=document.querySelector('canvas.dither[data-kind=dev]');return {l:!document.querySelector('.mkcard')&&document.querySelectorAll('.step').length===4,p:d?+d.dataset.p:null}});if(x.p!==null&&x.p>0&&x.p<1)partial++;if(x.l){l2=true;break}await wait(pg,40)}
ok('9 reduced motion: F2 completes; u_edge jumps to 1 (no intermediate edge); sheets opacity-only',l2&&partial===0&&/^opacity/.test(rs.tp)&&rs.tf==='none',`${JSON.stringify(rs)} landed=${l2} partialEdge=${partial}`);
console.log('\nSUMMARY',res.filter(r=>r[1]).length+'/'+res.length);await b.close();
