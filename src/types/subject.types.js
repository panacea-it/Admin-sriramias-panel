/**
 * @typedef {'ACTIVE' | 'INACTIVE'} SubjectStatus
 */

/**
 * @typedef {Object} Subject
 * @property {string} _id
 * @property {string} subjectId
 * @property {string} subjectName
 * @property {string} description
 * @property {SubjectStatus} status
 * @property {number} linkedTopics
 * @property {number} linkedTeachers
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} SubjectDropdownItem
 * @property {string} _id
 * @property {string} subjectId
 * @property {string} subjectName
 */

/**
 * @typedef {Object} SubjectListParams
 * @property {string} [search]
 * @property {SubjectStatus} [status]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {'createdAt' | 'subjectName' | 'subjectId' | 'status'} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 */

/**
 * @typedef {Object} CreateSubjectPayload
 * @property {string} subjectName
 * @property {string} [description]
 * @property {SubjectStatus} [status]
 */

/**
 * @typedef {Object} UpdateSubjectPayload
 * @property {string} [subjectName]
 * @property {string} [description]
 * @property {SubjectStatus} [status]
 */

export {}
