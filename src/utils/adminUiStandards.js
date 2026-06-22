import { cn } from './cn'

/** Page shell — matches Center Management layout */
export const ADMIN_PAGE_SECTION =
  'figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6'

export const ADMIN_PAGE_INNER = 'mx-auto max-w-screen-2xl space-y-5 sm:space-y-6'

/** White content card with filter toolbar + table */
export const ADMIN_DATA_PANEL =
  'rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5'

export const ADMIN_TABLE_CONTAINER = 'mt-5 overflow-hidden rounded-xl border border-slate-100'

/** Primary CTA — Create / Add buttons in page banners */
export const ADMIN_CREATE_BTN =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto sm:py-2.5'

/** Secondary action buttons — Export, Refresh, Settings */
export const ADMIN_SECONDARY_BTN =
  'inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'

/** Dark primary action — Save, Submit in toolbars */
export const ADMIN_PRIMARY_BTN =
  'inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60'

/** Settings / form card */
export const ADMIN_CARD =
  'rounded-xl border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'

/** Standard table props — matches CenterManagementTable */
export const ADMIN_TABLE_DENSITY = 'comfortable'

export const ADMIN_TABLE_ROW_CLASS = 'hover:bg-[#eef6fc]/70'

export const ADMIN_TABLE_INNER_CLASS = 'rounded-none border-0 shadow-none'

export const ADMIN_TABLE_PAGINATION_CLASS = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

/** Modal form body scroll area — matches UserFormModal */
export const ADMIN_MODAL_BODY_SCROLL = cn(
  'min-h-0 flex-1 overflow-y-auto overscroll-contain',
  'px-5 py-6 sm:px-8',
  '[scrollbar-gutter:stable]',
  '[scrollbar-width:thin]',
  '[scrollbar-color:#c5d9eb_#f4f7fb]',
)

/** Modal form shell background */
export const ADMIN_MODAL_FORM_BG = 'flex max-h-[min(90vh,760px)] flex-col overflow-hidden rounded-2xl bg-[#f0f4f8]'

/** Modal footer bar */
export const ADMIN_MODAL_FOOTER =
  'sticky bottom-0 border-t border-slate-200/80 bg-[#f0f4f8] px-5 pb-5 pt-4 sm:px-6'

/** Form section title — matches UserFormModal FormSection */
export const ADMIN_FORM_SECTION_TITLE = 'text-sm font-bold tracking-wide text-[#246392]'

export const ADMIN_FORM_SECTION_DIVIDER = 'border-b border-[#e8eef5] pb-2'

/** Standard form field spacing */
export const ADMIN_FORM_FIELD_GAP = 'space-y-5'
