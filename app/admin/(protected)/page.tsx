import Link from 'next/link'
import {SetupRequired} from '@/components/admin/crud-page'
import {isSupabaseConfigured} from '@/lib/supabase/config'

const sections = [
  ['Projects', '/admin/projects'], ['Brands', '/admin/brands'], ['Work Types', '/admin/work-types'],
  ['Resume', '/admin/resume'], ['About', '/admin/about'], ['Site Settings', '/admin/settings'],
]

export default function DashboardPage() {
  return <section><div className="admin-page-heading"><div><p className="admin-eyebrow">Dashboard</p><h1>Content management</h1><p>Manage bilingual portfolio content, publication and files.</p></div></div>{!isSupabaseConfigured ? <SetupRequired /> : <div className="admin-grid">{sections.map(([label, href]) => <Link className="admin-card" href={href} key={href}><h2>{label}</h2><span>Manage →</span></Link>)}</div>}</section>
}
