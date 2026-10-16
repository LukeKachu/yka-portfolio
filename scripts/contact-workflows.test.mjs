import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {PGlite} from '@electric-sql/pglite'
import {contactEmailConfigured, contactSchema, handleContact} from '../lib/contact/handler.ts'

// Test fixtures are in-memory only; no environment files, emails or real database writes.
const id = '11111111-1111-4111-8111-111111111111'
const config = {apiKey:'test-only-not-a-real-key',from:'YKA <contact@example.com>'}
function request(overrides={}, headers={}) {
  const form = new FormData()
  for (const [key,value] of Object.entries({name:'Test Visitor',email:'visitor@example.com',phone:'+90 (555) 123 45 67',reason:'project',message:'A test enquiry containing more than twenty characters.',website:'',startedAt:String(Date.now()-5000),requestId:id,...overrides})) form.set(key,value)
  return new Request('http://localhost:3000/api/contact',{method:'POST',body:form,headers:{origin:'http://localhost:3000',...headers}})
}
const save = async () => ({data:id,error:null})

test('contact config requires a real configuration and a valid sender, never a fallback', () => {
  assert.equal(contactEmailConfigured({}),false)
  assert.equal(contactEmailConfigured({apiKey:'configured'}),false)
  assert.equal(contactEmailConfigured({...config,from:'bad\r\nFrom: injected@example.com'}),false)
  assert.equal(contactEmailConfigured(config),true)
})

test('phone validation accepts international formatting but rejects missing, letters and invalid digit lengths', () => {
  const base = {name:'A Person',email:'person@example.com',reason:'other',message:'An ordinary message longer than twenty characters.',website:'',startedAt:Date.now(),requestId:id}
  for (const phone of ['+90 (555) 123 45 67','+44 7700 900123','020 1234 5678']) assert.equal(contactSchema.safeParse({...base,phone}).success,true)
  for (const phone of [undefined,'','call me','123456','1234567890123456','++90 555 1234567']) assert.equal(contactSchema.safeParse({...base,phone}).success,false)
})

test('unconfigured form does not write to the database or claim email success', async () => {
  const response = await handleContact(request(),{config:{},save:() => assert.fail('must not save'),send:() => assert.fail('must not send')})
  assert.equal(response.status,503)
  assert.deepEqual(await response.json(),{ok:false,code:'unavailable'})
})

test('invalid, cross-origin, honeypot, timestamp and oversized requests are rejected before any writes', async () => {
  const dependencies = {config,save:() => assert.fail('must not save')}
  for (const req of [request({phone:''}),request({website:'bot.example'}),request({startedAt:'0'}),request({startedAt:String(Date.now()+60000)}),request({message:'x'.repeat(33000)}),request({},{origin:'https://evil.example'}),new Request('http://localhost:3000/api/contact',{method:'POST',headers:{origin:'http://localhost:3000','Content-Type':'application/json'},body:'{}'})]) {
    const response = await handleContact(req,dependencies)
    assert.ok([400,403].includes(response.status))
  }
})

test('database and email-provider errors cannot result in a false success', async () => {
  let result = await handleContact(request(),{config,save:async () => ({data:null,error:{message:'Rate limit exceeded'}}),send:() => assert.fail('must not send')})
  assert.equal(result.status,429)
  for (const send of [async () => Response.json({message:'Rejected'},{status:403}),async () => {throw new TypeError('fetch failed')},async () => Response.json({})]) {
    result = await handleContact(request(),{config,save,send})
    assert.equal(result.status,503)
    assert.equal((await result.json()).ok,false)
  }
})

test('email contains phone, safe HTML and correct Reply-To; retry uses the same idempotency key', async () => {
  let previousKey
  const send = async (url,options) => {
    assert.equal(url,'https://api.resend.com/emails')
    const body = JSON.parse(options.body)
    assert.deepEqual(body.to,['yusufkerimaltay77@gmail.com'])
    assert.equal(body.from,config.from)
    assert.equal(body.reply_to,'visitor@example.com')
    assert.match(body.text,/Telefon: \+90/)
    assert.match(body.html,/&lt;script&gt;/)
    assert.doesNotMatch(body.html,/<script>/)
    const key = options.headers['Idempotency-Key']
    assert.equal(key,`contact/${id}`)
    if (previousKey) assert.equal(key,previousKey)
    previousKey = key
    return Response.json({id})
  }
  for (let n=0;n<2;n++) {
    const result = await handleContact(request({message:'<script>not executable</script> A sufficiently long message.'}),{config,save,send})
    assert.equal(result.status,200)
    assert.deepEqual(await result.json(),{ok:true})
  }
})

test('phone migration is repeatable, preserves messages, enforces RLS, rate limits and duplicate prevention', async () => {
  const db = new PGlite()
  try {
    const original = await readFile(new URL('../supabase/migrations/202608300004_contact_messages.sql',import.meta.url),'utf8')
    const migration = await readFile(new URL('../supabase/migrations/202610160007_contact_phone.sql',import.meta.url),'utf8')
    assert.doesNotMatch(migration,/\b(?:drop|truncate|disable\s+row\s+level\s+security)\b/i)
    await db.exec(`create role anon; create role authenticated; create function public.is_admin() returns boolean language sql as $$ select false $$;`)
    await db.exec(original)
    await db.exec(`grant usage on schema public to anon,authenticated; grant select,insert on public.contact_messages to anon,authenticated;
      insert into public.contact_messages(name,email,reason,message,request_fingerprint) values('Existing person','old@example.com','other','Keep this message unchanged','existing-fingerprint');`)
    await db.exec(migration)
    await db.exec(migration)
    assert.equal((await db.query('select count(*)::int as count from public.contact_messages')).rows[0].count,1)
    await db.exec('set role anon')
    assert.equal((await db.query('select * from public.contact_messages')).rows.length,0)
    const args = ['Test Visitor','visitor@example.com','+90 (555) 123 45 67','project','A test message with more than twenty characters.','a'.repeat(64),id,'test-agent']
    const sql = 'select public.submit_contact_message_v2($1,$2,$3,$4,$5,$6,$7,$8) as id'
    const first = (await db.query(sql,args)).rows[0].id
    assert.equal((await db.query(sql,args)).rows[0].id,first)
    await assert.rejects(db.query(sql,[...args.slice(0,2),'invalid',...args.slice(3)]),/Invalid contact/)
    await assert.rejects(db.query(sql,[...args.slice(0,4),'Changed message with the same request id',...args.slice(5)]),/Invalid contact/)
    for (const digit of ['2','3']) await db.query(sql,[...args.slice(0,6),`${digit.repeat(8)}-1111-4111-8111-111111111111`,args[7]])
    await assert.rejects(db.query(sql,[...args.slice(0,6),'44444444-1111-4111-8111-111111111111',args[7]]),/Rate limit/)
    await assert.rejects(db.exec(`insert into public.contact_messages(name,email,reason,message,request_fingerprint) values('Not allowed','no@example.com','other','Direct anonymous write must fail','fingerprint');`),/row-level security/)
    await db.exec('reset role')
    const stored = (await db.query('select phone,request_id from public.contact_messages where id=$1',[first])).rows[0]
    assert.deepEqual(stored,{phone:args[2],request_id:id})
    assert.equal((await db.query('select count(*)::int as count from public.contact_messages')).rows[0].count,4)
  } finally {await db.close()}
})
