function holdDone(el){const key=el.dataset.hold;
 if(key==='delete'){menu='';recordings.splice(selected,1);selected=0;if(!recordings.length){empty=true;state='D'}else{const r=sel();state=r.guide<0?'F4':r.brief?'B':'A';output=r.brief?'brief':'guide'}render();toast('Moved to Trash')}
 else if(key.startsWith('step:')){const i=+key.slice(5),r=sel(),st=[...stepsFor(r)];st.splice(i,1);r.steps=st;r.guide=st.length;render();toast('Step deleted')}}
/* ---------- generation: "develop the guide" ---------- */
function stopGen(){if(run){run.timers.forEach(clearTimeout);run=null}}
function at(ms,fn){const rid=run.id;run.timers.push(setTimeout(()=>{if(run&&run.id===rid)fn()},ms*T))}
function taskState(k,s){const li=$(`.tk[data-k="${k}"]`);if(!li)return;li.classList.toggle('pend2',s==='pend');$('.tki',li).innerHTML=s==='active'?'<i class="spin" style="width:12px;height:12px;color:var(--ink)"></i>':s==='done'?ic('check','ok sm'):'<i class="pend"></i>'}
function setDetail(k,html){const d=$(`.tk[data-k="${k}"] .d`);if(!d)return;d.classList.add('sw2','out');setTimeout(()=>{if(!d.isConnected)return;d.innerHTML=html;d.classList.remove('out')},100*T)}
function setStage(n){const nm=$('#mkstep .nm');if(nm)setNum(nm,String(n))}
function setProg(p){const b=$('.mkbar canvas');if(b&&b._st)b._st.set('progress',p*1.08);const s=$('.rstrip canvas');if(s&&s._st)s._st.set('edge',emap(p))}
function refreshRows(){const rows=$('#rows');if(rows&&!loading)rows.innerHTML=recordings.map(rowHTML).join('')+'';mountCanvases(rows||document)}
function startGen(opts={}){stopGen();const r=sel(),id=++runId,total=genKind==='guide'?9000:6000;run={id,timers:[],remake:!!opts.remake,fail:!!opts.fail,steps:genKind==='guide'?pickSteps(r):[],prevGuide:r.guide,t0:performance.now(),total};
 r.processing=true;state='F2';render();scrollToOutput(true);
 const kind=genKind;
 taskState(0,'active');$('.tk[data-k="0"] .d').innerHTML='Whisper · <span class="nm">0</span> words';
 [100,200,300,400,500,612].forEach((n,i)=>at((i+1)*250,()=>setNum($('.tk[data-k="0"] .nm'),String(n))));
 for(let s=1;s<=Math.floor(total/1000);s++)at(s*1000,()=>setNum($('#mkleft'),String(Math.max(1,Math.ceil(total/1000-s)))));
 at(1800,()=>{taskState(0,'done');taskState(1,'active');setStage(2);setDetail(1,'Sorting <span class="nm">0</span> clicks against your narration')});
 [3,6,9,12,14].forEach((n,i)=>at(2300+i*200,()=>setNum($('.tk[data-k="1"] .nm'),String(n))));
 at(3200,()=>{taskState(1,'done');taskState(2,'active');setStage(3);if(kind==='guide')setDetail(2,'<span class="nm">0</span> of 4 steps written')});
 const loop=()=>{if(!run||run.id!==id)return;const p=Math.min(1,(performance.now()-run.t0)/(total*T));run.p=p;setProg(p);requestAnimationFrame(loop)};requestAnimationFrame(loop);
 if(kind==='guide'){run.steps.forEach((s,k)=>at(3200+k*1300,()=>addCard(k)));if(run.fail)at(5500,failRun);else at(9000,doneRun)}
 else{if(run.fail)at(5500,failRun);else at(6000,doneRun)}}
function addCard(k){const r=sel(),s=run.steps[k],g=$('#gnew');if(!g)return;g.insertAdjacentHTML('beforeend',stepHTML(r,s,k,{dev:true,words:true,cls:'card-in prestream'}));const el=g.lastElementChild;paintShots(el);mountCanvases(el);
 setNum($('.tk[data-k="2"] .nm'),String(k+1));
 const rid=run.id;run.timers.push(setTimeout(()=>{if(!run||run.id!==rid)return;el.classList.remove('prestream');el.classList.add('streaming');develop(el);dropTick(s,k)},300*T))}
function dropTick(s,k){const sc=$('#scrub');if(!sc)return;sc.insertAdjacentHTML('beforeend',`<button class="tick dropin flash ${s.flag?'flag':''}" style="left:${s.s/sel().sec*100}%" data-seek="${s.s}" data-tip="${esc(s.t)}" aria-label="Step ${k+1}: ${esc(s.t)}"></button>`)}
function doneRun(){const r=sel(),kind=genKind,tm=kind==='guide'?'0:09':'0:06';
 setProg(1);[0,1,2].forEach(i=>taskState(i,'done'));
 $('#mkt').textContent=kind==='guide'?'Guide ready':'Brief ready';
 const ms=$('#mkstep');ms.innerHTML=`${ic('check','ok sm')} <span class="nm"></span>${kind==='guide'?' STEPS':' BRIEF'} · MADE IN ${tm}`;setNum($('.nm',ms),kind==='guide'?'4':'1');
 $('#genbtns').innerHTML='';$('#mkfoot .mono').textContent='Done';
 if(kind==='guide'){r.steps=run.steps;$('#gold')?.classList.add('gone');$$('.tick.old').forEach(t=>t.classList.add('gone'))}
 const strip=$('.rstrip');if(strip)setTimeout(()=>strip.classList.add('gone'),300*T);
 at(600,()=>{if(kind==='guide'){r.guide=4}else{r.brief=true}r.processing=false;stopGen();state='F3';render();scrollToOutput(false)})}
function failRun(){const r=sel();r.guide=-1;r.processing=false;const n=$$('.step',$('#gnew')||document).length||2;
 const card=$('#mkcard');card.classList.add('failed');$('#mkt').textContent="Couldn't make the guide";$('#mkstep').textContent='STOPPED';$('#mkhead').classList.add('shake');
 const p=run.p||0.6;$('.mkbar').innerHTML=tile('progfail');mountCanvases($('.mkbar'));const c=$('.mkbar canvas');c._st.set('progress',p*1.08);
 $$('.tk').forEach(li=>{if($('.spin',li)){$('.tki',li).innerHTML='<i class="pend"></i>'}});
 $('#mkfoot').innerHTML=`<span class="mono">ChatGPT stopped responding. Your recording and the ${n} developed steps are safe.</span><span style="display:flex;gap:8px">${B('Try again','retry','dark','refresh')}${B('Change provider','provider','secondary')}</span>`;
 $('.rstrip')?.remove();refreshRows();
 run.timers.forEach(clearTimeout);state='F4';run=null;$$('.card-in canvas.dither').forEach(d=>d.remove())}

/* ---------- navigation ---------- */
function clear(){clearTimeout(timer);clearInterval(interval);const r=sel();if(r)r.processing=false;stopGen();holdCancel();modal='';menu='';empty=false;loading=false;loadFail=false;launch=false}
function resetState(){clear();recordings=base.map(r=>({...r}));selected=0;output='guide';applied=false;paused=false;seconds=0;setting='AI connections';keyInput=false;keyDone=false;connected=false;signedOut=false;importNotice=true;genKind='guide';playing=false;posSec=0;trigger=null;viewed.clear();edPanel='zoom';srcTab='screens';pickedDisp=0;cd=3}
function addRecording(imported=false){recordings.unshift({title:imported?'client-setup':'Untitled recording',kind:'DESKTOP',duration:imported?'4:31':`0:${pad2(Math.max(seconds,4))}`,sec:imported?271:Math.max(seconds,4),date:'TODAY',time:'NOW',clicks:3,guide:0,brief:false,edit:!imported,justSaved:!imported,imported,fresh:true,salt:6,narr:'Recorded just now.'});selected=0;output='guide';importNotice=true}
function go(s){resetState();state=s;pin=['pdf','R','R2'].includes(s)?s:null;selected=0;
 if(s==='B'){selected=1;output='brief'}
 if(['C','F1','F2','F3'].includes(s))selected=4;
 if(s==='C')recordings[4].guide=0;if(s==='F3')recordings[4].guide=4;if(s==='F4')selected=3;
 empty=s==='D';loading=s==='E';loadFail=s==='E2';launch=s==='L';
 if(s==='F1'){modal='review';prevState='C'}
 if(s==='G1'){modal='setup';prevState='A'}if(s==='G-countdown'){state='G-count';selected=0;startCountdown();selector.value=s;return}if(s==='G2'){startRecording();render();selector.value=s;return}if(s==='G3'){state='G3';addRecording()}
 if(s==='H1'){modal='import';prevState='A'}if(s==='H2'){modal='import-progress';prevState='A';timer=setTimeout(finishImport,2000*T)}if(s==='H3')addRecording(true);
 if(s==='I-noclicks')selected=2;
 if(s.startsWith('I-export')){prevState='I';edPanel='export';if(s!=='I-export'){modal=s.replace('I-','');if(s==='I-export-progress')timer=setTimeout(finishExport,2500*T)}}
 if(s.startsWith('J'))setting=({'J-recording':'Recording','J-transcription':'Transcription','J-agents':'Agents','J-appearance':'Appearance'})[s]||'AI connections';
 if(s==='pdf'){modal='pdf';prevState='A';state='A'}if(s==='R'){modal='remake-confirm';prevState='A';state='A'}
 if(s==='F2'){genKind='guide';startGen();selector.value=s;return}
 if(s==='F4'){genKind='guide';startGen({fail:true});selector.value=s;return}
 if(s==='R2'){state='A';genKind='guide';startGen({remake:true});selector.value=s;return}
 render();selector.value=s}
function startCountdown(){clearTimeout(timer);cd=3;state='G-count';modal='';render();const tick=()=>{timer=setTimeout(()=>{cd--;if(cd<=0){startRecording();render();return}setNum($('#cdn'),String(cd));tick()},1000*T)};tick()}
function startRecording(){clearInterval(interval);seconds=0;paused=false;state='G2';modal='';interval=setInterval(()=>{if(!paused){seconds++;const t=$('#timer');if(t)t.textContent=clock()}},1000)}
function finishImport(){modal='';addRecording(true);state='H3';render()}
function finishExport(){modal='export-done';state='I-export-done';render()}
function close(){clearTimeout(timer);modal='';menu='';if(state.startsWith('I-export'))state='I';else if(['F1','G1','H1','H2','G-count'].includes(state))state=prevState||'A';render();if(trigger){const b=$$('button').find(b=>b.dataset.action===trigger);b?.focus()}}
selector.onchange=()=>go(selector.value);
$('#sample').onclick=()=>go('A');
$('#theme').onclick=()=>{document.body.classList.toggle('dark');$('#theme').textContent=document.body.classList.contains('dark')?'Light':'Dark';if(state==='J-appearance')render()};
$('#m-1').onclick=()=>setMotion(1);$('#m-10').onclick=()=>setMotion(10);
function setMotion(n){T=n;document.documentElement.style.setProperty('--t',n);$('#m-1').classList.toggle('on',n===1);$('#m-10').classList.toggle('on',n===10)}
const guideMd=()=>{const r=sel();return `# ${r.title}\n`+stepsFor(r).map((s,i)=>`${i+1}. ${s.t} (${fmt(s.s)})`).join('\n')};
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');
 if(menu&&!e.target.closest('#menu')&&!(b&&b.dataset.action==='menu')){menu='';$('#menuHost').innerHTML=''}
 if(b&&!b.closest('.toolbar'))pin=null;
 if(!b)return;
 if(b.matches('[data-hold]')||b.closest('.toolbar'))return;
 if(b.dataset.row!==undefined){clear();selected=+b.dataset.row;const r=sel();state=r.guide<0?'F4':r.brief?'B':'A';output=r.brief?'brief':'guide';posSec=0;render();return}
 if(b.dataset.output){setOutput(b.dataset.output);return}
 if(b.dataset.seek!==undefined){setPos(+b.dataset.seek);return}
 const a=b.dataset.action;if(!a)return;
 if(['record','import','make','pdf','remake','export','menu','hud-menu'].includes(a))trigger=a;
 if(a.startsWith('setting:')){setting=a.slice(8);state={'AI connections':'J-ai',Recording:'J-recording',Transcription:'J-transcription',Agents:'J-agents',Appearance:'J-appearance'}[setting]}
 else if(a.startsWith('appearance:')){document.body.classList.toggle('dark',a==='appearance:Dark'||a==='appearance:System'&&matchMedia('(prefers-color-scheme:dark)').matches);$('#theme').textContent=document.body.classList.contains('dark')?'Light':'Dark'}
 else if(a.startsWith('disp:')){pickedDisp=+a.slice(5);sheetKey='';render();return}
 else if(a.startsWith('srctab:')){srcTab=a.slice(7);sheetKey='';render();return}
 else if(a==='record'){prevState=state;modal='setup';state='G1'}
 else if(a==='import'){prevState=state;modal='import';state='H1'}
 else if(a==='make'){prevState=state;genKind=output;modal='review';state='F1'}
 else if(a==='generate'){modal='';startGen();return}
 else if(a==='retry'){genKind='guide';startGen();return}
 else if(a==='pdf'){prevState=state;modal='pdf'}
 else if(a==='remake'){prevState=state;modal='remake-confirm'}
 else if(a==='do-remake'){modal='';genKind='guide';startGen({remake:true});return}
 else if(a==='cancel-generation'){const r=sel(),rm=run&&run.remake;stopGen();r.processing=false;if(rm){state='A'}else{r.guide=0;state='C'}toast('Stopped. Nothing was changed.')}
 else if(a==='provider'){stopGen();sel().processing=false;modal='';state='J-ai';setting='AI connections'}
 else if(a==='start'){startCountdown();return}
 else if(a==='pause'){paused=!paused;b.querySelector('.slot').classList.toggle('on',paused);b.setAttribute('aria-label',paused?'Resume':'Pause');b.dataset.tip=paused?'Resume':'Pause';return}
 else if(a==='stop'){clearInterval(interval);state='G-saving';loadBtn(b,'Saving…',1200,()=>{addRecording();state='G3';render()});return}
 else if(a==='restart'){startRecording()}
 else if(a==='cancel-recording'){clearInterval(interval);state='A';menu=''}
 else if(a==='choose'){modal='import-progress';state='H2';timer=setTimeout(finishImport,2000*T)}
 else if(a==='editor'){prevState=state;state=sel().imported?'I-noclicks':'I';applied=false;edPanel='zoom'}
 else if(a==='zoom'){edPanel='zoom';state=state==='I-export'?'I':state}
 else if(a==='apply'){loadBtn(b,'Applying…',600,()=>{applied=true;render()});return}
 else if(a==='undo'){applied=false}else if(a==='redo'){applied=true}
 else if(a==='discard'){b.closest('.proposal').innerHTML='<span class="mono">Proposal discarded</span>';return}
 else if(a==='export'){edPanel='export';state='I-export'}
 else if(a==='run-export'){modal='export-progress';state='I-export-progress';timer=setTimeout(finishExport,2500*T)}
 else if(a==='cancel-export'){clearTimeout(timer);modal='export-cancelled';state='I-export-cancelled'}
 else if(a==='run-pdf'){modal='pdf-progress';render();pdfRun();return}
 else if(a==='cancel-pdf'){clearTimeout(timer);clearTimeout(run2);close();return}
 else if(a==='settings'){state='J-ai';setting='AI connections'}
 else if(a==='library'){modal='';state='A'}
 else if(a==='menu'){menu=menu?'':'recording'}
 else if(a==='empty'){empty=true;menu='';state='D'}
 else if(a==='loading'){loading=true;menu='';state='E'}
 else if(a==='loadfail'){loadFail=true;menu='';state='E2'}
 else if(a==='launch'){launch=true;menu='';state='L'}
 else if(a==='restore'){empty=loading=loadFail=launch=false;state='A'}
 else if(a==='rename'){sel().edit=true;menu=''}
 else if(a==='dismiss-notice'){importNotice=false}
 else if(a==='key'){keyInput=true}
 else if(a==='save-key'){loadBtn(b,'Saving…',900,()=>{keyInput=false;keyDone=true;if(state==='J-rejected')state='J-ai';render()});return}
 else if(a==='sign'){if(state==='J-expired'||signedOut){loadBtn(b,'Connecting…',900,()=>{signedOut=false;connected=true;if(state==='J-expired')state='J-ai';render()})}else{signedOut=true;connected=false;render()}return}
 else if(a==='close'){close();return}
 else if(a==='copy'||a==='copy-path'||a==='copy-g'||a==='copy-path-g'){doCopy(b,a==='copy'?briefText+'\n'+bundle:a==='copy-g'?guideMd():bundle);return}
 else if(a==='play'||a==='preview'){playing=!playing;$$('[data-action=play] .slot').forEach(s=>s.classList.toggle('on',playing));$$('[data-action=play]').forEach(x=>{x.setAttribute('aria-label',playing?'Pause':'Play');x.dataset.tip=playing?'Pause':'Play'});return}
 else if(a==='edit-step'){const title=b.closest('.step').querySelector('.stitle');if(title.querySelector('input'))return;const v=title.textContent;title.innerHTML=`<input class="in" style="width:100%;text-transform:none;font:500 15px Inter;letter-spacing:0" aria-label="Step title" value="${esc(v)}">`;title.querySelector('input').focus();return}
 else if(a==='depth'||a==='format'){b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');return}
 else if(a==='noop'){return}
 else{toast(a==='finder'?'Opened in Finder (mock)':'Updated (mock)');return}
 render()});
let run2;
function pdfRun(){const t0=performance.now();run2=setTimeout(()=>{if(!$('#pbar'))return;$('#pbar').innerHTML=progressBar();mountCanvases($('#pbar'));const c=$('#pbar canvas'),stt=c._st,d=1500*T;const t1=performance.now();const step=n=>{const p=Math.min(1,(n-t1)/d);if(stt&&c.isConnected)stt.set('progress',p*1.08);if(p<1&&c.isConnected)requestAnimationFrame(step)};requestAnimationFrame(step);
  run2=setTimeout(()=>{modal='pdf-done';render()},d+150)},1000*T)}
document.addEventListener('pointerdown',e=>{const sc=e.target.closest?.('#scrub');if(!sc||e.target.closest('.tick'))return;const mv=ev=>{const r=sc.getBoundingClientRect();setPos((ev.clientX-r.left)/r.width*(sel()?.sec||134))};mv(e);const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up)};addEventListener('pointermove',mv);addEventListener('pointerup',up)});
document.addEventListener('keydown',e=>{
 if(e.target.id==='scrub'&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){setPos(posSec+(e.key==='ArrowRight'?5:-5));e.preventDefault()}
 if(e.key==='Escape'&&(modal||menu||state==='G-count')){close()}
 if(e.key==='Tab'&&modal){const list=$$('.sheet button,.sheet input,.sheet select,.sheet textarea').filter(x=>!x.disabled);const first=list[0],last=list.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement.classList.contains('sheet'))){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});
document.addEventListener('input',e=>{if(e.target.id==='search'){const q=e.target.value.toLowerCase();$$('.rw').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(q))}if(e.target.id==='rename')sel().title=e.target.value});
document.fonts?.ready.then(()=>placeUl(false));
render();
