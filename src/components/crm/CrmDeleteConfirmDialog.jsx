import { AlertTriangle } from 'lucide-react'
import AppModalWrapper from '../ui/AppModalWrapper'
import { cn } from '../../utils/cn'

export default function CrmDeleteConfirmDialog({ open, onConfirm, onCancel, loading = false }) {
  const handleConfirm = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (loading || !onConfirm) return
    onConfirm()
  }

  return (
    <AppModalWrapper
      open={open}
      onClose={() => {
        if (!loading) onCancel?.()
      }}
      title="Delete Confirmation"
      size="md"
      role="alertdialog"
      zIndex={120}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200/80 px-6 py-4 pr-14">
          <h2 className="text-lg font-bold text-[#111111] sm:text-xl">Delete Confirmation</h2>
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fef2f2] text-[#dc2626]"
              aria-hidden
            >
              <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <p className="min-w-0 pt-0.5 text-sm font-semibold leading-relaxed text-[#111111] whitespace-pre-line sm:text-[15px]">
              {`Are you sure you want to delete this record?\nThis action cannot be undone.`}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={cn(
              'inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 disabled:opacity-60',
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl bg-[#dc2626] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/40 disabled:opacity-60',
            )}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </AppModalWrapper>
  )
}
