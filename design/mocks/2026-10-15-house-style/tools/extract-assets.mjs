import {chromium} from '/Users/mohamedb/dev/projects/showhow/node_modules/playwright/index.mjs';
import {mkdirSync, writeFileSync} from 'node:fs';
const url='file:///Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/index.html';
const out='/Users/mohamedb/dev/projects/showhow/design/assets/';
mkdirSync(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'});
const pg=await b.newPage();
await pg.goto(url);await pg.waitForTimeout(800);
const jobs=[];
for(let v=0;v<6;v++)jobs.push({name:`shot-${v}`,js:`(()=>{const s=makeShot(${v},1);return s.cv.toDataURL('image/png')})()`});
for(let n=0;n<2;n++)jobs.push({name:`disp-${n}`,js:`(()=>{return makeDisplay(${n}).toDataURL('image/png')})()`});
jobs.push({name:'edf',js:`(()=>{const cv=document.createElement('canvas');cv.width=1120;cv.height=660;const c=cv.getContext('2d'),W=cv.width,H=cv.height;const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#CFE4DA');g.addColorStop(.5,'#82B09A');g.addColorStop(1,'#E7F1EC');c.fillStyle=g;c.fillRect(0,0,W,H);c.fillStyle='#fff';c.beginPath();c.roundRect(120,80,880,500,6);c.fill();c.fillStyle='#F0EDE6';c.fillRect(120,80,880,40);[0,1,2].forEach(i=>{c.fillStyle='#CFCBC2';c.beginPath();c.arc(144+i*22,100,6,0,7);c.fill()});c.fillStyle='#F0EDE6';c.fillRect(148,148,160,400);[0,1,2,3,4].forEach(i=>{c.fillStyle='#E8E5DE';c.fillRect(340,148+i*34,[360,520,440,500,400][i],16)});return cv.toDataURL('image/png')})()`});
jobs.push({name:'wave',js:`(()=>{const R=rng(3);const cv=document.createElement('canvas');cv.width=1200;cv.height=64;const c=cv.getContext('2d');c.fillStyle='#82B09A';const n=300,bw=cv.width/n;for(let i=0;i<n;i++){const v=6+Math.abs(Math.sin(i*.21))*16*(.4+R()*.8);const h=v*2.2;c.fillRect(i*bw+0.5,(cv.height-h)/2,bw-1,h)}return cv.toDataURL('image/png')})()`});
for(const j of jobs){const data=await pg.evaluate(j.js);writeFileSync(out+j.name+'.png',Buffer.from(data.split(',')[1],'base64'));console.log('wrote',j.name)}
await b.close();
