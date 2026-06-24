import { cn } from '../../utils/cn'

export const TOP10_INACTIVE_MESSAGE = 'Only Active rankers can be added to the Top 10 list.'

/** Active rankers marked as Top 10 (UI eligibility for badge, sort, and highlight). */
export function isActiveTop10Ranker(row) {
  return row?.status === 'Active' && Boolean(row?.isTop10)
}

/** Parse numeric rank from labels like "AIR 4" for display sorting only. */
export function parseRankDisplayNumber(rank) {
  const match = String(rank || '').match(/\d+/)
  return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER
}

export function parseDisplayOrder(value) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) return null
  return parsed
}

/** Next available display order slot (1–10) for active Top 10 rankers. */
export function getNextDisplayOrder(rankers = []) {
  const used = new Set(
    rankers
      .filter((row) => isActiveTop10Ranker(row))
      .map((row) => parseDisplayOrder(row.displayOrder))
      .filter((value) => value != null),
  )

  for (let order = 1; order <= 10; order += 1) {
    if (!used.has(order)) return order
  }

  return null
}

/** Active Top 10 first (by display order), then remaining rankers by exam rank. */
export function sortRankersForDisplay(rows = []) {
  return [...rows].sort((a, b) => {
    const aTop = isActiveTop10Ranker(a)
    const bTop = isActiveTop10Ranker(b)

    if (aTop !== bTop) return aTop ? -1 : 1

    if (aTop && bTop) {
      const aOrder = parseDisplayOrder(a.displayOrder) ?? Number.MAX_SAFE_INTEGER
      const bOrder = parseDisplayOrder(b.displayOrder) ?? Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return aOrder - bOrder
    }

    return parseRankDisplayNumber(a.rank) - parseRankDisplayNumber(b.rank)
  })
}

export function getTop10RowClassName(row) {
  if (!isActiveTop10Ranker(row)) return undefined

  return cn(
    '!bg-gradient-to-r !from-amber-50 !via-amber-50/70 !to-white',
    'border-l-[3px] border-l-amber-400',
    'shadow-[inset_0_0_0_1px_rgba(251,191,36,0.2)]',
    'hover:!from-amber-100/90 hover:!via-amber-50 hover:!to-amber-50/30',
  )
}
