import { Ban, CheckCircle2 } from 'lucide-react'
import AppModalWrapper from '../ui/AppModalWrapper'
import { cn } from '../../utils/cn'

const COPY = {
  activate: {
    title: 'Activate Record',
    message: 'Are you sure you want to activate this record?',
    confirmLabel: 'Activate',
    loadingLabel: 'Activating…',
    icon: CheckCircle2,
    iconClassName: 'bg-emerald-50 text-emerald-600',
    buttonClassName: 'bg-emerald-600 hover:bg-emerald-700',
  },
  deactivate: {
    title: 'Deactivate Record',
    message: 'Are you sure you want to deactivate this record?',
    confirmLabel: 'Deactivate',
    loadingLabel: 'Deactivating…',
    icon: Ban,
    iconClassName: 'bg-amber-50 text-amber-600',
    buttonClassName: 'bg-amber-600 hover:bg-amber-700',
  },
}

/**
 * Standard activate/deactivate confirmation dialog.
 * @param {boolean} activating - true = activate, false = deactivate
 */
export default function ConfirmStatusChangeModal({
  open,
  activating = false,
  loading = false,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel,
}) {
  const mode = activating ? 'activate' : 'deactivate'
  const config = COPY[mode]
  const Icon = config.icon

  const handleConfirm = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading || !onConfirm) return
    await onConfirm()
  }

  return (
    <AppModalWrapper
      open={open}
      onClose={() => {
        if (!loading) onCancel?.()
      }}
      title={title || config.title}
      size="md"
      role="alertdialog"
      zIndex={120}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200/80 px-6 py-4 pr-14">
          <h2 className="text-lg font-bold text-[#111111] sm:text-xl">{title || config.title}</h2>
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                config.iconClassName,
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <p className="min-w-0 pt-0.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              {message || config.message}
            </p>
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
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl px-6 text-sm font-bold text-white shadow-sm transition disabled:opacity-60',
              config.buttonClassName,
            )}
          >
            {loading ? config.loadingLabel : confirmLabel || config.confirmLabel}
          </button>
        </div>
      </div>
    </AppModalWrapper>
  )
}

/** Bulk selection copy — same terminology, plural context. */
export const BULK_STATUS_CONFIRM_COPY = {
  activate: {
    title: 'Activate Selected Records',
    message: 'Are you sure you want to activate the selected records?',
    confirmLabel: 'Activate',
    loadingLabel: 'Activating…',
  },
  deactivate: {
    title: 'Deactivate Selected Records',
    message: 'Are you sure you want to deactivate the selected records?',
    confirmLabel: 'Deactivate',
    loadingLabel: 'Deactivating…',
  },
}
