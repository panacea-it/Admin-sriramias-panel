/** @typedef {import('../types/subject.types').SubjectListParams} SubjectListParams */
/** @typedef {import('../types/topic.types').TopicListParams} TopicListParams */
/** @typedef {import('../types/faculty.types').FacultyListParams} FacultyListParams */
/** @typedef {import('../types/faculty.types').FacultyDropdownParams} FacultyDropdownParams */
/** @typedef {import('../types/city.types').CityListParams} CityListParams */
/** @typedef {import('../types/classroom.types').ClassroomListParams} ClassroomListParams */
/** @typedef {import('../types/classroom.types').ClassroomDropdownParams} ClassroomDropdownParams */
/** @typedef {import('../types/classSection.types').ClassSectionListParams} ClassSectionListParams */
/** @typedef {import('../types/examPattern.types').ExamPatternListParams} ExamPatternListParams */
/** @typedef {import('../types/testConfigSection.types').TestConfigSectionListParams} TestConfigSectionListParams */
/** @typedef {import('../types/testConfigLanguage.types').TestConfigLanguageListParams} TestConfigLanguageListParams */

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

export const facultySubjectKeys = {
  all: ['faculty-subjects'],
  lists: () => [...facultySubjectKeys.all, 'list'],
  /** @param {Record<string, unknown>} [params] */
  list: (params) => [...facultySubjectKeys.lists(), params ?? {}],
  details: () => [...facultySubjectKeys.all, 'detail'],
  detail: (id) => [...facultySubjectKeys.details(), id],
  categories: () => [...facultySubjectKeys.all, 'categories'],
  createForm: (subjectId, centerId) =>
    [...facultySubjectKeys.all, 'create-form', { subjectId: subjectId ?? '', centerId: centerId ?? '' }],
  /** @param {Record<string, unknown>} [params] */
  dropdown: (params) => [...facultySubjectKeys.all, 'dropdown', params ?? {}],
  contentTree: (id) => [...facultySubjectKeys.all, 'contentTree', id],
  /** @param {Record<string, unknown>} [payload] */
  contentCategories: (payload) => [...facultySubjectKeys.all, 'contentCategories', payload ?? {}],
}

export const batchDropdownKeys = {
  all: ['batches', 'dropdown'],
  scoped: (facultySubjectId, centerId) =>
    [...batchDropdownKeys.all, String(facultySubjectId || ''), String(centerId || '')],
}

export const folderKeys = {
  all: ['subjectContentFolders'],
  lists: () => [...folderKeys.all, 'list'],
  /** @param {Record<string, unknown>} [params] */
  list: (params) => [...folderKeys.lists(), params ?? {}],
  details: () => [...folderKeys.all, 'detail'],
  detail: (id) => [...folderKeys.details(), id],
  /** @param {Record<string, unknown>} [params] */
  content: (params) => [...folderKeys.all, 'content', params ?? {}],
  summary: (id) => [...folderKeys.all, 'summary', id],
}

export const examPatternKeys = {
  all: ['examPatterns'],
  lists: () => [...examPatternKeys.all, 'list'],
  /** @param {ExamPatternListParams} [params] */
  list: (params) => [...examPatternKeys.lists(), params ?? {}],
  details: () => [...examPatternKeys.all, 'detail'],
  detail: (id) => [...examPatternKeys.details(), id],
  dropdown: () => [...examPatternKeys.all, 'dropdown'],
}

export const testConfigSectionKeys = {
  all: ['testConfigSections'],
  lists: () => [...testConfigSectionKeys.all, 'list'],
  /** @param {TestConfigSectionListParams} [params] */
  list: (params) => [...testConfigSectionKeys.lists(), params ?? {}],
  details: () => [...testConfigSectionKeys.all, 'detail'],
  detail: (id) => [...testConfigSectionKeys.details(), id],
  dropdown: () => [...testConfigSectionKeys.all, 'dropdown'],
}

export const testConfigLanguageKeys = {
  all: ['testConfigLanguages'],
  lists: () => [...testConfigLanguageKeys.all, 'list'],
  /** @param {TestConfigLanguageListParams} [params] */
  list: (params) => [...testConfigLanguageKeys.lists(), params ?? {}],
  details: () => [...testConfigLanguageKeys.all, 'detail'],
  detail: (id) => [...testConfigLanguageKeys.details(), id],
  dropdown: () => [...testConfigLanguageKeys.all, 'dropdown'],
}

export const prelimsTestKeys = {
  all: ['prelimsTests'],
  lists: () => [...prelimsTestKeys.all, 'list'],
  /** @param {Record<string, unknown>} [filters] */
  list: (filters) => [...prelimsTestKeys.lists(), filters ?? {}],
  details: () => [...prelimsTestKeys.all, 'detail'],
  detail: (id) => [...prelimsTestKeys.details(), id],
  createForm: (facultySubjectId, folderId) =>
    [...prelimsTestKeys.all, 'createForm', facultySubjectId ?? '', folderId ?? ''],
  /** @param {Record<string, unknown>} [filters] */
  dashboard: (filters) => [...prelimsTestKeys.all, 'dashboard', filters ?? {}],
  questions: (testId, filters) =>
    [...prelimsTestKeys.all, 'questions', testId ?? '', filters ?? {}],
}

export const mainsAnswerWritingKeys = {
  all: ['mainsAnswerWriting'],
  lists: () => [...mainsAnswerWritingKeys.all, 'list'],
  /** @param {Record<string, unknown>} [filters] */
  list: (filters) => [...mainsAnswerWritingKeys.lists(), filters ?? {}],
  details: () => [...mainsAnswerWritingKeys.all, 'detail'],
  detail: (id) => [...mainsAnswerWritingKeys.details(), id],
  createForm: (facultySubjectId) =>
    [...mainsAnswerWritingKeys.all, 'createForm', facultySubjectId ?? ''],
  /** @param {Record<string, unknown>} [filters] */
  dashboard: (filters) => [...mainsAnswerWritingKeys.all, 'dashboard', filters ?? {}],
  topicsDropdown: (facultySubjectId) =>
    [...mainsAnswerWritingKeys.all, 'topicsDropdown', facultySubjectId ?? ''],
}

export const subjectPdfKeys = {
  all: ['subjectPdfs'],
  lists: () => [...subjectPdfKeys.all, 'list'],
  /** @param {Record<string, unknown>} [filters] */
  list: (filters) => [...subjectPdfKeys.lists(), filters ?? {}],
  details: () => [...subjectPdfKeys.all, 'detail'],
  detail: (id) => [...subjectPdfKeys.details(), id],
  createForm: (facultySubjectId) =>
    [...subjectPdfKeys.all, 'createForm', facultySubjectId ?? ''],
  /** @param {Record<string, unknown>} [filters] */
  dashboard: (filters) => [...subjectPdfKeys.all, 'dashboard', filters ?? {}],
}

export const mainsManagementKeys = {
  all: ['mains-management'],
  dashboard: (progressLimit = 5) => [...mainsManagementKeys.all, 'dashboard', progressLimit],
  facultySubjects: (params) => [...mainsManagementKeys.all, 'faculty-subjects', params ?? {}],
  facultySubject: (id) => [...mainsManagementKeys.all, 'faculty-subject', id ?? ''],
  topicTests: (topicId, params) =>
    [...mainsManagementKeys.all, 'topic-tests', topicId ?? '', params ?? {}],
  testResults: (testId, params) =>
    [...mainsManagementKeys.all, 'test-results', testId ?? '', params ?? {}],
}

export const omrExamKeys = {
  all: ['omr-exams'],
  lists: () => [...omrExamKeys.all, 'list'],
  /** @param {import('../types/omrExam.types').ListOmrExamsParams} [params] */
  list: (params) => [...omrExamKeys.lists(), params ?? {}],
  searches: () => [...omrExamKeys.all, 'search'],
  /** @param {import('../types/omrExam.types').SearchOmrExamsParams} [params] */
  search: (params) => [...omrExamKeys.searches(), params ?? {}],
  details: () => [...omrExamKeys.all, 'detail'],
  detail: (id) => [...omrExamKeys.details(), id],
}

export { questionBankKeys } from './questionBank/queryKeys'

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
