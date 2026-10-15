import {chromium} from '/Users/mohamedb/dev/projects/showhow/node_modules/playwright/index.mjs';
const url='file:///Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/index.html';
const [,, name, ms, out]=process.argv;
const b=await chromium.launch({channel:'chrome'});const pg=await b.newPage({viewport:{width:1440,height:900}});
pg.on('console',m=>{if(m.type()==='error')console.log('ERR',m.text())});pg.on('pageerror',e=>console.log('PERR',e.message));
await pg.goto(url);await pg.waitForTimeout(600);
await pg.selectOption('#screen',name);await pg.waitForTimeout(+ms||700);
await pg.screenshot({path:`/Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/shots/_${out||name}.png`});
await b.close();
