import assert from 'node:assert/strict'
import test from 'node:test'
import {handleContact} from '../lib/contact/handler.ts'
import {turnstileConfiguration} from '../lib/contact/turnstile.ts'

// Isolated dependency fixtures only. No real credentials, databases or emails.
const id='11111111-1111-4111-8111-111111111111'
const config={apiKey:'isolated-test-provider',from:'QA <qa@example.com>',turnstileSiteKey:'isolated-widget',turnstileSecretKey:'isolated-secret'}
function request(token='isolated-token') {
  const form=new FormData()
  for(const [key,value] of Object.entries({name:'Test Visitor',email:'visitor@example.com',phone:'+90 555 1234567',reason:'other',message:'A sufficiently long isolated test message.',website:'',requestId:id,startedAt:String(Date.now()-5000)}))form.set(key,value)
  if(Array.isArray(token))for(const value of token)form.append('cf-turnstile-response',value)
  else if(token!==null)form.set('cf-turnstile-response',token)
  return new Request('https://portfolio.example/api/contact',{method:'POST',body:form,headers:{origin:'https://portfolio.example'}})
}
const guarded={config,save:()=>assert.fail('must not save an unverified message'),send:()=>assert.fail('must not email an unverified message')}

test('Turnstile activation is server configured; one missing key fails closed',async()=>{
  assert.equal(turnstileConfiguration({}),'disabled')
  assert.equal(turnstileConfiguration({siteKey:'  ',secretKey:''}),'disabled')
  for(const keys of [{siteKey:'public-widget'},{secretKey:'isolated-secret'}])assert.equal(turnstileConfiguration(keys),'incomplete')
  assert.equal(turnstileConfiguration({siteKey:'public-widget',secretKey:'isolated-secret'}),'required')
  for(const patch of [{turnstileSiteKey:undefined},{turnstileSecretKey:undefined}]) {
    const response=await handleContact(request(),{...guarded,config:{...config,...patch},verify:()=>assert.fail('incomplete configuration must not verify')})
    assert.equal(response.status,503)
  }
})

test('missing, oversized and ambiguous challenge tokens are rejected before verification or writes',async()=>{
  for(const token of [null,'','x'.repeat(2049),['first','second'],new Blob(['not a string'])]) {
    const response=await handleContact(request(token),{...guarded,verify:()=>assert.fail('invalid input must not verify')})
    assert.equal(response.status,400)
    assert.equal((await response.json()).code,'captcha_required')
  }
})

test('forged, expired, reused and wrong-context tokens cannot create records or emails',async()=>{
  for(const result of [{success:false,'error-codes':['invalid-input-response']},{success:false,'error-codes':['timeout-or-duplicate']},{success:true,hostname:'attacker.example',action:'portfolio_contact'},{success:true,hostname:'portfolio.example',action:'other_form'},{success:true}]) {
    const response=await handleContact(request(),{...guarded,verify:async()=>Response.json(result)})
    assert.equal(response.status,400)
    assert.deepEqual(await response.json(),{ok:false,code:'captcha_failed'})
  }
})

test('verification outages, malformed replies and bad secret configuration fail closed without leaking provider details',async()=>{
  for(const verify of [async()=>{throw new Error('private provider detail')},async()=>new Response('unavailable',{status:500}),async()=>new Response('not JSON'),async()=>Response.json({success:false,'error-codes':['invalid-input-secret']})]) {
    const response=await handleContact(request(),{...guarded,verify})
    assert.equal(response.status,503)
    assert.deepEqual(await response.json(),{ok:false,code:'captcha_unavailable'})
  }
})

test('successful Siteverify action/hostname checks happen before saving or sending; no message fields go to Cloudflare',async()=>{
  const order=[]
  const response=await handleContact(request(),{config,
    verify:async(url,options)=>{
      order.push('verify')
      assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify')
      assert.deepEqual(JSON.parse(options.body),{secret:'isolated-secret',response:'isolated-token'})
      assert.equal(options.method,'POST')
      return Response.json({success:true,hostname:'portfolio.example',action:'portfolio_contact'})
    },
    save:async()=>{order.push('save');return {data:id,error:null}},
    send:async()=>{order.push('send');return Response.json({id})},
  })
  assert.equal(response.status,200)
  assert.deepEqual(order,['verify','save','send'])
})

test('absence of both keys preserves the working pre-activation form, not a client-controlled bypass',async()=>{
  const response=await handleContact(request(null),{config:{...config,turnstileSiteKey:undefined,turnstileSecretKey:undefined},verify:()=>assert.fail('disabled feature must not verify'),save:async()=>({data:id,error:null}),send:async()=>Response.json({id})})
  assert.equal(response.status,200)
})
