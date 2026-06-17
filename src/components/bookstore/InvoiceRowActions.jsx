import { Download, Eye } from 'lucide-react'
import { cn } from '../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function InvoiceRowActions({ invoiceId, onPreview, onDownload }) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onPreview}
        title="Preview"
        aria-label={`Preview invoice ${invoiceId}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span>Preview</span>
      </button>
      <button
        type="button"
        onClick={onDownload}
        title="Download"
        aria-label={`Download invoice ${invoiceId}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span>Download</span>
      </button>
    </div>
  )
}
