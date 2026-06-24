import { cn } from '../../utils/cn'
import { courseFieldShell } from '../courses/CourseFormField'

export const REWARDS_MODAL_FIELD_GAP = 'space-y-5'

/** @deprecated Use CourseFormField label styling */
export const rewardsModalLabelClass =
  'mb-2 block text-sm font-semibold text-gray-700'

export function rewardsModalInputClass(hasError) {
  return cn(
    courseFieldShell,
    hasError && 'border-red-300 focus:border-red-400 focus:ring-red-500/15',
  )
}

export function rewardsModalTextareaClass(hasError) {
  return cn(rewardsModalInputClass(hasError), 'min-h-[88px] resize-y py-3')
}

export const rewardsModalErrorClass = 'text-xs font-medium text-red-600'

export const rewardsModalHintClass = 'text-xs text-[#686868]'

export const rewardsModalPrimaryBtnClass =
  'inline-flex min-h-[44px] min-w-[148px] items-center justify-center rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-10 py-3.5 text-base font-bold text-white shadow-[0_6px_18px_rgba(5,25,45,0.4)] transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100 disabled:hover:brightness-100'

export const rewardsModalSecondaryBtnClass =
  'inline-flex min-h-[44px] min-w-[148px] items-center justify-center rounded-full bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-10 py-3.5 text-base font-bold text-white shadow-[0_6px_18px_rgba(43,120,165,0.35)] transition hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100 disabled:hover:brightness-100'

export const rewardsModalDangerBtnClass =
  'inline-flex min-h-[44px] min-w-[148px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-10 py-3.5 text-base font-bold text-white shadow-[0_6px_18px_rgba(220,38,38,0.35)] transition hover:scale-[1.02] hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100'

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
