import { cn } from './cn'

/** Exam Sub Category — approved design reference for Academics → Categories */

export const CATEGORY_FILTER_BAR_SHELL =
  'rounded-2xl border border-white/80 bg-white px-3 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:px-4'

export const CATEGORY_SEARCH_INPUT_CLASS =
  'h-10 w-full min-h-[38px] rounded-xl bg-[#eef2fc] pl-11 pr-4 text-sm text-[#222] outline-none transition placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/40 sm:text-[15px]'

export const CATEGORY_FILTER_SELECT_CLASS =
  'h-10 w-full min-h-[38px] appearance-none rounded-xl border-0 bg-[#55ace7] text-sm font-semibold text-white outline-none transition hover:bg-[#4a9ad4] focus:ring-2 focus:ring-[#246392]/50'

export const CATEGORY_TABLE_SHELL =
  'min-w-0 rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80'

export const CATEGORY_TABLE_LOADING_SHELL =
  'overflow-hidden rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 sm:p-5'

export const CATEGORY_TABLE_MIN_WIDTH = 0

export const CATEGORY_TABLE_ROW_CLASS = 'hover:bg-[#eef6fc]/70'

export const CATEGORY_TABLE_INNER_CLASS = 'rounded-none border-0 shadow-none'

export const CATEGORY_TABLE_PAGINATION_CLASS = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

export const CATEGORY_COL = {
  idHeader: 'min-w-[7rem] whitespace-nowrap',
  idCell: 'min-w-[7rem] whitespace-nowrap align-middle',
  nameHeader: 'min-w-[9rem]',
  nameCell: 'min-w-[9rem] align-middle',
  textHeader: 'min-w-[9rem]',
  textCell: 'min-w-[9rem] max-w-[180px] align-middle',
  dateHeader: 'min-w-[9rem] whitespace-nowrap',
  dateCell: 'min-w-[9rem] whitespace-nowrap align-middle',
  statusHeader: 'min-w-[6.5rem] whitespace-nowrap',
  statusCell: 'min-w-[6.5rem] align-middle',
  actionsHeader: 'min-w-[220px] whitespace-nowrap pr-4 sm:pr-6',
  actionsCell: 'min-w-[220px] whitespace-nowrap align-middle pr-4 sm:pr-6',
}

/** Grid for search + N filter dropdowns (Exam Sub Category layout). */
export function categoryFilterGridClass(filterCount) {
  const grids = {
    1: 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]',
    2: 'lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]',
    3: 'lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]',
    4: 'lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]',
    5: 'lg:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))]',
  }
  return cn(
    'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:items-center',
    grids[filterCount] || grids[4],
  )
}
