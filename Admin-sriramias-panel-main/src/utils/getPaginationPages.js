/**
 * Builds page numbers with ellipsis for table pagination UI.
 * @returns {(number|string)[]} e.g. [1, '…', 4, 5, 6, '…', 20]
 */
export function getPaginationPages(currentPage, totalPages) {
  if (totalPages <= 0) return []
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const delta = 1
  const pages = []

  for (let i = 1; i <= totalPages; i += 1) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i)
    }
  }

  const withEllipsis = []
  let previous = null

  for (const page of pages) {
    if (previous !== null && page - previous > 1) {
      withEllipsis.push('…')
    }
    withEllipsis.push(page)
    previous = page
  }

  return withEllipsis
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
