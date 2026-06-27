export const FACULTY_SUBJECT_API_BASE = '/faculty-subjects'

export const FACULTY_SUBJECT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
}

export const FACULTY_SUBJECT_STATUS_UI = {
  ACTIVE: 'Active',
  INACTIVE: 'In Active',
}

export const FACULTY_SUBJECT_CATEGORIES = [
  { value: 'LIVE_CLASS', label: 'Live Class' },
  { value: 'RECORDING', label: 'Recording' },
  { value: 'PRELIMS_TEST', label: 'Prelims Test' },
  { value: 'MAINS_ANSWER_WRITING', label: 'Mains Answer Writing' },
  { value: 'PDF', label: 'PDF' },
]

export const FACULTY_SUBJECT_SORT_FIELDS = [
  'createdAt',
  'subjectName',
  'facultySubjectId',
  'status',
]

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
export const SEARCH_DEBOUNCE_MS = 300

export const FACULTY_SUBJECT_ROUTES = {
  list: '/academics/subjects',
  content: (id) => `/academics/subjects/${encodeURIComponent(id)}/content`,
  detail: (id) => `/academics/subjects/${encodeURIComponent(id)}`,
}
