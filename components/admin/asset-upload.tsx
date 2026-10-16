import {uploadAsset} from '@/app/admin/actions'

export function AssetUpload({bucket, table, column, id, returnTo, label, accept}: {bucket: string; table: string; column: string; id: string; returnTo: string; label: string; accept?: string}) {
  return <form action={uploadAsset} className="admin-upload"><input type="hidden" name="_bucket" value={bucket}/><input type="hidden" name="_table" value={table}/><input type="hidden" name="_column" value={column}/><input type="hidden" name="_id" value={id}/><input type="hidden" name="_returnTo" value={returnTo}/><label><span>{label}</span><input name="file" type="file" accept={accept} required /></label><button className="admin-button" type="submit">Upload / replace</button></form>
}
