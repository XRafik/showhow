import {chromium} from '/Users/mohamedb/dev/projects/showhow/node_modules/playwright/index.mjs';
const url='file:///Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/index.html';
const out='/Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/shots/';
const b=await chromium.launch({channel:'chrome'});const pg=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(url);await pg.waitForTimeout(800);
for(const s of ['I','I-export']){await pg.selectOption('#screen',s);await pg.waitForTimeout(700);await pg.screenshot({path:out+s+'.png'})}
await pg.selectOption('#screen','I');await pg.waitForTimeout(500);const z0=await pg.locator('.pill.z').count();await pg.click('[data-action=apply]');await pg.waitForTimeout(1000);
console.log('zoom pills before/after',z0,await pg.locator('.pill.z').count(),'cut',await pg.locator('.pill.cut').count());
await pg.screenshot({path:out+'I-applied.png'});console.log(errs);await b.close();
