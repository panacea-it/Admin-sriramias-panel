/**
 * @typedef {Object} MainsFacultySubjectRow
 * @property {string} subjectId
 * @property {string} [facultySubjectId]
 * @property {string} subjectName
 * @property {string} facultyName
 * @property {string} [facultySubject]
 * @property {number} totalTopics
 * @property {number} totalTests
 * @property {string | null} lastUpdated
 */

/**
 * @typedef {Object} MainsFacultySubjectsParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [search]
 * @property {'lastUpdated' | 'subjectName' | 'topicsCount'} [sort]
 */

/**
 * @typedef {Object} MainsTopicTestsParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [search]
 */

/**
 * @typedef {Object} MainsTestResultsParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [search]
 * @property {string} [status]
 */

export {}
