import { Download, Eye, Trash2, UploadCloud } from 'lucide-react'
import EditButton from '../../common/EditButton'
import IconActionButton from '../../common/IconActionButton'
import { TABLE_ACTIONS_WRAP } from '../../../utils/tableColumnHelpers'

export default function OmrTableActions({
  hasResultSheet,
  canView,
  canEdit,
  canDelete,
  canUploadResult,
  canDownloadResult,
  downloading = false,
  onView,
  onEdit,
  onDelete,
  onUpload,
  onDownload,
}) {
  return (
    <div className={TABLE_ACTIONS_WRAP}>
      {canView && (
        <IconActionButton
          label="View details"
          onClick={onView}
          className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
        >
          <Eye className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionButton>
      )}
      {canEdit && <EditButton onClick={onEdit} />}
      {!hasResultSheet && canUploadResult && (
        <IconActionButton
          label="Upload result sheet"
          onClick={onUpload}
          className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
        >
          <UploadCloud className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionButton>
      )}
      {hasResultSheet && canDownloadResult && (
        <IconActionButton
          label={downloading ? 'Downloading…' : 'Download result sheet'}
          onClick={onDownload}
          disabled={downloading}
          className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
        >
          <Download className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionButton>
      )}
      {canDelete && (
        <IconActionButton
          label="Delete exam"
          onClick={onDelete}
          className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 hover:shadow-sm"
        >
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionButton>
      )}
    </div>
  )
}
