import re
P='/Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/'
rd=lambda f:open(P+'tools/parts/'+f).read()
old=open(P+'../2026-10-15-polish-pass/index.html').read()
hi=rd('helpers_icons.js')
# icons extras
extra="""x:[24,'<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>'],
'circle-dot':[24,'<path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/>'],
books:[24,'<path d="M5 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"/><path d="M9 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z"/><path d="M5 8h4"/><path d="M9 16h4"/><path d="M13.803 4.56l2.184 -.53c.562 -.135 1.133 .19 1.282 .732l3.695 13.418a1.02 1.02 0 0 1 -.634 1.219l-.133 .041l-2.184 .53c-.562 .135 -1.133 -.19 -1.282 -.732l-3.695 -13.418a1.02 1.02 0 0 1 .634 -1.219l.133 -.041z"/><path d="M14 9l4 -1"/><path d="M16 16l3.923 -.98"/>'],
'folder-open':[24,'<path d="M5 19l2.757 -7.351a1 1 0 0 1 .936 -.649h12.307a1 1 0 0 1 .986 1.164l-.996 5.211a2 2 0 0 1 -1.964 1.625h-14.026a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v2"/>'],
gauge:[24,'<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M13.41 10.59l2.59 -2.59"/><path d="M7 12a5 5 0 0 1 5 -5"/>'],
typography:[24,'<path d="M4 20l3 0"/><path d="M14 20l7 0"/><path d="M6.9 15l6.9 0"/><path d="M10.2 6.3l5.8 13.7"/><path d="M5 20l6 -16l2 0l7 16"/>'],
'zoom-in':[24,'<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M7 10l6 0"/><path d="M10 7l0 6"/><path d="M21 21l-6 -6"/>'],
photo:[24,'<path d="M15 8h.01"/><path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z"/><path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5"/><path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3"/>'],
click:[24,'<path d="M3 12l3 0"/><path d="M12 3l0 3"/><path d="M7.8 7.8l-2.2 -2.2"/><path d="M16.2 7.8l2.2 -2.2"/><path d="M7.8 16.2l-2.2 2.2"/><path d="M12 12l9 3l-4 2l-2 4l-3 -9"/>'],
share:[24,'<path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M8.7 10.7l6.6 -3.4"/><path d="M8.7 13.3l6.6 3.4"/>'],
wave:[24,'<path d="M21 12h-2c-.894 0 -1.662 -.857 -1.761 -2c-.296 -3.45 -.749 -6 -2.749 -6s-2.5 3.582 -2.5 8s-.5 8 -2.5 8s-2.452 -2.547 -2.749 -6c-.1 -1.147 -.867 -2 -1.763 -2h-2"/>'],
'camera-off':[24,'<path d="M8.297 4.289a.997 .997 0 0 1 .703 -.289h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v8m-1.187 2.828c-.249 .11 -.524 .172 -.813 .172h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2h1c.298 0 .58 -.065 .834 -.181"/><path d="M10.422 10.448a3 3 0 1 0 4.15 4.098"/><path d="M3 3l18 18"/>'],
'eye-off':[24,'<path d="M10.585 10.587a2 2 0 0 0 2.829 2.828"/><path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87"/><path d="M3 3l18 18"/>'],
volume:[24,'<path d="M15 8a5 5 0 0 1 0 8"/><path d="M17.7 5a9 9 0 0 1 0 14"/><path d="M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5"/>'],
'grip-vertical':[24,'<path d="M9 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M9 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M9 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M15 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M15 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M15 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/>']"""
old_x="""x:[24,'<path d="M18 6l-12 12"/><path d="M6 6l12 12"/>']"""
assert old_x in hi
hi=hi.replace(old_x,extra)
# B / IB
hi=re.sub(r"function B\(.*?\n","""function B(label,action,cls='secondary',icon='',attrs=''){if(!/primary|secondary|rec|text|dark|ghost|side/.test(cls))cls+=' secondary';return `<button class="btn ${cls}" data-action="${action}" ${attrs}>${icon?ic(icon):''}${label?`<span class="lbl">${label}</span>`:''}</button>`}\n""",hi,count=1)
hi=hi.replace('class="sw a"','class="sx a"').replace('class="sw b"','class="sx b"')
sh=rd('shots.js')
sh=sh.replace("g.addColorStop(0,n?'#3B4A63':'#2E4A40');g.addColorStop(1,n?'#1F2430':'#82B09A')","g.addColorStop(0,'#2E4A40');g.addColorStop(1,'#82B09A')")
tm=rd('toast_micro.js')
tm=re.sub(r"function holdDone\(\)\{.*?\n","",tm,count=1)
tm=tm.replace("hold.timer=setTimeout(()=>{const h=hold;clearInterval(h.int);hold=null;holdDone()},2000*T)","hold.timer=setTimeout(()=>{const h=hold;clearInterval(h.int);hold=null;holdDone(h.el)},2000*T)")
head='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Showhow house style · prototype</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
'''
body='''</style></head><body>
<div class="toolbar"><span>Showhow house style · prototype · fake data</span>
<span class="tseg">Motion:<button id="m-1" class="on">1×</button><button id="m-10">0.1×</button></span>
<label for="screen">Screen:</label><select id="screen"></select><button id="sample">Sample library</button><button id="theme">Dark</button></div>
<div class="window" id="window"><div class="titlebar"><div class="dots3"><i></i><i></i><i></i></div>Showhow</div><div id="app" class="app"></div><div id="layers"><div id="sheetHost"></div><div id="hudHost"></div><div id="menuHost"></div><div id="toastHost"></div><div class="tip" id="tip" role="tooltip"></div></div></div>
<script>
'''
out=head+rd('css.css')+body+rd('webgl.js')+hi+sh+tm+rd('main.js')+rd('nav.js')+'</script></body></html>\n'
open(P+'index.html','w').write(out)
print(len(out))
