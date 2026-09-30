import test from "node:test";
import assert from "node:assert/strict";
import { validateApplication, makeApplicationId, formatTelegramMessage } from "../src/lib.js";

test("valid application is normalized", () => {
  const result = validateApplication({ name:" Алексей ", phone:"+7 (913) 123-45-67", country:"Япония", purpose:"Туризм", service:"Оформление визы", comment:"Поездка в мае", source:"website", consent:true, website:"" });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Алексей");
  assert.equal(result.value.phone, "+79131234567");
});

test("honeypot is rejected", () => {
  const result = validateApplication({ name:"Алексей", phone:"+79131234567", country:"Япония", consent:true, website:"spam" });
  assert.equal(result.ok, false);
});

test("missing consent is rejected", () => {
  const result = validateApplication({ name:"Алексей", phone:"+79131234567", country:"Япония", consent:false, website:"" });
  assert.equal(result.ok, false);
});

test("id has public G prefix", () => assert.match(makeApplicationId(), /^G-[A-Z0-9]{8}$/));

test("telegram message includes lead fields", () => {
  const text = formatTelegramMessage({ id:"G-TEST1234", created_at:"2026-09-30T12:00:00.000Z", name:"Алексей", phone:"+79131234567", country:"Япония", purpose:"Туризм", service:"Оформление визы", comment:"Тест", source:"website", status:"NEW" });
  assert.match(text,/НОВАЯ ЗАЯВКА — GLOBAL/); assert.match(text,/G-TEST1234/); assert.match(text,/Япония/);
});

import worker from "../src/index.js";

const validBody = { name:"Тест", phone:"+79991234567", country:"Япония", purpose:"Туризм", service:"Виза", comment:"Тест", source:"test", consent:true, website:"" };
const request = () => new Request("https://worker.test/applications", { method:"POST", headers:{"content-type":"application/json", origin:"https://global134.github.io"}, body:JSON.stringify(validBody) });
const baseEnv = { ALLOWED_ORIGIN:"https://global134.github.io", SUPABASE_URL:"https://supabase.test", SUPABASE_SERVICE_ROLE_KEY:"secret", TELEGRAM_BOT_TOKEN:"token", TELEGRAM_CHAT_ID:"chat" };

test("Supabase failure returns 502 and does not call Telegram", async () => {
  const calls=[]; const env={...baseEnv, fetch:async (url)=>{calls.push(String(url)); return new Response("failure",{status:500});}};
  const response=await worker.fetch(request(),env);
  assert.equal(response.status,502); assert.equal(calls.length,1); assert.match(calls[0],/supabase/);
});

test("Telegram failure returns 502 and rolls back Supabase row", async () => {
  const calls=[]; const env={...baseEnv, fetch:async (url,init)=>{calls.push({url:String(url),method:init.method}); if(String(url).includes("api.telegram.org")) return new Response("failure",{status:500}); return new Response(init.method==="DELETE"?null:"",{status:init.method==="POST"?201:204});}};
  const response=await worker.fetch(request(),env);
  assert.equal(response.status,502); assert.equal(calls.length,3); assert.equal(calls[2].method,"DELETE"); assert.match(calls[2].url,/applications\?id=eq.G-/);
});

test("successful dependencies return 201 and a public ID", async () => {
  const env={...baseEnv, fetch:async (_url,init)=>new Response("",{status:init.method==="POST"?201:204})};
  const response=await worker.fetch(request(),env); const body=await response.json();
  assert.equal(response.status,201); assert.match(body.id,/^G-[A-Z0-9]{8}$/);
});
