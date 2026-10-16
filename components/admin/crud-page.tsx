import {isSupabaseConfigured} from '@/lib/supabase/config'
import {requireAdmin} from '@/lib/auth'
import type {CrudConfig} from './types'
import {RecordForm} from './record-form'

export async function CrudPage({config}: {config: CrudConfig}) {
  if (!isSupabaseConfigured) return <SetupRequired />
  const auth = await requireAdmin()
  let request = auth!.supabase.from(config.table).select('*')
  if (config.fields.some((field) => field.name === 'sort_order')) request = request.order('sort_order', {ascending: true})
  const {data, error} = await request
  if (error) throw new Error(error.message)
  return (
    <section>
      <div className="admin-page-heading"><div><h1>{config.title}</h1><p>{config.description}</p></div></div>
      <details className="admin-panel"><summary>Add new</summary><RecordForm config={config} /></details>
      <div className="admin-stack">
        {(data || []).map((record) => (
          <details className="admin-panel" key={String(record.id)}>
            <summary>{String(record[config.titleField] || 'Untitled')}</summary>
            <RecordForm config={config} record={record} />
          </details>
        ))}
        {!data?.length ? <p className="admin-empty">No records yet.</p> : null}
      </div>
    </section>
  )
}

export function SetupRequired() {
  return <div className="admin-panel"><h1>Supabase setup required</h1><p>The admin interface is ready, but no project credentials are configured. Follow the README setup steps.</p></div>
}
