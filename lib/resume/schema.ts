import {z} from 'zod'

const text = z.string().max(4000).default('')
const date = z.union([z.iso.date(), z.literal('')]).default('')
const bullets = z.array(z.string().max(2000)).max(30).default([])
export const resumeDraftSchema = z.object({
  experiences: z.array(z.object({company: text, job_title_tr: text, job_title_en: text, start_date: date, end_date: date, current_position: z.boolean().default(false), bullets_tr: bullets, bullets_en: bullets})).max(50).default([]),
  education: z.array(z.object({institution: text, program: text, program_tr: text, program_en: text, start_date: date, end_date: date, description_tr: text, description_en: text})).max(30).default([]),
  volunteering: z.array(z.object({organization: text, role_tr: text, role_en: text, start_date: date, end_date: date, bullets_tr: bullets, bullets_en: bullets})).max(30).default([]),
})
export type ResumeDraft = z.infer<typeof resumeDraftSchema>
