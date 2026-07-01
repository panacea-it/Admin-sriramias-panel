import { isFrontendOnly } from '../config/appMode'
import {
  getCourses,
  getCoursesDropdown,
  postCoursesDropdown,
} from '../services/courseService'
import { loadAcademicCourses } from '../utils/academicCoursesStorage'
import { normalizeCourseCatalogDropdownOptions } from '../utils/courseDropdownApiHelpers'

const DELAY = 120

function delay(ms = DELAY) {
  return new Promise((r) => setTimeout(r, ms))
}

function mapLocalToOptions(rows) {
  return rows
    .filter((r) => r.status === 'Active')
    .map((r) => ({
      _id: r.id,
      courseId: r.courseId,
      courseName: r.name,
      label: `${r.name} - ${r.courseId}`,
    }))
    .sort((a, b) => a.courseName.localeCompare(b.courseName))
}

/** Active courses for batch creation — optionally scoped to a center. */
export async function fetchAcademicCourseOptions({ centerId, signal } = {}) {
  const resolvedCenterId = String(centerId || '').trim()

  if (isFrontendOnly) {
    await delay(80)
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const rows = mapLocalToOptions(loadAcademicCourses())
    if (!resolvedCenterId) return rows
    return rows.filter(
      (row) => !row.centerId || String(row.centerId) === resolvedCenterId,
    )
  }

  if (resolvedCenterId) {
    try {
      const data = await postCoursesDropdown({ centerId: resolvedCenterId }, { signal })
      return normalizeCourseCatalogDropdownOptions(data)
    } catch {
      try {
        const data = await getCoursesDropdown(
          { centerId: resolvedCenterId, status: 'ACTIVE', limit: 200 },
          { signal },
        )
        return normalizeCourseCatalogDropdownOptions(data)
      } catch {
        return []
      }
    }
  }

  try {
    const data = await getCoursesDropdown({ limit: 100 }, { signal })
    const options = normalizeCourseCatalogDropdownOptions(data)
    if (options.length) return options
  } catch {
    /* try list API fallback */
  }

  try {
    const data = await getCourses({ status: 'ACTIVE', limit: 200 }, { signal })
    const options = normalizeCourseCatalogDropdownOptions(data)
    if (options.length) return options
  } catch {
    /* no local fallback in API mode — avoids invalid local ids like CRS001 */
  }

  return []
}

/** No backend catalog sync endpoint — kept as a no-op for callers. */
export async function syncAcademicCoursesCatalog() {
  return undefined
}
