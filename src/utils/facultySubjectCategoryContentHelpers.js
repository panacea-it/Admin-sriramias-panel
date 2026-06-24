/** Shared helpers for POST /faculty-subjects/content/categories responses */

export function extractCategoryContentItems(data) {
  const contentBlock = data?.content
  if (Array.isArray(contentBlock?.data)) return contentBlock.data
  if (Array.isArray(data?.data)) return data.data

  const nested = data?.data
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    for (const key of ['data', 'recordings', 'liveClasses', 'items', 'results']) {
      if (Array.isArray(nested[key])) return nested[key]
    }
  }

  for (const key of ['recordings', 'liveClasses', 'items', 'results']) {
    if (Array.isArray(data?.[key])) return data[key]
  }

  if (Array.isArray(data)) return data
  return []
}

export function extractCategoryContentMeta(data) {
  const meta = data?.content ?? data?.meta ?? data?.pagination ?? data ?? {}
  return {
    total: meta.total ?? meta.totalCount ?? meta.count ?? 0,
    page: meta.page ?? meta.currentPage ?? 1,
    limit: meta.limit ?? meta.pageSize ?? 20,
    totalPages: meta.totalPages ?? meta.pages ?? 1,
  }
}
