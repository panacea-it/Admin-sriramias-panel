/** @typedef {'LIVE_CLASS' | 'RECORDING' | 'PRELIMS_TEST' | 'MAINS_ANSWER_WRITING' | 'PDF'} FacultyCategory */

/**
 * @typedef {Object} FacultySubject
 * @property {string} _id
 * @property {string} facultySubjectId
 * @property {string} subjectName
 * @property {string} subject
 * @property {string} teacher
 * @property {{ _id: string, teacherId: string, teacherName: string, centerId: string }=} teacherDetails
 * @property {Array<{ _id: string, topicId: string, topicName: string }>} topics
 * @property {FacultyCategory[]} categories
 * @property {'ACTIVE' | 'INACTIVE'} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} FacultySubjectListParams
 * @property {string=} search
 * @property {string=} q
 * @property {'ACTIVE' | 'INACTIVE'=} status
 * @property {FacultyCategory=} category
 * @property {number=} page
 * @property {number=} limit
 * @property {'createdAt' | 'subjectName' | 'facultySubjectId' | 'status'=} sortBy
 * @property {'asc' | 'desc'=} sortOrder
 */

export {}
