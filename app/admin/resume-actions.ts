'use server'

import {z} from 'zod'
import {revalidatePath} from 'next/cache'
import {requireAdmin} from '@/lib/auth'
import {resumeDraftSchema} from '@/lib/resume/schema'
import {extractResumeDraft} from '@/lib/resume/extract'

export async function generateResumeDraft(text: string) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase yapılandırılmadı.')
  return extractResumeDraft(z.string().min(30).max(80000).parse(text))
}

export async function saveResumeDraft(input: unknown) {
  const auth = await requireAdmin()
  if (!auth) throw new Error('Supabase yapılandırılmadı.')
  const draft = resumeDraftSchema.parse(input)
  if (!draft.experiences.length && !draft.education.length && !draft.volunteering.length) throw new Error('Önce en az bir kayıt ekleyin.')
  if (draft.experiences.some(item => !item.company.trim() || !item.start_date || (!item.job_title_tr.trim() && !item.job_title_en.trim()))) throw new Error('Her deneyimde şirket, başlangıç tarihi ve en az bir dilde görev adı gereklidir.')
  if (draft.education.some(item => !item.institution.trim()) || draft.volunteering.some(item => !item.organization.trim())) throw new Error('Kurum adlarını doldurun.')
  for (const item of [...draft.experiences, ...draft.education, ...draft.volunteering]) {
    if (item.start_date && item.end_date && item.end_date < item.start_date) throw new Error('Bitiş tarihi başlangıç tarihinden önce olamaz.')
  }
  const {data, error} = await auth.supabase.rpc('import_resume_draft', {p_payload: draft})
  if (error) throw new Error('Taslaklar kaydedilemedi. 202610160005_video_and_resume.sql migration dosyasının uygulandığından emin olun.')
  revalidatePath('/admin/resume', 'layout')
  return z.object({created: z.number(), skipped: z.number()}).parse(data)
}
