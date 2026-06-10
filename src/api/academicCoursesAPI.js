import { isFrontendOnly } from '../config/appMode'
import { loadAcademicCourses } from '../utils/academicCoursesStorage'

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

function formatCourseOptionLabel(courseName, courseId) {
  const name = String(courseName || '').trim()
  const code = String(courseId || '').trim()
  return code ? `${name} - ${code}` : name
}

function mapApiToOptions(rows) {
  return (rows || [])
    .map((r) => ({
      _id: r._id,
      courseId: r.courseId || '',
      courseName: r.courseName,
      label: formatCourseOptionLabel(r.courseName, r.courseId),
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
    const res = await api.get('/courses/dropdown', { signal })
    const body = res.data
    const list = Array.isArray(body) ? body : body?.data ?? []
    if (list.length) return mapApiToOptions(list)
  } catch {
    /* fallback to catalog */
  }

  try {
    const { default: api } = await import('./axiosInstance')
    const res = await api.get('/courses', {
      params: { purpose: 'catalog' },
      signal,
    })
    const body = res.data
    const list = Array.isArray(body) ? body : body?.data ?? []
    if (list.length) return mapApiToOptions(list)
  } catch {
    /* fallback */
  }

  await delay(80)
  return mapLocalToOptions(loadAcademicCourses())
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
