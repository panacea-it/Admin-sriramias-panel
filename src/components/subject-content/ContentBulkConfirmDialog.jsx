import { AlertTriangle, Ban } from 'lucide-react'
import AppModalWrapper from '../ui/AppModalWrapper'
import { cn } from '../../utils/cn'

export default function ContentBulkConfirmDialog({
  open,
  type = 'delete',
  count = 0,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const isDelete = type === 'delete'
  const title = isDelete ? 'Delete Selected Items?' : 'Disable Selected Items?'
  const message = isDelete
    ? 'This action cannot be undone.'
    : 'Selected items will be disabled and hidden from students.'
  const confirmLabel = isDelete ? 'Delete' : 'Disable'
  const Icon = isDelete ? AlertTriangle : Ban

  return (
    <AppModalWrapper
      open={open}
      onClose={() => {
        if (!loading) onCancel?.()
      }}
      title={title}
      size="md"
      role="alertdialog"
      zIndex={130}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200/80 px-6 py-4 pr-14">
          <h2 className="text-lg font-bold text-[#111111] sm:text-xl">{title}</h2>
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                isDelete ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-amber-50 text-amber-600',
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold leading-relaxed text-[#111111] sm:text-[15px]">
                {count} item{count !== 1 ? 's' : ''} selected.
              </p>
              <p className="mt-1 text-sm text-slate-500">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl px-6 text-sm font-bold text-white shadow-sm transition disabled:opacity-60',
              isDelete
                ? 'bg-[#dc2626] hover:bg-[#b91c1c]'
                : 'bg-amber-600 hover:bg-amber-700',
            )}
          >
            {loading ? `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </AppModalWrapper>
  )
}
