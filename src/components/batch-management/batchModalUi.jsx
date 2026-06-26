import { cn } from '../../utils/cn'

/** Standard modal shell for Academics → Batch (alias: BatchModal) */
export { default as BatchModal } from './BatchFormModalShell'

/** Shared field styles for all Academics → Batch modals */
export const batchFieldLabel =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#686868]'

export const batchInputClass = cn(
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#222]',
  'outline-none transition focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
)

export const batchInputReadonlyClass = cn(batchInputClass, 'bg-slate-50 text-[#686868]')

export const batchSelectClass = cn(
  batchInputClass,
  'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10',
)

export const batchTextareaClass = cn(batchInputClass, 'h-auto min-h-[88px] resize-y py-2.5')

export function BatchField({ label, required, children, className, htmlFor }) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={htmlFor} className={batchFieldLabel}>
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}
      {children}
    </div>
  )
}

export function BatchModalFooter({
  onCancel,
  onSubmit,
  cancelLabel = 'Cancel',
  submitLabel = 'Save',
  saving = false,
  submitDisabled = false,
  variant = 'primary',
  submitForm,
  submitType = 'button',
}) {
  const primaryClass =
    variant === 'danger'
      ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-[0_4px_14px_rgba(220,38,38,0.35)]'
      : 'bg-gradient-to-r from-[#55ace7] to-[#246392] shadow-[0_4px_12px_rgba(85,172,231,0.4)]'

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="h-11 rounded-xl border border-slate-200 px-6 text-sm font-semibold text-[#444] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cancelLabel}
      </button>
      <button
        type={submitType}
        form={submitForm}
        onClick={submitType === 'button' ? onSubmit : undefined}
        disabled={saving || submitDisabled}
        className={cn(
          'h-11 rounded-xl px-8 text-sm font-bold text-white transition',
          'hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100',
          primaryClass,
        )}
      >
        {submitLabel}
      </button>
    </div>
  )
}

export function BatchCheckboxCard({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#55ace7]/15 bg-[#f8fbff] px-3.5 py-3 transition hover:bg-[#eef6fc]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-[#246392] focus:ring-[#55ace7]/40"
      />
      <span className="text-sm font-medium text-[#333]">{label}</span>
    </label>
  )
}

export function BatchTransferOptionCheckbox({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm transition hover:border-[#55ace7]/25 hover:bg-[#fafcff]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#246392] focus:ring-[#55ace7]/40"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#222]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-[#686868]">{description}</span>
        ) : null}
      </span>
    </label>
  )
}
