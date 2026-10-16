import {createServerClient} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'
import {supabaseConfig} from './config'

export async function updateSession(request: NextRequest) {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) return NextResponse.next({request})

  let response = NextResponse.next({request})
  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value))
        response = NextResponse.next({request})
        cookiesToSet.forEach(({name, value, options}) => response.cookies.set(name, value, options))
      },
    },
  })

  const {data: {user}} = await supabase.auth.getUser()
  const isLogin = request.nextUrl.pathname === '/admin/login'
  if (request.nextUrl.pathname.startsWith('/admin') && !isLogin) {
    const {data: isAdmin} = user ? await supabase.rpc('is_admin') : {data: false}
    if (user && isAdmin === true) return response
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    if (user) url.searchParams.set('error', 'unauthorized')
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }
  return response
}
