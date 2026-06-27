import { AlertTriangle, Info, Loader2 } from 'lucide-react'
import AppModalWrapper from '../ui/AppModalWrapper'
import { cn } from '../../utils/cn'

const VARIANTS = {
  primary: {
    icon: Info,
    iconClassName: 'bg-[#eef6fc] text-[#246392]',
    buttonClassName:
      'bg-gradient-to-r from-[#0d3b66] to-[#05192d] hover:brightness-110',
  },
  danger: {
    icon: AlertTriangle,
    iconClassName: 'bg-rose-50 text-rose-600',
    buttonClassName: 'bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95',
  },
}

/**
 * Standard confirmation dialog — consistent with admin panel modals.
 */
export default function AdminConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  loadingLabel = 'Please wait…',
  errorMessage = '',
  variant = 'primary',
  size = 'md',
}) {
  const config = VARIANTS[variant] || VARIANTS.primary
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
        if (!loading) onClose?.()
      }}
      title={title}
      size={size}
      role="alertdialog"
      zIndex={120}
      showCloseButton={false}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
        <div className="rounded-t-xl bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
        </div>

        <div className="px-5 py-5 sm:px-8 sm:py-6">
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
            {description ? (
              <p className="min-w-0 pt-0.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
          {errorMessage ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200/80 bg-[#fafbfc] px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-sm transition disabled:opacity-60',
              config.buttonClassName,
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {loadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </AppModalWrapper>
  )
}
