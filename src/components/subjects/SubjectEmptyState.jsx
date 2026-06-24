import { Layers, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function SubjectEmptyState({
  title = 'No Faculty Subjects Found',
  description,
  actionLabel,
  onAction,
  primaryActionLabel,
  onPrimaryAction,
  enhanced = false,
  className,
}) {
  if (!enhanced) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2fc]">
          <Layers className="h-7 w-7 text-[#55ace7]" strokeWidth={2} />
        </div>
        <h3 className="text-lg font-bold text-[#222]">{title}</h3>
        {description && (
          <p className="mt-2 max-w-md text-sm text-[#686868]">{description}</p>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 text-sm font-semibold text-[#246392] underline-offset-2 hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 px-6 py-16 text-center shadow-[0_8px_28px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef2fc] to-[#d1e9f6] shadow-[0_8px_24px_rgba(85,172,231,0.15)]">
        <Layers className="h-9 w-9 text-[#55ace7]" strokeWidth={1.75} />
      </div>
      <h3 className="text-xl font-bold text-[#1a3a5c]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#686868]">{description}</p>
      )}
      {primaryActionLabel && onPrimaryAction && (
        <button
          type="button"
          onClick={onPrimaryAction}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.25)] transition hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(3,4,94,0.3)] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {primaryActionLabel}
        </button>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'text-sm font-semibold text-[#246392] underline-offset-2 hover:underline',
            primaryActionLabel ? 'mt-3' : 'mt-4',
          )}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
