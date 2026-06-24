import { Download, UploadCloud } from 'lucide-react'
import EditButton from '../../common/EditButton'
import IconActionButton from '../../common/IconActionButton'
import { TABLE_ACTIONS_WRAP } from '../../../utils/tableColumnHelpers'

export default function OmrTableActions({
  hasResultSheet,
  canEdit,
  canDelete: _canDelete,
  canUploadResult,
  canDownloadResult,
  downloading = false,
  onEdit,
  onDelete: _onDelete,
  onUpload,
  onDownload,
}) {
  const isExamDone = hasResultSheet

  if (isExamDone) {
    return (
      <div className={TABLE_ACTIONS_WRAP}>
        {canDownloadResult && (
          <IconActionButton
            label={downloading ? 'Downloading…' : 'Download Results'}
            onClick={onDownload}
            disabled={downloading}
            className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
          >
            <Download className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
          </IconActionButton>
        )}
      </div>
    )
  }

  return (
    <div className={TABLE_ACTIONS_WRAP}>
      {canEdit && <EditButton onClick={onEdit} />}
      {canUploadResult && (
        <IconActionButton
          label="Upload"
          onClick={onUpload}
          className="text-[#246392] hover:border-[#cbeeff] hover:bg-[#eef2fc] hover:text-[#1a5276] hover:shadow-sm"
        >
          <UploadCloud className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </IconActionButton>
      )}
    </div>
  )
}
