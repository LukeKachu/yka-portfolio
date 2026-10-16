import {approveProjectTranslation, deleteProject, saveProject, translateProject, uploadAsset} from '@/app/admin/actions'
import {translationConfigured} from '@/lib/translation/server'

type Row = Record<string, unknown>

const textFields = [
  ['title_tr','Title — Turkish'], ['title_en','Title — English'],
  ['short_description_tr','Short description — Turkish'], ['short_description_en','Short description — English'],
  ['description_tr','Full description — Turkish'], ['description_en','Full description — English'],
  ['context_tr','Context — Turkish'], ['context_en','Context — English'],
  ['seo_title_tr','SEO title — Turkish'], ['seo_title_en','SEO title — English'],
  ['seo_description_tr','SEO description — Turkish'], ['seo_description_en','SEO description — English'],
]

export function ProjectForm({project, brands, workTypes, selectedWorkTypes, roles, links}: {project?: Row; brands: Row[]; workTypes: Row[]; selectedWorkTypes: string[]; roles: Row[]; links: Row[]}) {
  const linkMap = Object.fromEntries(links.map((link) => [String(link.platform), String(link.url)]))
  return (
    <div className="admin-stack">
      <form action={saveProject} className="admin-panel admin-form">
        <input type="hidden" name="_id" value={String(project?.id || '')} />
        <div className="admin-form-grid">
          <label className="admin-field"><span>Internal name</span><input name="internal_name" defaultValue={String(project?.internal_name || '')} required /></label>
          <label className="admin-field"><span>Slug</span><input name="slug" defaultValue={String(project?.slug || '')} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
          <label className="admin-field"><span>Brand</span><select name="brand_id" defaultValue={String(project?.brand_id || '')}><option value="">No brand</option>{brands.map((brand) => <option key={String(brand.id)} value={String(brand.id)}>{String(brand.name)}</option>)}</select></label>
          <label className="admin-field"><span>Project date</span><input name="project_date" type="date" defaultValue={String(project?.project_date || '').slice(0,10)} /></label>
          <label className="admin-field"><span>Live website URL</span><input name="live_url" type="url" defaultValue={String(project?.live_url || '')} /></label>
          <label className="admin-field"><span>Sort order</span><input name="sort_order" type="number" defaultValue={String(project?.sort_order || 0)} /></label>
          <label className="admin-field admin-check"><span>Featured</span><input name="featured" type="checkbox" defaultChecked={Boolean(project?.featured)} /></label>
          <label className="admin-field admin-check"><span>Published</span><input name="published" type="checkbox" defaultChecked={Boolean(project?.published)} /></label>
          <fieldset className="admin-field admin-field-wide"><legend>Work types</legend><div className="admin-checkboxes">{workTypes.map((type) => <label key={String(type.id)}><input name="work_type_ids" type="checkbox" value={String(type.id)} defaultChecked={selectedWorkTypes.includes(String(type.id))} /> {String(type.internal_name)}</label>)}</div></fieldset>
          {textFields.map(([name,label]) => <label className="admin-field admin-field-wide" key={name}><span>{label}</span><textarea name={name} rows={name.includes('description') || name.includes('context') ? 6 : 2} defaultValue={String(project?.[name] || '')} /></label>)}
          <label className="admin-field admin-field-wide"><span>Roles — Turkish (one per line)</span><textarea name="_roles_tr" rows={5} defaultValue={roles.map((role) => role.role_tr).filter(Boolean).join('\n')} /></label>
          <label className="admin-field admin-field-wide"><span>Roles — English (one per line)</span><textarea name="_roles_en" rows={5} defaultValue={roles.map((role) => role.role_en).filter(Boolean).join('\n')} /></label>
          {['youtube','instagram','tiktok','website','other'].map((platform) => <label className="admin-field" key={platform}><span>{platform === 'other' ? 'X / diğer bağlantı URL' : `${platform[0].toUpperCase()+platform.slice(1)} URL`}</span><input name={`_link_${platform}`} type="url" defaultValue={linkMap[platform] || ''} /></label>)}
        </div>
        <div className="admin-actions"><button className="admin-button" type="submit">Save project</button>{project?.id ? <button className="admin-button admin-button-danger" formAction={deleteProject}>Delete project</button> : null}</div>
      </form>
      {project?.id ? <div className="admin-panel"><h2>Kapak ve dosyalar</h2><p>Kapak yüklemek isteğe bağlıdır. X bağlantıları doğrudan resmî gömülü gönderiyi kullanır; X için kapak indirmeniz veya yüklemeniz gerekmez. Diğer proje ve videoların kapağını buradan değiştirebilirsiniz. Dikey görseller için 9:16, yatay görseller için 16:9 önerilir.</p>{[['cover_path','Video / proje kapak görseli (isteğe bağlı)','portfolio-public'],['primary_media_path','Ana medya dosyası','portfolio-public']].map(([column,label,bucket]) => <form action={uploadAsset} className="admin-upload" key={column}><input type="hidden" name="_bucket" value={bucket}/><input type="hidden" name="_table" value="projects"/><input type="hidden" name="_column" value={column}/><input type="hidden" name="_id" value={String(project.id)}/><input type="hidden" name="_returnTo" value={`/admin/projects/${project.id}`}/><label><span>{label}</span><input name="file" type="file" accept={column === 'cover_path' ? 'image/jpeg,image/png,image/webp' : undefined} required /></label><button className="admin-button" type="submit">Yükle</button></form>)}</div> : null}
      {project?.id ? <div className="admin-panel"><h2>Translation</h2><p>Manual Turkish and English editing always remains available. Generated text only fills target draft fields and never publishes.</p><div className="admin-actions">{(['tr','en'] as const).map((source) => <form action={translateProject} key={source}><input type="hidden" name="_id" value={String(project.id)}/><input type="hidden" name="_source" value={source}/><button className="admin-button" disabled={!translationConfigured} type="submit">{source.toUpperCase()} → {source === 'tr' ? 'EN' : 'TR'} taslak üret</button></form>)}</div>{!translationConfigured ? <p className="admin-notice">Automatic translation is unconfigured. Manual editing and publishing still work.</p> : null}<div className="admin-actions">{(['tr','en'] as const).map((language) => <form action={approveProjectTranslation} key={language}><input type="hidden" name="_id" value={String(project.id)}/><input type="hidden" name="_language" value={language}/><button className="admin-button" type="submit">Approve {language.toUpperCase()}</button></form>)}</div></div> : null}
    </div>
  )
}
