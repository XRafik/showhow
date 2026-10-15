/* ---------- toast, tooltip ---------- */
function toast(t){$$('.toast').forEach(e=>e.remove());const el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.textContent=t;$('#toastHost').append(el);requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('in')));setTimeout(()=>{el.classList.remove('in');setTimeout(()=>el.remove(),200*T+40)},2400*T)}
const tip={timer:0,close:0,open:false,cur:null},tipEl=$('#tip');
function showTip(t,instant){if(!t.isConnected)return;const w=win.getBoundingClientRect(),r=t.getBoundingClientRect();tipEl.textContent=t.dataset.tip;tipEl.classList.toggle('instant',instant);
 const tw=tipEl.offsetWidth,th=tipEl.offsetHeight;let top=r.top-w.top-th-8,orig='bottom center';if(top<34){top=r.bottom-w.top+8;orig='top center'}let left=r.left-w.left+r.width/2-tw/2;left=Math.max(8,Math.min(w.width-tw-8,left));tipEl.style.cssText=`left:${left}px;top:${top}px;transform-origin:${orig}`;tipEl.classList.add('show');tip.open=true;tip.cur=t}
function hideTip(){clearTimeout(tip.timer);clearTimeout(tip.close);tipEl.classList.remove('show');tip.open=false;tip.cur=null}
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const t=e.target.closest?.('[data-tip]');if(!t||t===tip.cur&&tip.open)return;clearTimeout(tip.close);clearTimeout(tip.timer);if(tip.open)showTip(t,true);else tip.timer=setTimeout(()=>showTip(t,false),400*T)});
document.addEventListener('pointerout',e=>{const t=e.target.closest?.('[data-tip]');if(!t||t.contains(e.relatedTarget))return;clearTimeout(tip.timer);tip.close=setTimeout(hideTip,150*T)});
document.addEventListener('focusin',e=>{const t=e.target.closest?.('[data-tip]');if(t&&e.target.matches(':focus-visible'))showTip(t,tip.open)});
document.addEventListener('focusout',e=>{if(e.target.closest?.('[data-tip]'))hideTip()});

/* ---------- micro-interaction helpers ---------- */
function swapLabel(lbl,text){if(!lbl)return;lbl.classList.add('blur');setTimeout(()=>{lbl.textContent=text;lbl.classList.remove('blur')},100*T)}
function loadBtn(b,text,ms,cb){if(b.dataset.busy)return;b.dataset.busy=1;b.style.width=b.offsetWidth+'px';b.setAttribute('aria-busy','true');const ico=b.querySelector('.ic');if(ico)ico.outerHTML='<i class="spin"></i>';else b.insertAdjacentHTML('afterbegin','<i class="spin"></i>');swapLabel(b.querySelector('.lbl'),text);setTimeout(cb,ms*T)}
function setNum(el,str){if(!el)return;const old=el.textContent||'';let k=0;el.innerHTML=[...str].map((ch,i)=>{const oc=old[old.length-(str.length-i)];const ch2=oc!==ch;return `<span class="dg${ch2?' pop':''}" style="${ch2?`animation-delay:${k++*30*T}ms`:''}">${ch}</span>`}).join('')}
async function doCopy(b,text){try{await navigator.clipboard.writeText(text)}catch{const i=document.createElement('textarea');i.value=text;document.body.append(i);i.select();document.execCommand('copy');i.remove()}
 b.classList.add('done');b.querySelector('.lab .a').setAttribute('aria-hidden','true');b.querySelector('.lab .b').removeAttribute('aria-hidden');setTimeout(()=>{b.classList.remove('done');b.querySelector('.lab .b')?.setAttribute('aria-hidden','true');b.querySelector('.lab .a')?.removeAttribute('aria-hidden')},2000*T)}
/* hold to confirm */
let hold=null;
function holdStart(el){if(hold)return;hold={el,t:performance.now()};el.classList.add('holding');const hint=$('#hint');
 hold.int=setInterval(()=>{if(hint&&RM())hint.textContent=Math.min(99,Math.round((performance.now()-hold.t)/(20*T)))+'%'},100);
 hold.timer=setTimeout(()=>{const h=hold;clearInterval(h.int);hold=null;holdDone()},2000*T)}
function holdCancel(){if(!hold)return;clearTimeout(hold.timer);clearInterval(hold.int);hold.el.classList.remove('holding');const h=$('#hint');if(h)h.textContent='HOLD 2S';hold=null}
function holdDone(){menu='';recordings.splice(selected,1);selected=0;if(!recordings.length){empty=true;state='D'}else{const r=sel();state=r.guide<0?'F4':r.brief?'B':'A';output=r.brief?'brief':'guide'}render();toast('Moved to Trash')}
document.addEventListener('pointerdown',e=>{const h=e.target.closest?.('[data-hold]');if(h&&e.button===0)holdStart(h)});
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,holdCancel));
document.addEventListener('pointerout',e=>{if(hold&&e.target.closest?.('[data-hold]')&&!hold.el.contains(e.relatedTarget))holdCancel()});
document.addEventListener('keydown',e=>{const h=e.target.closest?.('[data-hold]');if(h&&(e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();holdStart(h)}});
document.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')holdCancel()});

