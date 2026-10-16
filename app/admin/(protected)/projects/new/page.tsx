import {ProjectForm} from '@/components/admin/project-form'
import {SetupRequired} from '@/components/admin/crud-page'
import {isSupabaseConfigured} from '@/lib/supabase/config'
import {requireAdmin} from '@/lib/auth'

export default async function NewProjectPage() {
  if (!isSupabaseConfigured) return <SetupRequired />
  const auth = await requireAdmin()
  const [{data: brands}, {data: workTypes}] = await Promise.all([
    auth!.supabase.from('brands').select('id,name').order('sort_order'), auth!.supabase.from('work_types').select('id,internal_name').order('sort_order'),
  ])
  return <section><div className="admin-page-heading"><div><h1>New project</h1><p>Shared data is stored once; Turkish and English text remain editable side by side.</p></div></div><ProjectForm brands={brands || []} workTypes={workTypes || []} selectedWorkTypes={[]} roles={[]} links={[]} /></section>
}
