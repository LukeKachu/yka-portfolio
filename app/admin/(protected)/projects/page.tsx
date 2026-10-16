import Link from 'next/link'
import {SetupRequired} from '@/components/admin/crud-page'
import {isSupabaseConfigured} from '@/lib/supabase/config'
import {requireAdmin} from '@/lib/auth'

export default async function ProjectsPage() {
  if (!isSupabaseConfigured) return <SetupRequired />
  const auth = await requireAdmin()
  const {data, error} = await auth!.supabase.from('projects').select('id,internal_name,slug,published,featured,sort_order').order('sort_order')
  if (error) throw new Error(error.message)
  return <section><div className="admin-page-heading"><div><h1>Projects</h1><p>Manage bilingual portfolio projects, publication and media.</p></div><Link className="admin-button" href="/admin/projects/new">New project</Link></div><div className="admin-stack">{data?.map((project) => <Link className="admin-list-row" href={`/admin/projects/${project.id}`} key={project.id}><div><strong>{project.internal_name}</strong><span>/{project.slug}</span></div><div className="admin-badges"><span>{project.published ? 'Published' : 'Draft'}</span>{project.featured ? <span>Featured</span> : null}</div></Link>)}{!data?.length ? <p className="admin-empty">No projects yet.</p> : null}</div></section>
}
