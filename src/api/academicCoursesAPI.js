import { isFrontendOnly } from '../config/appMode'
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

/** Active courses from Categories → Courses for batch creation dropdown */
export async function fetchAcademicCourseOptions({ signal } = {}) {
  if (isFrontendOnly) {
    await delay(80)
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    return mapLocalToOptions(loadAcademicCourses())
  }

  try {
    const { default: api } = await import('./axiosInstance')
    const res = await api.get('/courses/dropdown', {
      params: { status: 'ACTIVE', limit: 200 },
      signal,
    })
    const options = normalizeCourseCatalogDropdownOptions(res.data)
    if (options.length) return options
  } catch {
    /* try catalog list */
  }

  try {
    const { default: api } = await import('./axiosInstance')
    const res = await api.get('/courses', {
      params: { purpose: 'catalog', status: 'ACTIVE', limit: 200 },
      signal,
    })
    const options = normalizeCourseCatalogDropdownOptions(res.data)
    if (options.length) return options
  } catch {
    /* no local fallback in API mode — avoids invalid local ids like CRS001 */
  }

  return []
}

/** Push local catalog to backend after Categories → Courses changes */
export async function syncAcademicCoursesCatalog(courses) {
  if (isFrontendOnly || !courses?.length) return
  try {
    const { default: api } = await import('./axiosInstance')
    await api.post('/courses/catalog/sync', { courses })
  } catch {
    /* non-blocking */
  }
}
