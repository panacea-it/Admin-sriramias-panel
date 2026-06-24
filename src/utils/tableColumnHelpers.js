import { cn } from './cn'

/** Text columns that should truncate inside fixed table layouts. */
export const OVERFLOW_CELL = 'min-w-0 max-w-0 overflow-hidden align-middle'

/** Badge/chip columns — allow wrapping; do not use max-w-0. */
export const CHIP_CELL = 'min-w-0 align-middle'

/** Flex wrapper for icon-only row action buttons. */
export const TABLE_ACTIONS_WRAP =
  'flex w-full flex-nowrap items-center justify-end gap-1.5'

/** Use when the actions column is center-aligned (single icon). */
export const TABLE_ACTIONS_WRAP_CENTER =
  'flex w-full flex-nowrap items-center justify-center gap-1.5'

const ICON_SIZE = 36
const ICON_GAP = 6
const CELL_PADDING = 28

/** Pixel width for N icon-only action buttons (36×36 + gaps + padding). */
export function actionsColumnWidth(buttonCount = 3) {
  const count = Math.max(1, buttonCount)
  return count * ICON_SIZE + Math.max(0, count - 1) * ICON_GAP + CELL_PADDING
}

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const EDGE_PAD = {
  left: 'pl-4 sm:pl-6',
  center: 'px-2 sm:px-3',
  right: 'pr-4 sm:pr-6',
}

/**
 * Standard actions column for icon-only toolbars (View / Edit / Activate / …).
 * @param {object} opts
 * @param {number} [opts.buttonCount=3]
 * @param {'left'|'center'|'right'} [opts.align='right']
 */
export function createActionsColumn({
  render,
  buttonCount = 3,
  label = 'Actions',
  align = 'right',
  width: widthOverride,
} = {}) {
  const width = widthOverride ?? actionsColumnWidth(buttonCount)
  const alignClass = ALIGN_CLASS[align] || ALIGN_CLASS.right
  const edgePad = EDGE_PAD[align] || EDGE_PAD.right

  return {
    key: 'actions',
    label,
    width,
    align,
    headerTruncate: false,
    headerClassName: cn('whitespace-nowrap align-middle', edgePad, alignClass),
    cellClassName: cn('whitespace-nowrap align-middle', edgePad, alignClass),
    render,
  }
}
