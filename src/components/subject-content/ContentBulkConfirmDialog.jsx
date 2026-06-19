import { Ban } from 'lucide-react'
import AppModalWrapper from '../ui/AppModalWrapper'
import { cn } from '../../utils/cn'
import { BULK_STATUS_CONFIRM_COPY } from '../common/ConfirmStatusChangeModal'

export default function ContentBulkConfirmDialog({
  open,
  type = 'deactivate',
  count = 0,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (type === 'delete') return null

  const config = BULK_STATUS_CONFIRM_COPY.deactivate
  const Icon = Ban

  return (
    <AppModalWrapper
      open={open}
      onClose={() => {
        if (!loading) onCancel?.()
      }}
      title={config.title}
      size="md"
      role="alertdialog"
      zIndex={130}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200/80 px-6 py-4 pr-14">
          <h2 className="text-lg font-bold text-[#111111] sm:text-xl">{config.title}</h2>
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600',
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold leading-relaxed text-[#111111] sm:text-[15px]">
                {count} item{count !== 1 ? 's' : ''} selected.
              </p>
              <p className="mt-1 text-sm text-slate-500">{config.message}</p>
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
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl bg-amber-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? 'Deactivating…' : config.confirmLabel}
          </button>
        </div>
      </div>
    </AppModalWrapper>
  )
}
