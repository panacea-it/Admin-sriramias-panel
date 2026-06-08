import { COURSE_SUBJECT_MAP } from '../data/courseSubjectMap'

/** Courses that include a given subject — classes auto-inherit here */
export function getCoursesForSubject(subjectId) {
  if (!subjectId) return []
  return COURSE_SUBJECT_MAP.filter((row) => row.subjectIds.includes(subjectId))
}

export function getCourseCountForSubject(subjectId) {
  return getCoursesForSubject(subjectId).length
}

/** All lessons visible on a course (inherited from its subjects) */
export function getInheritedLessonsForCourse(courseId, allLessons) {
  const map = COURSE_SUBJECT_MAP.find((r) => r.courseId === courseId)
  if (!map) return []
  return allLessons.filter((lesson) => map.subjectIds.includes(lesson.subjectId))
}

/** Subject IDs linked to a course */
export function getSubjectIdsForCourse(courseId) {
  return COURSE_SUBJECT_MAP.find((r) => r.courseId === courseId)?.subjectIds ?? []
}
