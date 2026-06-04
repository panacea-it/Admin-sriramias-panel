import {
  Download,
  Pencil,
  Trash2,
  UploadCloud,
  FileX2,
} from 'lucide-react'
import { cn } from '../../../utils/cn'

function ActionBtn({ label, onClick, className, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 py-1 text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:gap-1.5 sm:px-1.5 sm:text-sm',
        className,
      )}
    >
      {children}
      <span className="truncate">{label}</span>
    </button>
  )
}

export default function OmrTableActions({
  hasResultSheet,
  canEdit,
  canDelete,
  canUploadResult,
  canDownloadResult,
  canDeleteResult,
  onEdit,
  onDelete,
  onUpload,
  onDownload,
  onDeleteResult,
}) {
  return (
    <div className="grid w-full min-w-[min(100%,20rem)] max-w-[26rem] grid-cols-2 items-center gap-1 sm:grid-cols-3">
      {canEdit && (
        <ActionBtn
          label="Edit"
          onClick={onEdit}
          className="text-[#686868] hover:bg-slate-100 hover:text-[#246392]"
        >
          <Pencil className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        </ActionBtn>
      )}
      {canDelete && (
        <ActionBtn
          label="Delete"
          onClick={onDelete}
          className="text-[#c96565] hover:bg-red-50 hover:text-[#b94b4b]"
        >
          <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2.1} />
        </ActionBtn>
      )}
      {canUploadResult && (
        <ActionBtn
          label={hasResultSheet ? 'Replace' : 'Upload'}
          onClick={onUpload}
          className="text-[#246392] hover:bg-[#eef2fc]"
        >
          <UploadCloud className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        </ActionBtn>
      )}
      {canDownloadResult && hasResultSheet && (
        <ActionBtn
          label="Download"
          onClick={onDownload}
          className="text-[#246392] hover:bg-[#eef2fc]"
        >
          <Download className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        </ActionBtn>
      )}
      {canDeleteResult && hasResultSheet && (
        <ActionBtn
          label="Delete File"
          onClick={onDeleteResult}
          className="text-[#c96565] hover:bg-red-50 hover:text-[#b94b4b]"
        >
          <FileX2 className="h-4 w-4 shrink-0" strokeWidth={2.1} />
        </ActionBtn>
      )}
    </div>
  )
}
