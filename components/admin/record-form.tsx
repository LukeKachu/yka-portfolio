import {deleteRecord, saveRecord} from '@/app/admin/actions'
import type {CrudConfig} from './types'

function displayValue(value: unknown, type?: string) {
  if (Array.isArray(value)) return value.join('\n')
  if (type === 'date' && typeof value === 'string') return value.slice(0, 10)
  return value == null ? '' : String(value)
}

export function RecordForm({config, record}: {config: CrudConfig; record?: Record<string, unknown>}) {
  return (
    <form action={saveRecord} className="admin-form">
      <input type="hidden" name="_table" value={config.table} />
      <input type="hidden" name="_id" value={String(record?.id || '')} />
      <input type="hidden" name="_returnTo" value={config.path} />
      <div className="admin-form-grid">
        {config.fields.map((field) => (
          <label className={field.type === 'textarea' ? 'admin-field admin-field-wide' : 'admin-field'} key={field.name}>
            <span>{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea name={field.name} defaultValue={displayValue(record?.[field.name], field.type)} rows={6} />
            ) : field.type === 'checkbox' ? (
              <input name={field.name} type="checkbox" defaultChecked={Boolean(record?.[field.name])} />
            ) : (
              <input name={field.name} type={field.type || 'text'} defaultValue={displayValue(record?.[field.name], field.type)} required={field.required} />
            )}
          </label>
        ))}
      </div>
      <div className="admin-actions">
        <button className="admin-button" type="submit">Save</button>
        {record?.id ? (
          <button className="admin-button admin-button-danger" formAction={deleteRecord} type="submit">Delete</button>
        ) : null}
      </div>
    </form>
  )
}
