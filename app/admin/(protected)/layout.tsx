import Link from 'next/link'
import type {ReactNode} from 'react'
import {requireAdmin} from '@/lib/auth'
import {isSupabaseConfigured} from '@/lib/supabase/config'
import {signOut} from '../actions'

const nav = [
  ['Genel bakış', '/admin'], ['Projeler ve videolar', '/admin/projects'], ['Markalar', '/admin/brands'], ['Çalışma türleri', '/admin/work-types'],
  ['CV yükle ve yönet', '/admin/resume'], ['Deneyim', '/admin/resume/experience'], ['Eğitim', '/admin/resume/education'],
  ['Gönüllülük', '/admin/resume/volunteering'], ['Yetkinlikler', '/admin/resume/skills'], ['Diller', '/admin/resume/languages'], ['Hakkımda', '/admin/about'], ['Site ayarları', '/admin/settings'],
]

export default async function AdminLayout({children}: {children: ReactNode}) {
  if (isSupabaseConfigured) await requireAdmin()
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">YKA Admin</Link>
        <nav>{nav.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav>
        <Link className="admin-signout" href="/tr" target="_blank">Siteyi görüntüle ↗</Link>
        {isSupabaseConfigured ? <form action={signOut}><button className="admin-signout">Çıkış yap</button></form> : null}
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
