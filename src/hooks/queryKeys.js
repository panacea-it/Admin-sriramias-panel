/** @typedef {import('../types/subject.types').SubjectListParams} SubjectListParams */
/** @typedef {import('../types/topic.types').TopicListParams} TopicListParams */
/** @typedef {import('../types/faculty.types').FacultyListParams} FacultyListParams */
/** @typedef {import('../types/faculty.types').FacultyDropdownParams} FacultyDropdownParams */
/** @typedef {import('../types/city.types').CityListParams} CityListParams */
/** @typedef {import('../types/classroom.types').ClassroomListParams} ClassroomListParams */
/** @typedef {import('../types/classroom.types').ClassroomDropdownParams} ClassroomDropdownParams */
/** @typedef {import('../types/classSection.types').ClassSectionListParams} ClassSectionListParams */

export const subjectKeys = {
  all: ['subjects'],
  lists: () => [...subjectKeys.all, 'list'],
  /** @param {SubjectListParams} [params] */
  list: (params) => [...subjectKeys.lists(), params ?? {}],
  details: () => [...subjectKeys.all, 'detail'],
  detail: (id) => [...subjectKeys.details(), id],
  dropdown: () => [...subjectKeys.all, 'dropdown'],
}

export const topicKeys = {
  all: ['topics'],
  lists: () => [...topicKeys.all, 'list'],
  /** @param {TopicListParams} [params] */
  list: (params) => [...topicKeys.lists(), params ?? {}],
  details: () => [...topicKeys.all, 'detail'],
  detail: (id) => [...topicKeys.details(), id],
  bySubject: (subjectId) => [...topicKeys.all, 'by-subject', subjectId],
}

export const facultyKeys = {
  all: ['faculty'],
  lists: () => [...facultyKeys.all, 'list'],
  /** @param {FacultyListParams} [params] */
  list: (params) => [...facultyKeys.lists(), params ?? {}],
  details: () => [...facultyKeys.all, 'detail'],
  detail: (id) => [...facultyKeys.details(), id],
  /** @param {FacultyDropdownParams} [params] */
  dropdown: (params) => [...facultyKeys.all, 'dropdown', params ?? {}],
}

export const cityKeys = {
  all: ['cities'],
  lists: () => [...cityKeys.all, 'list'],
  /** @param {CityListParams} [params] */
  list: (params) => [...cityKeys.lists(), params ?? {}],
  details: () => [...cityKeys.all, 'detail'],
  detail: (id) => [...cityKeys.details(), id],
  byCenter: (centerId) => [...cityKeys.all, 'by-center', centerId],
}

export const classroomKeys = {
  all: ['classrooms'],
  lists: () => [...classroomKeys.all, 'list'],
  /** @param {ClassroomListParams} [params] */
  list: (params) => [...classroomKeys.lists(), params ?? {}],
  details: () => [...classroomKeys.all, 'detail'],
  detail: (id) => [...classroomKeys.details(), id],
  /** @param {ClassroomDropdownParams} [params] */
  dropdown: (params) => [...classroomKeys.all, 'dropdown', params ?? {}],
}

export const classSectionKeys = {
  all: ['classSections'],
  lists: () => [...classSectionKeys.all, 'list'],
  /** @param {ClassSectionListParams} [params] */
  list: (params) => [...classSectionKeys.lists(), params ?? {}],
  details: () => [...classSectionKeys.all, 'detail'],
  detail: (id) => [...classSectionKeys.details(), id],
  /** @param {string} subjectId */
  dropdown: (subjectId) => [...classSectionKeys.all, 'dropdown', subjectId ?? ''],
}

export const freeResourceKeys = {
  all: ['free-resources'],
  lists: () => [...freeResourceKeys.all, 'list'],
  list: (params) => [...freeResourceKeys.lists(), params ?? {}],
  details: () => [...freeResourceKeys.all, 'detail'],
  detail: (id) => [...freeResourceKeys.details(), id],
  ncertBooks: (params) => [...freeResourceKeys.all, 'ncert-books', params ?? {}],
  previousYearPapers: (params) => [...freeResourceKeys.all, 'previous-year-papers', params ?? {}],
  mockTests: (params) => [...freeResourceKeys.all, 'mock-tests', params ?? {}],
  studyMaterials: (params) => [...freeResourceKeys.all, 'study-materials', params ?? {}],
  dropdowns: () => [...freeResourceKeys.all, 'dropdowns'],
  dropdown: (name) => [...freeResourceKeys.dropdowns(), name],
  mockTestQuestions: (mockTestId) => [...freeResourceKeys.all, 'mock-test-questions', mockTestId],
}

export const currentAffairsKeys = {
  all: ['current-affairs', 'admin'],
  lists: () => [...currentAffairsKeys.all, 'list'],
  /** @param {Record<string, unknown>} [params] */
  list: (params) => [...currentAffairsKeys.lists(), params ?? {}],
  details: () => [...currentAffairsKeys.all, 'detail'],
  detail: (id) => [...currentAffairsKeys.details(), id],
  questions: (paperId) => [...currentAffairsKeys.all, 'questions', paperId],
  mainsCategories: () => [...currentAffairsKeys.all, 'mains-categories'],
  portal: {
    all: ['current-affairs', 'portal'],
    list: (filters) => [...currentAffairsKeys.portal.all, 'list', filters ?? {}],
    filters: () => [...currentAffairsKeys.portal.all, 'filters'],
    detail: (id) => [...currentAffairsKeys.portal.all, 'detail', id],
  },
}
