import { cn } from '../../../utils/cn'

/**
 * Sticky glass footer for Add/Edit Batch — same actions as FormModalSubmitBar.
 */
export default function BatchFormStickyFooter({
  isEditMode,
  onReset,
  saving = false,
  createLabel = 'Create',
  updateLabel = 'Update',
  resetLabel = 'Reset',
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 shrink-0',
        'border-t border-[#e5eaf2]/90',
        'bg-white/85 shadow-[0_-10px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl',
        'px-4 py-4 sm:px-8 sm:py-5',
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className={cn(
            'h-11 min-h-[44px] w-full rounded-full sm:w-auto sm:min-w-[148px]',
            'bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-8 text-sm font-bold text-white',
            'shadow-[0_6px_18px_rgba(43,120,165,0.3)]',
            'transition duration-200 hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100',
          )}
        >
          {resetLabel}
        </button>
        <button
          type="submit"
          disabled={saving}
          className={cn(
            'h-11 min-h-[44px] w-full rounded-full sm:w-auto sm:min-w-[148px]',
            'bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-8 text-sm font-bold text-white',
            'shadow-[0_6px_18px_rgba(5,25,45,0.35)]',
            'transition duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100',
          )}
        >
          {saving ? 'Saving…' : isEditMode ? updateLabel : createLabel}
        </button>
      </div>
    </div>
  )
}
