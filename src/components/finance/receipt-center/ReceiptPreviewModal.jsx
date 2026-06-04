import { useState } from 'react'
import { Download, Mail, MessageCircle, Printer, Send, ZoomIn, ZoomOut, X } from 'lucide-react'
import Modal from '../../ui/Modal'
import ReceiptPreview from '../ReceiptPreview'
import FinanceTableSkeleton from '../FinanceTableSkeleton'
import { cn } from '../../../utils/cn'

export default function ReceiptPreviewModal({
  open,
  onClose,
  payment,
  loading = false,
  gstSettings = null,
  onPrint,
  onDownload,
  onResend,
  onWhatsApp,
}) {
  const [zoom, setZoom] = useState(100)

  const handleClose = () => {
    setZoom(100)
    onClose?.()
  }

  return (
    <Modal open={open} onClose={handleClose} size="full" title="Receipt preview">
      <div className="relative flex max-h-[92vh] flex-col">
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(60, z - 10))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#444] hover:bg-slate-50"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center text-xs font-semibold text-[#686868]">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(140, z + 10))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#444] hover:bg-slate-50"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#444] hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-3 text-xs font-bold text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={onResend}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#246392]/30 bg-[#eef6fc] px-3 text-xs font-semibold text-[#246392]"
            >
              <Send className="h-3.5 w-3.5" />
              Resend
            </button>
            <button
              type="button"
              onClick={onWhatsApp}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#25D366] px-3 text-xs font-semibold text-[#128C7E]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close preview"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f7] p-4">
          {loading ? (
            <FinanceTableSkeleton rows={4} columns={3} />
          ) : payment ? (
            <div
              className={cn('mx-auto origin-top transition-transform duration-200')}
              style={{ transform: `scale(${zoom / 100})`, maxWidth: zoom >= 100 ? '210mm' : '100%' }}
            >
              <ReceiptPreview
                payment={payment}
                gstSettings={gstSettings}
                onPrint={onPrint}
                onDownload={onDownload}
                onWhatsApp={onWhatsApp}
                hideActions
              />
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
