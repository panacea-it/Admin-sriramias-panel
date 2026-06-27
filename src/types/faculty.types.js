/**
 * @typedef {'ACTIVE' | 'INACTIVE'} FacultyStatus
 */

/**
 * @typedef {Object} FacultySubjectRef
 * @property {string} _id
 * @property {string} [subjectId]
 * @property {string} [subjectName]
 */

/**
 * @typedef {Object} Faculty
 * @property {string} _id
 * @property {string} teacherId
 * @property {string} teacherName
 * @property {string} centerId
 * @property {string} centerName
 * @property {string} description
 * @property {FacultySubjectRef[]} subjects
 * @property {FacultyStatus} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} FacultyDropdownItem
 * @property {string} _id
 * @property {string} teacherId
 * @property {string} teacherName
 */

/**
 * @typedef {Object} FacultyListParams
 * @property {string} [search]
 * @property {FacultyStatus} [status]
 * @property {string} [subject]
 * @property {string} [center]
 * @property {string} [centerId]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {'createdAt' | 'teacherName' | 'teacherId' | 'status'} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 */

/**
 * @typedef {Object} FacultyDropdownParams
 * @property {string} [centerId]
 * @property {string} [subject]
 * @property {FacultyStatus} [status]
 */

/**
 * @typedef {Object} CreateFacultyPayload
 * @property {string} teacherName
 * @property {string} centerId
 * @property {string[]} subjects
 * @property {string} [description]
 * @property {FacultyStatus} [status]
 */

/**
 * @typedef {Object} UpdateFacultyPayload
 * @property {string} [teacherName]
 * @property {string} [centerId]
 * @property {string[]} [subjects]
 * @property {string} [description]
 * @property {FacultyStatus} [status]
 */

export {}
