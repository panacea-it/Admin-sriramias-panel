import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function FormModalSubmitBar({
  isEditMode,
  onReset,
  isSubmitting = false,
  disableSubmit = false,
  disableReset = false,
  createLabel = 'Create',
  updateLabel = 'Update',
  resetLabel = 'Reset',
  loadingLabel = 'Saving...',
  className,
}) {
  const submitDisabled = isSubmitting || disableSubmit
  const resetDisabled = isSubmitting || disableReset

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-4 border-t border-slate-200/80 pt-8',
        className,
      )}
    >
      <button
        type="button"
        onClick={onReset}
        disabled={resetDisabled}
        className="min-w-[148px] rounded-full bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-10 py-3.5 text-base font-bold text-white shadow-[0_6px_18px_rgba(43,120,165,0.35)] transition hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100 disabled:hover:brightness-100"
      >
        {resetLabel}
      </button>
      <button
        type="submit"
        disabled={submitDisabled}
        aria-busy={isSubmitting}
        className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-10 py-3.5 text-base font-bold text-white shadow-[0_6px_18px_rgba(5,25,45,0.4)] transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100 disabled:hover:brightness-100"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            {loadingLabel}
          </>
        ) : isEditMode ? (
          updateLabel
        ) : (
          createLabel
        )}
      </button>
    </div>
  )
}
