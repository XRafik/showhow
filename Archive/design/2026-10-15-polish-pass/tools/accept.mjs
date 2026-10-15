import {chromium} from '/Users/mohamedb/dev/projects/showhow/node_modules/playwright/index.mjs';
const url='file:///Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-polish-pass/index.html';
const res=[];const ok=(n,pass,info='')=>{res.push([n,pass]);console.log(pass?'PASS':'FAIL',n,info)};
const b=await chromium.launch({channel:'chrome'});
async function fresh(opts={}){const ctx=await b.newContext({viewport:{width:1440,height:900},...opts});const pg=await ctx.newPage();const errs=[];pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));await pg.goto(url);await pg.waitForTimeout(700);pg.errs=errs;return pg}
const wait=(pg,ms)=>pg.waitForTimeout(ms);
const SEL=(pg,v)=>pg.selectOption('#screen',v);
let pg=await fresh();
// 1 errors on load + every screen
let all=[...pg.errs];const opts=await pg.$$eval('#screen option',o=>o.map(x=>x.value));
let hs=[];
for(const o of opts){pg.errs.length=0;await SEL(pg,o);await wait(pg,450);all.push(...pg.errs.map(e=>o+': '+e));
  const m=await pg.evaluate(()=>{const mn=document.querySelector('.main'),ap=document.querySelector('#app');return {m:mn?mn.scrollWidth-mn.clientWidth:0,e:document.querySelector('.editor')?document.querySelector('.editor').scrollWidth-document.querySelector('.editor').clientWidth:0,a:ap.scrollWidth-ap.clientWidth,d:document.documentElement.scrollWidth-document.documentElement.clientWidth}});
  if(m.m>0||m.e>0||m.a>0||m.d>0)hs.push(o+JSON.stringify(m))}
ok('1 no console errors (load + all '+opts.length+' screens)',all.length===0,JSON.stringify(all));
ok('10 no horizontal scroll on any screen',hs.length===0,JSON.stringify(hs));
// 3 C -> make guide -> F1 -> make guide -> F2 -> F3
pg=await fresh();await SEL(pg,'C');await wait(pg,400);await pg.click('[data-action=make]');await wait(pg,400);
const f1=await pg.locator('.sheet').count();await pg.click('[data-action=generate]');const t0=Date.now();
let steps=0,dev=0;let landed=false;
while(Date.now()-t0<12000){const st=await pg.evaluate(()=>({s:document.querySelectorAll('#gnew .step').length,d:!!document.querySelector('canvas.dev'),f3:document.querySelector('#st-guide')?.textContent,state:document.querySelector('#screen').value}));steps=Math.max(steps,st.s);if(st.d)dev++;
 const landedNow=await pg.evaluate(()=>!document.querySelector('#gnew')&&document.querySelectorAll('.step').length===4&&!document.querySelector('.gen'));if(landedNow){landed=true;break}await wait(pg,100)}
const dt=Date.now()-t0;
ok('3 C->F1->F2 runs, 4 steps develop, lands on F3 in <=11s',f1===1&&steps===4&&dev>0&&landed&&dt<=11000,`sheet=${f1} steps=${steps} devSeen=${dev} landed=${landed} t=${dt}ms`);
// 4 mid-develop ~4s
pg=await fresh();await SEL(pg,'C');await wait(pg,400);await pg.click('[data-action=make]');await wait(pg,400);await pg.click('[data-action=generate]');const t1=Date.now();
let mid=null;while(Date.now()-t1<6000){const p=await pg.evaluate(()=>{const d=document.querySelector('canvas.dev');return d?+d.dataset.p:null});if(p!==null&&p>0&&p<1){mid={p,t:Date.now()-t1};break}await wait(pg,20)}
ok('4 a screenshot canvas is mid-develop around 4s',mid&&mid.t>3000&&mid.t<4800,JSON.stringify(mid));
// 5 copy
pg=await fresh();await SEL(pg,'B');await wait(pg,400);await pg.evaluate(()=>document.querySelector('#main').scrollTo(0,800));
const btn=pg.locator('[data-action=copy]');const w0=(await btn.boundingBox()).width;await btn.click();await wait(pg,500);
const w1=(await btn.boundingBox()).width;const lab1=await pg.evaluate(()=>({done:document.querySelector('[data-action=copy]').classList.contains('done'),b:getComputedStyle(document.querySelector('[data-action=copy] .lab .b')).opacity,a:getComputedStyle(document.querySelector('[data-action=copy] .lab .a')).opacity,txt:document.querySelector('[data-action=copy] .lab .b').textContent}));
await wait(pg,1800);const lab2=await pg.evaluate(()=>document.querySelector('[data-action=copy]').classList.contains('done'));const w2=(await btn.boundingBox()).width;
ok('5 copy: label becomes Copied, reverts ~2s, width unchanged',lab1.done&&lab1.txt==='Copied'&&+lab1.b===1&&+lab1.a===0&&!lab2&&Math.abs(w0-w1)<0.5&&Math.abs(w0-w2)<0.5,`w ${w0}/${w1}/${w2} ${JSON.stringify(lab1)} reverted=${!lab2}`);
// 6 hold
pg=await fresh();await SEL(pg,'A');await wait(pg,400);
const rows=()=>pg.locator('.row').count();const n0=await rows();
await pg.click('[data-action=menu]');await wait(pg,200);let hb=await pg.locator('[data-hold]').boundingBox();await pg.mouse.move(hb.x+40,hb.y+10);await pg.mouse.down();await wait(pg,600);const midw=await pg.evaluate(()=>getComputedStyle(document.querySelector('.hold .wash')).clipPath);await pg.mouse.up();await wait(pg,500);const n1=await rows();
if(!(await pg.locator('#menu').count()))await pg.click('[data-action=menu]');await wait(pg,200);hb=await pg.locator('[data-hold]').boundingBox();await pg.mouse.move(hb.x+40,hb.y+10);await pg.mouse.down();await wait(pg,2100);await pg.mouse.up();await wait(pg,500);const n2=await rows();const toast=await pg.locator('.toast').textContent().catch(()=>'');
ok('6 hold: 600ms does not delete, 2.1s deletes',n1===n0&&n2===n0-1,`rows ${n0}/${n1}/${n2} wash@600=${midw} toast=${toast}`);
// 7 display toggle
pg=await fresh();await SEL(pg,'A');await wait(pg,300);const f_a=await pg.evaluate(()=>getComputedStyle(document.querySelector('h1.title')).fontFamily);await pg.click('#d-sans');await wait(pg,100);const f_b=await pg.evaluate(()=>getComputedStyle(document.querySelector('h1.title')).fontFamily);
ok('7 display toggle swaps title font',/Instrument Serif/.test(f_a)&&/Inter Tight/.test(f_b),`${f_a} -> ${f_b}`);
// 8 motion 0.1x
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('#m-10');await pg.click('[data-action=record]');
const tt0=Date.now();let tEnd=null;let dur=null;
for(let i=0;i<400;i++){const r=await pg.evaluate(()=>{const s=document.querySelector('.sheet');return s?{o:s.getAnimations().length,d:getComputedStyle(s).transitionDuration}:null});if(r){dur=r.d;if(r.o===0&&Date.now()-tt0>300){tEnd=Date.now()-tt0;break}}await wait(pg,20)}
ok('8 motion 0.1x: sheet transition >= 2s',tEnd!==null&&tEnd>=2000,`transition finished after ${tEnd}ms, transition-duration=${dur}`);
// 9 reduced motion
pg=await fresh({reducedMotion:'reduce'});await SEL(pg,'C');await wait(pg,400);await pg.click('[data-action=make]');await wait(pg,500);
const rs=await pg.evaluate(()=>{const s=document.querySelector('.sheet');const c=getComputedStyle(s);return {tp:c.transitionProperty,tf:c.transform}});
await pg.click('[data-action=generate]');const t2=Date.now();let l2=false;while(Date.now()-t2<12500){const x=await pg.evaluate(()=>!document.querySelector('.gen')&&document.querySelectorAll('.step').length===4);if(x){l2=true;break}await wait(pg,150)}
ok('9 reduced motion: F2 completes; sheets have no transform animation',l2&&/^opacity/.test(rs.tp)&&!/transform/.test(rs.tp)&&(rs.tf==='none'),`${JSON.stringify(rs)} landed=${l2} in ${Date.now()-t2}ms`);
// 2 click paths
pg=await fresh();await SEL(pg,'A');await wait(pg,300);
await pg.click('[data-action=record]');await wait(pg,400);await pg.click('[data-action=start]');await wait(pg,3300);const tm=await pg.locator('#timer').textContent();await pg.click('[data-action=stop]');await wait(pg,2200);
const sr=await pg.locator('.row.selected').textContent();ok('2a record path: timer 00:03, Stop -> Untitled recording selected',tm==='00:03'&&/Untitled recording/.test(sr),`${tm} / ${sr}`);
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('[data-action=import]');await wait(pg,400);await pg.click('[data-action=choose]');await wait(pg,2800);
const ir=await pg.locator('.row.selected').textContent();const dk=await pg.locator('.deck').textContent();ok('2b import path: row IMPORTED + NO CLICKS',/IMPORTED/.test(ir)&&/NO CLICKS/.test(dk),`${ir} / ${dk}`);
pg=await fresh();await SEL(pg,'A');await wait(pg,300);await pg.click('[data-action=editor]');await wait(pg,400);await pg.click('[data-action=apply]');await wait(pg,1000);const zp=await pg.locator('.zoom-pill').count();const ap=await pg.locator('.proposal').textContent();
await pg.click('[data-action=export]');await wait(pg,400);await pg.click('[data-action=run-export]');await wait(pg,3200);const ex=await pg.locator('.sheet').textContent();
ok('2c editor path: Apply -> zoom pill, Export completes',zp===1&&/Applied/.test(ap)&&/Exported/.test(ex)&&/Show in Finder/.test(ex),`pill=${zp} ${ap.trim()} | ${ex.slice(0,60)}`);
pg=await fresh();await SEL(pg,'A');await wait(pg,300);const c0=await pg.evaluate(()=>getComputedStyle(document.querySelector('.main')).backgroundColor+getComputedStyle(document.querySelector('.title')).color);await pg.click('#theme');await wait(pg,200);const c1=await pg.evaluate(()=>getComputedStyle(document.querySelector('.main')).backgroundColor+getComputedStyle(document.querySelector('.title')).color);
await SEL(pg,'J-ai');await wait(pg,300);const s1=await pg.evaluate(()=>getComputedStyle(document.querySelector('#app')).backgroundColor);
ok('2d dark toggle changes library + settings colours',c0!==c1&&s1!=='rgb(255, 252, 247)'&&s1!=='',`${c0} -> ${c1}; settings bg ${s1}`);
// 2e other: tabs underline moves, tooltip
pg=await fresh();await SEL(pg,'A');await wait(pg,300);const u0=await pg.evaluate(()=>document.querySelector('#ul').style.transform);await pg.click('[data-output=brief]');await wait(pg,400);const u1=await pg.evaluate(()=>document.querySelector('#ul').style.transform);
ok('2e tabs: shared underline slides between tabs',u0!==u1,`${u0} -> ${u1}`);
console.log('\nSUMMARY',res.filter(r=>r[1]).length+'/'+res.length);
await b.close();
