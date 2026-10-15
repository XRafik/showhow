import {chromium} from '/Users/mohamedb/dev/projects/showhow/node_modules/playwright/index.mjs';
const url='file:///Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-polish-pass/index.html';
const b=await chromium.launch({channel:'chrome'});const pg=await b.newPage({viewport:{width:1440,height:900}});
pg.on('console',m=>console.log('C',m.text()));pg.on('pageerror',e=>console.log('E',e.message));
await pg.goto(url);await pg.waitForTimeout(600);await pg.selectOption('#screen','A');await pg.waitForTimeout(400);await pg.click('[data-action=menu]');await pg.waitForTimeout(300);
console.log(await pg.evaluate(()=>document.querySelector('#menuHost').innerHTML.length), await pg.evaluate(()=>document.querySelectorAll('[data-hold]').length));
await b.close();
