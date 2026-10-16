import {z} from 'zod'

export const contactFieldNames=['name','email','phone','reason','message'] as const
export type ContactField=typeof contactFieldNames[number]

// Shared by the browser and server so a form that passes locally uses the same rules.
export const contactFieldsSchema=z.object({
  name:z.string().trim().min(2).max(100).regex(/^[^\r\n]+$/),
  email:z.string().trim().toLowerCase().pipe(z.email().max(200)),
  phone:z.preprocess(value=>typeof value==='string'?value.replace(/[\u00a0\u202f]/g,' '):value,
    z.string().trim().min(7).max(30).regex(/^\+?[0-9 ().-]+$/).refine(value=>{
      const digits=value.replace(/\D/g,'')
      return digits.length>=7&&digits.length<=15
    })),
  reason:z.enum(['project','opportunity','other']),
  message:z.string().trim().min(20).max(4000),
  website:z.literal(''),
})

export const contactSchema=contactFieldsSchema.extend({
  startedAt:z.coerce.number().int().positive(),
  requestId:z.uuid(),
})

export function contactErrorFields(issues:ReadonlyArray<{path:ReadonlyArray<PropertyKey>}>):ContactField[] {
  return contactFieldNames.filter(name=>issues.some(issue=>issue.path[0]===name))
}

export const contactFieldMessages={
  tr:{name:'Ad soyad 2–100 karakter olmalı.',email:'Geçerli bir e-posta adresi yaz.',phone:'Telefon numarası 7–15 rakam içermeli. Yalnızca rakam, başta +, boşluk, parantez, nokta ve tire kullan.',reason:'Lütfen bir iletişim konusu seç.',message:'Mesajın baştaki ve sondaki boşluklar hariç 20–4000 karakter olmalı.'},
  en:{name:'Enter a name containing 2–100 characters.',email:'Enter a valid email address.',phone:'Use 7–15 digits. Only digits, a leading +, spaces, parentheses, periods and hyphens are allowed.',reason:'Please choose a reason for contact.',message:'Your message must contain 20–4000 characters, excluding leading and trailing spaces.'},
} satisfies Record<'tr'|'en',Record<ContactField,string>>
