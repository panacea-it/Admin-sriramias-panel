import { Download, Pencil, Trash2, UploadCloud } from 'lucide-react'
import { cn } from '../../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:text-[12px]'

function ActionButton({ label, onClick, disabled, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(actionButtonClass, className)}
    >
      {children}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

export default function OmrTableActions({
  hasResultSheet,
  canEdit,
  canDelete,
  canUploadResult,
  canDownloadResult,
  downloading = false,
  onEdit,
  onDelete,
  onUpload,
  onDownload,
}) {
  const isExamDone = hasResultSheet

  if (isExamDone) {
    return (
      <div className="flex flex-nowrap items-center justify-end gap-1.5">
        {canDownloadResult && (
          <ActionButton
            label={downloading ? 'Downloading…' : 'Download Results'}
            onClick={onDownload}
            disabled={downloading}
            className="text-[#246392] hover:bg-[#eef2fc] hover:text-[#1a3a5c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
          </ActionButton>
        )}
        {canDelete && (
          <ActionButton
            label="Delete"
            onClick={onDelete}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
          </ActionButton>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1.5">
      {canEdit && (
        <ActionButton
          label="Edit"
          onClick={onEdit}
          className="text-slate-500 hover:bg-slate-100 hover:text-[#246392]"
        >
          <Pencil className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        </ActionButton>
      )}
      {canUploadResult && (
        <ActionButton
          label="Upload"
          onClick={onUpload}
          className="text-[#246392] hover:bg-[#eef2fc] hover:text-[#1a3a5c]"
        >
          <UploadCloud className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        </ActionButton>
      )}
      {canDelete && (
        <ActionButton
          label="Delete"
          onClick={onDelete}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        </ActionButton>
      )}
    </div>
  )
}
