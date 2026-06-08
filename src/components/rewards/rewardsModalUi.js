import { cn } from '../../utils/cn'

export const REWARDS_MODAL_FIELD_GAP = 'space-y-5'

export const rewardsModalLabelClass =
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500'

export function rewardsModalInputClass(hasError) {
  return cn(
    'w-full min-h-[44px] rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition',
    'focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/15',
    hasError ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/15' : 'border-slate-200/80',
  )
}

export function rewardsModalTextareaClass(hasError) {
  return cn(rewardsModalInputClass(hasError), 'min-h-[88px] resize-y py-3')
}

export const rewardsModalErrorClass = 'mt-1.5 text-xs font-medium text-rose-600'

export const rewardsModalHintClass = 'mt-1.5 text-xs text-slate-500'

export const rewardsModalPrimaryBtnClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60'

export const rewardsModalSecondaryBtnClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'

export const rewardsModalDangerBtnClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60'

/** Compact module tab styles (Rewards admin + student portal) */
export function rewardsTabClass(isActive) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:py-2 sm:text-[13px]',
    isActive
      ? 'bg-gradient-to-r from-[#55ace7] to-[#246392] text-white shadow-sm'
      : 'bg-white text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-50',
  )
}

export function rewardsTabNavClass() {
  return 'custom-scrollbar flex flex-wrap gap-1.5 sm:gap-2'
}
