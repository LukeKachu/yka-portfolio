import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {PGlite} from '@electric-sql/pglite'
import {createHash} from 'node:crypto'

// Disposable PostgreSQL only. No credentials, live RPC calls, messages or email.
test('staged gateway migration preserves data and closes every unsigned write path',async()=>{
  const db=new PGlite()
  const load=name=>readFile(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8')
  try {
    await db.exec('create role anon; create role authenticated; create function public.is_admin() returns boolean language sql as $$ select false $$;')
    await db.exec(await load('202608300004_contact_messages.sql'))
    await db.exec(await load('202610160007_contact_phone.sql'))
    await db.exec(`grant usage on schema public to anon,authenticated;
      grant select,insert on public.contact_messages to anon,authenticated;
      insert into public.contact_messages(name,email,reason,message,request_fingerprint) values('Existing person','old@example.com','other','Preserve this original message','existing');`)
    const prepare=await load('202611160008_prepare_contact_gateway.sql')
    const activate=await load('202611160009_enforce_contact_gateway.sql')
    for(const sql of [prepare,activate])assert.doesNotMatch(sql,/\b(?:drop|truncate|delete\s+from|disable\s+row\s+level\s+security)\b/i)
    await db.exec(prepare)
    const secret=(await db.query('select secret from portfolio_private.contact_gateway')).rows[0].secret
    await db.exec(prepare)
    assert.equal((await db.query('select secret from portfolio_private.contact_gateway')).rows[0].secret,secret)
    assert.equal((await db.query('select count(*)::int as n from public.contact_messages')).rows[0].n,1)
    // Stage 1 deliberately preserves the old live path during deployment.
    assert.equal((await db.query("select has_function_privilege('anon','public.submit_contact_message_v2(text,text,text,text,text,text,uuid,text)','execute') as allowed")).rows[0].allowed,true)

    const id='11111111-1111-4111-8111-111111111111'
    const args=['QA Person','person@example.com',null,'other','An enquiry exceeding twenty characters.',createHash('sha256').update('192.0.2.1').digest('hex'),id,'test-agent']
    const rpc='select public.submit_contact_message_v3($1,$2,$3,$4,$5,$6,$7,$8) as id'
    for(const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`)
      await assert.rejects(db.query('select secret from portfolio_private.contact_gateway'),/permission denied/)
      await assert.rejects(db.query(rpc,args),/authorization required/)
      await db.query("select set_config('request.headers',$1,false)",[JSON.stringify({'x-contact-gateway-key':'b'.repeat(64)})])
      await assert.rejects(db.query(rpc,args),/authorization required/)
      await db.exec('reset role')
    }
    await assert.rejects(db.exec(activate),/test the new server gateway/)
    await db.exec('rollback')
    // Prove the new path works before old privileges can be revoked.
    await db.exec('set role anon')
    await db.query("select set_config('request.headers',$1,false)",[JSON.stringify({'x-contact-gateway-key':secret})])
    await db.query(rpc,['Staged QA','stage@example.com',null,'project','An isolated migration readiness check.', 'b'.repeat(64),'99999999-1111-4111-8111-111111111111',null])
    await db.query("select set_config('request.headers','{}',false)")
    await db.exec('reset role')
    await db.exec(activate)
    await db.exec(activate)
    for(const role of ['anon','authenticated']) {
      for(const fn of ['submit_contact_message(text,text,text,text,text,text)','submit_contact_message_v2(text,text,text,text,text,text,uuid,text)']) {
        assert.equal((await db.query('select has_function_privilege($1,$2,\'execute\') as allowed',[role,`public.${fn}`])).rows[0].allowed,false)
      }
      await db.exec(`set role ${role}`)
      await assert.rejects(db.query('select public.submit_contact_message($1,$2,$3,$4,$5,$6)',['QA','qa@example.com','other','Unsigned direct writes must be rejected','a'.repeat(64),null]),/permission denied/)
      await assert.rejects(db.query('select public.submit_contact_message_v2($1,$2,$3,$4,$5,$6,$7,$8)',args),/permission denied/)
      await assert.rejects(db.exec("insert into public.contact_messages(name,email,reason,message,request_fingerprint) values('QA','qa@example.com','other','Unsigned direct writes must be rejected','fingerprint')"),/permission denied/)
      await db.query("select set_config('request.headers','{}',false)")
      await assert.rejects(db.query(rpc,args),/authorization required/)
      await db.exec('reset role')
    }
    await db.exec('set role anon')
    await db.query("select set_config('request.headers',$1,false)",[JSON.stringify({'x-contact-gateway-key':secret})])
    const first=(await db.query(rpc,args)).rows[0].id
    assert.equal((await db.query(rpc,args)).rows[0].id,first)
    assert.equal((await db.query(rpc,[...args.slice(0,2),'   ',...args.slice(3)])).rows[0].id,first)
    for(const phone of ['invalid','123','1234567890123456'])await assert.rejects(db.query(rpc,[...args.slice(0,2),phone,...args.slice(3)]),/Invalid contact/)
    await assert.rejects(db.query(rpc,[...args.slice(0,4),'Changed content under the same request ID',...args.slice(5)]),/Invalid contact/)
    for(const field of [0,1,3,4,5,6]) {const invalid=[...args];invalid[field]=null;await assert.rejects(db.query(rpc,invalid),/Invalid contact/)}
    for(const digit of ['2','3'])await db.query(rpc,[...args.slice(0,6),`${digit.repeat(8)}-1111-4111-8111-111111111111`,args[7]])
    await assert.rejects(db.query(rpc,[...args.slice(0,6),'44444444-1111-4111-8111-111111111111',args[7]]),/Rate limit/)
    assert.equal((await db.query('select * from public.contact_messages')).rows.length,0)
    await db.exec('reset role')
    const stored=(await db.query('select phone,request_id from public.contact_messages where id=$1',[first])).rows[0]
    assert.deepEqual(stored,{phone:null,request_id:id})
    assert.equal((await db.query('select count(*)::int as n from public.contact_messages')).rows[0].n,5)
    await db.exec('set role authenticated')
    // The same email cannot bypass its daily limit by rotating source addresses.
    for(let n=0;n<10;n++)await db.query(rpc,['QA','daily@example.com','+90 555 1234567','other','A separate isolated email rate limit check.',createHash('sha256').update(`address-${n}`).digest('hex'),`aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12,'0')}`,null])
    await assert.rejects(db.query(rpc,['QA','DAILY@example.com',null,'other','The eleventh email submission is rejected.',createHash('sha256').update('another-address').digest('hex'),'aaaaaaaa-aaaa-4aaa-8aaa-999999999999',null]),/Rate limit/)
    await db.exec('reset role')
    // Re-running preparation after activation never reopens the legacy paths.
    await db.exec(prepare)
    assert.equal((await db.query("select has_function_privilege('anon','public.submit_contact_message(text,text,text,text,text,text)','execute') as allowed")).rows[0].allowed,false)
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.contact_messages'::regclass")).rows[0].relrowsecurity,true)
  } finally {await db.close()}
})
