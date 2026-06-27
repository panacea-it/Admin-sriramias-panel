import { EMPTY_FACULTY_SUBJECT_FORM } from '../validation/facultySubject.schema'
import { mapUiCategoriesToApi } from '../../../../utils/facultySubjectHelpers'

export function facultySubjectToForm(row) {
  if (!row) return { ...EMPTY_FACULTY_SUBJECT_FORM }

  const topicIds = Array.isArray(row.topicIds) && row.topicIds.length
    ? row.topicIds.map(String)
    : Array.isArray(row.topics)
      ? row.topics.map(String).filter(Boolean)
      : []

  const rawCategories = Array.isArray(row.categories) && row.categories.length
    ? row.categories
    : row.category
      ? [row.category]
      : []

  const categories = mapUiCategoriesToApi(rawCategories)

  return {
    ...EMPTY_FACULTY_SUBJECT_FORM,
    subjectName: String(row.subjectName || '').trim(),
    subject: String(row.subject || '').trim(),
    teacher: String(row.teacherId || row.teacher || '').trim(),
    topics: topicIds,
    categories,
    status: row.status === 'In Active' ? 'In Active' : 'Active',
  }
}
