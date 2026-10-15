/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
let T=1;const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad2=n=>String(n).padStart(2,'0'),fmt=s=>`${Math.floor(s/60)}:${pad2(Math.round(s)%60)}`;
const wait=(fn,ms)=>setTimeout(fn,ms*T);

/* ---------- icons: Its Hover (inlined from itshover.com/r/*.json) + Tabler outline 3.24.0 ---------- */
const ICONS={
copy:[24,'<path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"/><path class="front-copy" d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"/>'],
download:[24,'<path class="tray" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path class="arrow-stem" d="M12 15V3"/><path class="arrow-head" d="m7 10 5 5 5-5"/>'],
upload:[24,'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><g class="arrow-group"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/></g>'],
trash:[24,'<path class="trash-lid-lower" d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path class="trash-lid-upper" d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/>'],
refresh:[24,'<path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>'],
gear:[32,'<g class="gear-rotator"><circle class="gear-center" cx="16" cy="16" r="5"/><path class="gear-body" d="m30,17.5v-3l-3.388-1.355c-.25-.933-.617-1.815-1.089-2.633l1.436-3.351-2.121-2.121-3.351,1.436c-.817-.472-1.7-.838-2.633-1.089l-1.355-3.388h-3l-1.355,3.388c-.933.25-1.815.617-2.633,1.089l-3.351-1.436-2.121,2.121 1.436,3.351c-.472.817-.838,1.7-1.089,2.633l-3.388,1.355v3l3.388,1.355c.25.933.617,1.815,1.089,2.633l-1.436,3.351 2.121,2.121 3.351-1.436c.817.472 1.7.838 2.633,1.089l1.355,3.388h3l1.355-3.388c.933-.25 1.815-.617 2.633-1.089l3.351,1.436 2.121-2.121-1.436-3.351c.472-.817.838-1.7 1.089-2.633l3.388-1.355Z"/></g>'],
magnifier:[32,'<g class="mag"><path d="m21.393,18.565l7.021,7.021c.781.781.781,2.047,0,2.828h0c-.781.781-2.047.781-2.828,0l-7.021-7.021"/><circle cx="13" cy="13" r="10"/></g>'],
sparkles:[24,'<path class="sp-bot" d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z"/><path class="sp-top" d="M16 6a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2z"/><path class="sp-main" d="M9 18a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z"/>'],
dots:[24,'<path class="dl" d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path class="dc" d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path class="dr" d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/>'],
'chevron-right':[24,'<path d="M9 6l6 6l-6 6"/>'],
'chevron-down':[24,'<path d="M6 9l6 6l6 -6"/>'],
check:[24,'<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path class="tickp" pathLength="1" d="M9 12l2 2l4 -4"/>'],
external:[24,'<path class="ext-box" d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"/><g class="ext-arrow"><path d="M11 13l9 -9"/><path d="M15 4h5v5"/></g>'],
terminal:[24,'<path class="term-chev" d="M5 7l5 5l-5 5"/><path class="cursor-line" d="M12 19l7 0"/>'],
eye:[24,'<path class="eye-pupil" d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"/><path class="eye-shape" d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"/>'],
file:[24,'<path class="file-fold fd" pathLength="1" d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/><path class="file-lines fd" pathLength="1" d="M9 17h6"/><path class="file-lines fd" pathLength="1" d="M9 13h6"/>'],
play:[24,'<path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z"/>','currentColor'],
mic:[24,'<path d="M9 2m0 3a3 3 0 0 1 3 -3h0a3 3 0 0 1 3 3v5a3 3 0 0 1 -3 3h0a3 3 0 0 1 -3 -3z"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M8 21l8 0"/><path d="M12 17l0 4"/>'],
rec:[24,'<path d="M12 12m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/>'],
stop:[24,'<path d="M5 5m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"/>'],
pause:[24,'<path d="M6 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"/><path d="M14 5m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"/>'],
desktop:[24,'<path d="M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10z"/><path d="M7 20h10"/><path d="M9 16v4"/><path d="M15 16v4"/>'],
folder:[24,'<path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2"/>'],
scissors:[24,'<path d="M6 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M6 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M8.6 8.6l10.4 10.4"/><path d="M8.6 15.4l10.4 -10.4"/>'],
pdf:[24,'<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"/><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6"/><path d="M17 18h2"/><path d="M20 15h-3v6"/><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z"/>'],
undo:[24,'<path d="M9 14l-4 -4l4 -4"/><path d="M5 10h11a4 4 0 1 1 0 8h-1"/>'],
redo:[24,'<path d="M15 14l4 -4l-4 -4"/><path d="M19 10h-11a4 4 0 1 0 0 8h1"/>'],
x:[24,'<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>']
};
function ic(n,cls=''){const [vb,inner,fill]=ICONS[n];return `<span class="ic ic-${n} ${cls}" aria-hidden="true"><svg viewBox="0 0 ${vb} ${vb}" style="--vb:${vb}" fill="${fill||'none'}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${inner}</svg></span>`}
const LOGO='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z"/></svg>';
function B(label,action,cls='secondary',icon='',attrs=''){if(!/primary|secondary|rec|text/.test(cls))cls+=' secondary';return `<button class="btn ${cls}" data-action="${action}" ${attrs}>${icon?ic(icon):''}${label?`<span class="lbl">${label}</span>`:''}</button>`}
function IB(icon,action,aria,attrs=''){return `<button class="ib" data-action="${action}" aria-label="${aria}" data-tip="${aria}" ${attrs}>${ic(icon)}</button>`}
function swapIcons(a,b,on=false){return `<span class="slot ${on?'on':''}"><span class="sx a">${ic(a)}</span><span class="sx b">${ic(b)}</span></span>`}

