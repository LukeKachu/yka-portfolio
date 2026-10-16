export type FieldConfig = {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'date' | 'url' | 'email' | 'checkbox'
  required?: boolean
}

export type CrudConfig = {
  title: string
  description: string
  table: string
  path: string
  fields: FieldConfig[]
  titleField: string
}
