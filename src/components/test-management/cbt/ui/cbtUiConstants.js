import { cn } from '../../../../utils/cn'

export const CBT_PANEL_CLASS =
  'rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5'

export const CBT_TABLE_CONTAINER_CLASS = 'overflow-hidden rounded-xl border border-slate-100'

export const CBT_TABLE_SCROLL_CLASS =
  'w-full max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]'

export const CBT_TABLE_ROW_HOVER = 'hover:bg-[#eef6fc]/70'

export const CBT_TABLE_INNER_CLASS = 'rounded-none border-0 shadow-none'

export const CBT_PAGINATION_CLASS = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

export const CBT_SEARCH_INPUT_CLASS =
  'h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:cursor-not-allowed disabled:opacity-60 sm:pl-11 sm:text-base'

export const CBT_TOOLBAR_CLASS =
  'flex min-h-14 flex-wrap items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4'

export const CBT_CHART_CARD_CLASS =
  'rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)] sm:p-5'

export const CBT_STATS_GRID_CLASS = 'grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4'

export const CBT_PROGRESS_GRID_CLASS = 'grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3'
