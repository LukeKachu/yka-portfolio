type Keys={siteKey?:string;secretKey?:string}

export function turnstileConfiguration({siteKey,secretKey}:Keys):'disabled'|'required'|'incomplete' {
  if (!siteKey?.trim()&&!secretKey?.trim()) return 'disabled'
  return siteKey?.trim()&&secretKey?.trim()?'required':'incomplete'
}

// Called only by the server handler. Never send names, messages, email or phone to Siteverify.
export async function verifyTurnstile(secret:string,token:string,hostname:string,verify:typeof fetch=fetch):Promise<'valid'|'invalid'|'unavailable'> {
  if (!token||token.length>2048) return 'invalid'
  try {
    const response=await verify('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',signal:AbortSignal.timeout(8000),
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:secret.trim(),response:token}),
    })
    if (!response.ok) return 'unavailable'
    const result=await response.json()
    if (result?.success!==true) {
      const errors=Array.isArray(result?.['error-codes'])?result['error-codes']:[]
      return errors.some((code:unknown)=>['missing-input-secret','invalid-input-secret','internal-error'].includes(String(code)))?'unavailable':'invalid'
    }
    if (result.hostname!==hostname||result.action!=='portfolio_contact') return 'invalid'
    return 'valid'
  } catch {return 'unavailable'}
}
