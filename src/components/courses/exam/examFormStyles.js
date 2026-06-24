import { cn } from '../../../utils/cn'

export const examInputClass = cn(
  'h-12 w-full rounded-xl bg-[#d1e9f6] px-4 text-sm font-medium text-[#1a3a5c] shadow-sm outline-none',
  'placeholder:text-[#7a8a9a]',
  'focus:ring-2 focus:ring-[#55ace7]/45 focus-visible:ring-2 focus-visible:ring-[#55ace7]/45',
)

/** Stable select styling — avoids native hover/focus flicker from animated transitions */
export const examSelectClass = cn(
  examInputClass,
  'cursor-pointer appearance-none pr-10',
  'hover:bg-[#d1e9f6] active:bg-[#d1e9f6]',
)

/** Custom dropdown trigger — matches exam fields without layout shift on hover/focus */
export const examDropdownTriggerClass = cn(
  'relative flex h-12 w-full cursor-pointer items-center rounded-xl bg-[#d1e9f6] px-4 pr-10 text-left text-sm font-medium text-[#1a3a5c] outline-none',
  'hover:bg-[#d1e9f6] active:bg-[#d1e9f6]',
  'focus:ring-2 focus:ring-[#55ace7]/45 focus-visible:ring-2 focus-visible:ring-[#55ace7]/45',
  'select-none [-webkit-tap-highlight-color:transparent]',
)

export const examSectionCardClass = cn(
  'overflow-hidden rounded-2xl border border-[#e5eaf2] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]',
)

export const examPanelClass = cn(
  'rounded-2xl border border-[#cfe8f7] bg-gradient-to-b from-[#f8fbff] to-white p-1',
)
