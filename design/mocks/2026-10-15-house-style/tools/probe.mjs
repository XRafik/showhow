import {chromium} from '/Users/mohamedb/dev/projects/showhow/node_modules/playwright/index.mjs';
const url='file:///Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/index.html';
const b=await chromium.launch({channel:'chrome'});const pg=await b.newPage({viewport:{width:1440,height:900}});
pg.on('pageerror',e=>console.log('E',e.message));
await pg.goto(url);await pg.waitForTimeout(300);
console.log(await pg.evaluate(async()=>{let n=0;await new Promise(r=>{const f=()=>{n++;if(n<5)requestAnimationFrame(f);else r()};requestAnimationFrame(f)});const c=document.querySelector('canvas.dither');return JSON.stringify({n,cw:c.width,ch:c.height,gl:!!c._st,lost:c._st&&c._st.gl.isContextLost()})}));
await b.close();
