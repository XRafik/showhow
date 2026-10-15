import {chromium} from '/Users/mohamedb/dev/projects/showhow/node_modules/playwright/index.mjs';
const url='file:///Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-polish-pass/index.html';
const b=await chromium.launch({channel:'chrome'});const pg=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await pg.goto(url);await pg.waitForTimeout(800);
console.log('load errs',errs.splice(0));
const opts=await pg.$$eval('#screen option',o=>o.map(x=>x.value));
for(const o of opts){await pg.selectOption('#screen',o);await pg.waitForTimeout(o==='F2'||o==='F4'||o==='R2'?300:350);const e=errs.splice(0);if(e.length)console.log(o,e)}
console.log('done');await b.close();
