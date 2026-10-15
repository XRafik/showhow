import {chromium} from '/Users/mohamedb/dev/projects/showhow/node_modules/playwright/index.mjs';
const url='file:///Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-polish-pass/index.html';
const [,, name, ...rest]=process.argv;
const b=await chromium.launch({channel:'chrome'});const pg=await b.newPage({viewport:{width:1440,height:900}});
await pg.goto(url);await pg.waitForTimeout(600);
await pg.selectOption('#screen',name);await pg.waitForTimeout(+rest[0]||700);
await pg.screenshot({path:`/Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-polish-pass/shots/_${name}.png`});
await b.close();
