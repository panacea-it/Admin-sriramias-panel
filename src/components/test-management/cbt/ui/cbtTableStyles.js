import {
  ADMIN_DATA_PANEL,
  ADMIN_TABLE_CONTAINER,
  ADMIN_TABLE_PAGINATION_CLASS,
  ADMIN_TABLE_ROW_CLASS,
} from '../../../../utils/adminUiStandards'

/** CBT module uses the same panel / table shell as Center Management */
export const CBT_DATA_PANEL = ADMIN_DATA_PANEL
export const CBT_TABLE_CONTAINER = ADMIN_TABLE_CONTAINER
/** Table shell inside a card — matches Center Management wrapper */
export const CBT_TABLE_CONTAINER_INSET =
  'overflow-hidden rounded-xl border border-slate-100'
export const CBT_TABLE_SCROLL_WRAP =
  'mt-5 overflow-hidden rounded-xl border border-slate-100'
export const CBT_TABLE_PAGINATION_CLASS = ADMIN_TABLE_PAGINATION_CLASS

/** Shared header / cell classes — aligned with Center Management tables */
export const CBT_TABLE_HEADER =
  'whitespace-nowrap text-[15px] font-semibold leading-none tracking-normal'
export const CBT_TABLE_CELL = 'min-h-[60px] px-5 py-4 align-middle'
export const CBT_TABLE_CELL_LEFT = `${CBT_TABLE_CELL} text-left`
export const CBT_TABLE_CELL_CENTER = `${CBT_TABLE_CELL} whitespace-nowrap text-center`
export const CBT_TABLE_BADGE =
  'h-8 min-h-[32px] min-w-[110px] rounded-full px-4 text-sm font-semibold'

/** Default CbtAdminTable props — Center Management density & hover */
export const CBT_ADMIN_TABLE_PROPS = {
  density: 'payment',
  rowClassName: ADMIN_TABLE_ROW_CLASS,
}

/** Wide results table minimum width (no actions column) */
export const CBT_RESULTS_TABLE_MIN_WIDTH = 1520
