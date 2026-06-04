import { ACADEMIC_COURSES_INITIAL } from '../data/academicCoursesData'

const STORAGE_KEY = 'sriram_academic_courses_v1'

export function loadAcademicCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  saveAcademicCourses(ACADEMIC_COURSES_INITIAL)
  return ACADEMIC_COURSES_INITIAL
}

export function saveAcademicCourses(courses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses))
    window.dispatchEvent(new CustomEvent('academic-courses-updated', { detail: courses }))
  } catch {
    /* ignore */
  }
}

export function nextAcademicCourseId(list) {
  const max = list.reduce((m, row) => {
    const raw = row.courseId || row.id || ''
    const num = parseInt(String(raw).replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `CRS${String(max + 1).padStart(3, '0')}`
}
