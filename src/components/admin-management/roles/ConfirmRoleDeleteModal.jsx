import { Trash2 } from 'lucide-react'
import AppModalWrapper from '../../ui/AppModalWrapper'

export default function ConfirmRoleDeleteModal({
  open,
  roleLabel = 'this role',
  bulkCount = 0,
  loading = false,
  onCancel,
  onConfirm,
}) {
  const isBulk = bulkCount > 0
  const title = isBulk ? `Delete ${bulkCount} roles` : 'Delete role access'
  const message = isBulk
    ? `Permanently delete ${bulkCount} selected roles? This removes each role's permission matrix. Admin accounts referencing these roles may break.`
    : `Permanently delete "${roleLabel}"? This removes the entire permission matrix. Admin accounts referencing this role may break. This cannot be undone.`

  return (
    <AppModalWrapper
      open={open}
      onClose={() => {
        if (!loading) onCancel?.()
      }}
      title={title}
      size="md"
      role="alertdialog"
      zIndex={120}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
        <div className="border-b border-slate-200/80 px-6 py-4 pr-14">
          <h2 className="text-lg font-bold text-[#111111] sm:text-xl">{title}</h2>
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"
              aria-hidden
            >
              <Trash2 className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <p className="min-w-0 pt-0.5 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              {message}
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
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </AppModalWrapper>
  )
}
