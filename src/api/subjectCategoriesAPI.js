import { INITIAL_SUBJECT_CATEGORIES } from '../data/subjectCategoriesData'

const SIMULATED_DELAY_MS = 280

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Async-ready subject fetch — Academics → Categories → Subject.
 * Swap implementation for GET /api/subject-categories when backend is ready.
 */
export async function fetchSubjectCategories({ status = 'Active', signal } = {}) {
  await delay(SIMULATED_DELAY_MS)
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  let rows = [...INITIAL_SUBJECT_CATEGORIES]
  if (status && status !== 'all') {
    rows = rows.filter((r) => r.status === status)
  }
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    mainCategoryId: r.mainCategoryId,
    mainCategoryName: r.mainCategoryName,
    status: r.status,
    iconLabel: r.iconLabel,
    label: `${r.mainCategoryName} — ${r.name}`,
  }))
}

export async function fetchSubjectById(id, { signal } = {}) {
  const list = await fetchSubjectCategories({ signal })
  return list.find((s) => s.id === id) ?? null
}
