import {redirect} from 'next/navigation'
import {signIn} from '../actions'
import {isSupabaseConfigured} from '@/lib/supabase/config'
import {createClient} from '@/lib/supabase/server'

export default async function LoginPage({searchParams}: {searchParams: Promise<{error?: string; next?: string}>}) {
  const params = await searchParams
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (user) {
      const {data: isAdmin} = await supabase.rpc('is_admin')
      if (isAdmin === true) redirect('/admin')
    }
  }
  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <p className="admin-eyebrow">Portfolio administration</p>
        <h1>Sign in</h1>
        {!isSupabaseConfigured ? <p className="admin-notice">Supabase credentials are not configured yet.</p> : null}
        {params.error === 'credentials' ? <p className="admin-error">The email or password is incorrect.</p> : null}
        {params.error === 'unauthorized' ? <p className="admin-error">This authenticated account is not listed as a portfolio administrator.</p> : null}
        {params.error === 'invalid' ? <p className="admin-error">Enter a valid email and password.</p> : null}
        <form action={signIn} className="admin-form">
          <input type="hidden" name="next" value={params.next || '/admin'} />
          <label className="admin-field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
          <label className="admin-field"><span>Password</span><input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
          <button className="admin-button" disabled={!isSupabaseConfigured} type="submit">Sign in</button>
        </form>
      </div>
    </main>
  )
}
