import type {CrudConfig} from './types'

export const crudConfigs = {
  brands: {title: 'Brands', description: 'Reusable project brands.', table: 'brands', path: '/admin/brands', titleField: 'name', fields: [
    {name: 'name', label: 'Name', required: true}, {name: 'slug', label: 'Slug', required: true},
    {name: 'logo_path', label: 'Logo storage path'}, {name: 'website', label: 'Website', type: 'url'}, {name: 'sort_order', label: 'Sort order', type: 'number'},
  ]},
  workTypes: {title: 'Work Types', description: 'Reusable bilingual project categories.', table: 'work_types', path: '/admin/work-types', titleField: 'internal_name', fields: [
    {name: 'internal_name', label: 'Internal name', required: true}, {name: 'slug', label: 'Slug', required: true},
    {name: 'label_tr', label: 'Turkish label', required: true}, {name: 'label_en', label: 'English label', required: true}, {name: 'sort_order', label: 'Sort order', type: 'number'},
  ]},
  experience: {title: 'Experience', description: 'Employment history with shared dates and localized copy.', table: 'experiences', path: '/admin/resume/experience', titleField: 'company', fields: [
    {name: 'company', label: 'Company', required: true}, {name: 'company_url', label: 'Company URL', type: 'url'}, {name: 'employment_type', label: 'Employment type'}, {name: 'location', label: 'Location'},
    {name: 'start_date', label: 'Start date', type: 'date', required: true}, {name: 'end_date', label: 'End date', type: 'date'}, {name: 'current_position', label: 'Current position', type: 'checkbox'},
    {name: 'job_title_tr', label: 'Job title — Turkish'}, {name: 'job_title_en', label: 'Job title — English'},
    {name: 'bullets_tr', label: 'Bullets — Turkish (one per line)', type: 'textarea'}, {name: 'bullets_en', label: 'Bullets — English (one per line)', type: 'textarea'},
    {name: 'sort_order', label: 'Sort order', type: 'number'}, {name: 'published', label: 'Published', type: 'checkbox'},
  ]},
  education: {title: 'Education', description: 'Education entries.', table: 'education', path: '/admin/resume/education', titleField: 'institution', fields: [
    {name: 'institution', label: 'Institution', required: true}, {name: 'program', label: 'Shared/fallback program'},
    {name: 'program_tr', label: 'Program — Turkish'}, {name: 'program_en', label: 'Program — English'},
    {name: 'start_date', label: 'Start date', type: 'date'}, {name: 'end_date', label: 'End date', type: 'date'},
    {name: 'description_tr', label: 'Description — Turkish', type: 'textarea'}, {name: 'description_en', label: 'Description — English', type: 'textarea'},
    {name: 'sort_order', label: 'Sort order', type: 'number'}, {name: 'published', label: 'Published', type: 'checkbox'},
  ]},
  volunteering: {title: 'Volunteering', description: 'Volunteering entries.', table: 'volunteering', path: '/admin/resume/volunteering', titleField: 'organization', fields: [
    {name: 'organization', label: 'Organization', required: true}, {name: 'role_tr', label: 'Role — Turkish'}, {name: 'role_en', label: 'Role — English'},
    {name: 'start_date', label: 'Start date', type: 'date'}, {name: 'end_date', label: 'End date', type: 'date'},
    {name: 'bullets_tr', label: 'Bullets — Turkish (one per line)', type: 'textarea'}, {name: 'bullets_en', label: 'Bullets — English (one per line)', type: 'textarea'},
    {name: 'sort_order', label: 'Sort order', type: 'number'}, {name: 'published', label: 'Published', type: 'checkbox'},
  ]},
  skillGroups: {title: 'Skills', description: 'Skill groups. Individual skills are linked to these groups in the database.', table: 'skill_groups', path: '/admin/resume/skills', titleField: 'title_en', fields: [
    {name: 'title_tr', label: 'Group title — Turkish', required: true}, {name: 'title_en', label: 'Group title — English', required: true},
    {name: 'sort_order', label: 'Sort order', type: 'number'}, {name: 'published', label: 'Published', type: 'checkbox'},
  ]},
  languages: {title: 'Languages', description: 'Localized language names and proficiency levels.', table: 'languages', path: '/admin/resume/languages', titleField: 'name_en', fields: [
    {name: 'name_tr', label: 'Language — Turkish', required: true}, {name: 'name_en', label: 'Language — English', required: true},
    {name: 'proficiency_tr', label: 'Proficiency — Turkish', required: true}, {name: 'proficiency_en', label: 'Proficiency — English', required: true},
    {name: 'sort_order', label: 'Sort order', type: 'number'}, {name: 'published', label: 'Published', type: 'checkbox'},
  ]},
  about: {title: 'About', description: 'Bilingual About content.', table: 'about', path: '/admin/about', titleField: 'id', fields: [
    {name: 'content_tr', label: 'Content — Turkish', type: 'textarea'}, {name: 'content_en', label: 'Content — English', type: 'textarea'},
    {name: 'profile_image_path', label: 'Profile image storage path'}, {name: 'additional_info_tr', label: 'Additional information — Turkish', type: 'textarea'},
    {name: 'additional_info_en', label: 'Additional information — English', type: 'textarea'}, {name: 'published', label: 'Published', type: 'checkbox'},
  ]},
  settings: {title: 'Site Settings', description: 'Global identity, contact, SEO and current resume PDF.', table: 'site_settings', path: '/admin/settings', titleField: 'full_name', fields: [
    {name: 'singleton_key', label: 'Settings key', required: true}, {name: 'full_name', label: 'Full name'},
    {name: 'professional_title_tr', label: 'Professional title — Turkish'}, {name: 'professional_title_en', label: 'Professional title — English'},
    {name: 'hero_introduction_tr', label: 'Hero introduction — Turkish', type: 'textarea'}, {name: 'hero_introduction_en', label: 'Hero introduction — English', type: 'textarea'},
    {name: 'profile_photo_path', label: 'Profile photo storage path'}, {name: 'email', label: 'Email', type: 'email'}, {name: 'phone', label: 'Phone'}, {name: 'location', label: 'Location'},
    {name: 'linkedin_url', label: 'LinkedIn', type: 'url'}, {name: 'resume_pdf_path', label: 'Resume PDF storage path'},
    {name: 'seo_title_tr', label: 'SEO title — Turkish'}, {name: 'seo_title_en', label: 'SEO title — English'},
    {name: 'seo_description_tr', label: 'SEO description — Turkish', type: 'textarea'}, {name: 'seo_description_en', label: 'SEO description — English', type: 'textarea'},
    {name: 'social_image_path', label: 'Social image storage path'}, {name: 'production_site_url', label: 'Production site URL', type: 'url'},
  ]},
} satisfies Record<string, CrudConfig>
