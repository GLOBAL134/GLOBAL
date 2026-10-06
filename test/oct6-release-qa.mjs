import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const url=process.env.BASE_URL;
assert.ok(url,'BASE_URL required');
const dir=process.env.QA_DIR||'/Users/grizzly/.hermes/cache/scratch/global-oct6-qa';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch();
const reports=[];
for(const [width,height] of [[1920,1080],[1440,900],[1024,900],[768,1024],[430,900],[390,844],[375,844],[320,720]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});
 await page.goto(url,{waitUntil:'networkidle'});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.equal(overflow,0,`overflow ${width}`);
 for(const [name,selector] of [['hero','.hero'],['countries','.country-showcase'],['contacts','#contacts'],['review','.review-stage']]){
  const block=page.locator(selector);await block.scrollIntoViewIfNeeded();await page.waitForTimeout(1100);
  if([1920,1440,390,320].includes(width))await block.screenshot({path:`${dir}/${width}-${name}.png`});
 }
 const images=await page.locator('.country-showcase img').evaluateAll(xs=>xs.map(x=>({ok:x.complete&&x.naturalWidth>0,fit:getComputedStyle(x).objectFit})));
 assert.ok(images.every(x=>x.ok&&x.fit==='cover'));assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 const raw=await page.content();assert.ok(!/global\.novosibirsk@mail\.ru/.test(raw));
 await page.locator('.wizard-promo button').click();
 const wizard=page.locator('.wizard');assert.match(await wizard.locator('.wizard-head b').innerText(),/Шаг 1 из 5/i);
 const counter=await wizard.locator('.wizard-head b').boundingBox(),close=await wizard.locator('button[aria-label="Закрыть окно"]').boundingBox();
 assert.ok(counter&&close&&(counter.x+counter.width<=close.x||counter.y+counter.height<=close.y||close.y+close.height<=counter.y),`wizard counter overlap ${width}`);
 await wizard.locator('button[aria-label="Закрыть окно"]').click();
 reports.push({width,height,overflow,errors,missing,images:images.length});await page.close();
}
if(process.env.RUN_E2E==='1'){
 const p=await browser.newPage({viewport:{width:1440,height:900}});await p.goto(url,{waitUntil:'networkidle'});
 const extras=['Бронирование авиабилетов','Бронирование отелей','Запись на подачу документов'];
 await p.locator('.calculator select').first().selectOption('Япония');
 for(const e of extras)await p.locator(`.calculator input[value="${e}"]`).check();
 await p.locator('.calculator button').filter({hasText:'Получить точный расчёт'}).click();
 const f=p.locator('.lead-modal form');await f.locator('[name="name"]').fill('GLOBAL QA TEST');await f.locator('[name="phone"]').fill('+79995554433');
 const comment=await f.locator('[name="comment"]').inputValue();for(const e of extras)assert.ok(comment.includes(e));
 await f.locator('[name="comment"]').fill('ТЕСТ QA Oct6 — не связываться. '+comment);await f.locator('[name="consent"]').check();
 const [r]=await Promise.all([p.waitForResponse(r=>r.url().endsWith('/applications')&&r.request().method()==='POST'),f.getByRole('button',{name:'Получить консультацию'}).click()]);const data=await r.json();
 const success=p.locator('.lead-modal .success-screen');await success.waitFor();const ui=await success.locator('strong').innerText();assert.equal(r.status(),201);assert.equal(ui,data.id);assert.equal(data.ok,true);
 reports.push({e2e:{status:r.status(),id:data.id,ui,extras,comment}});await success.screenshot({path:`${dir}/e2e-success.png`});await p.close();
}
await fs.writeFile(`${dir}/results.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));await browser.close();
