/** @typedef {import('./facultySubject.types').FacultyCategory} FacultyCategory */

/**
 * @typedef {Object} SubjectContentFolder
 * @property {string} _id
 * @property {string} folderId
 * @property {string} facultySubjectId
 * @property {FacultyCategory} category
 * @property {string} folderName
 * @property {string} description
 * @property {'ACTIVE' | 'INACTIVE'} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} FolderListParams
 * @property {string} facultySubjectId
 * @property {FacultyCategory=} category
 * @property {string=} search
 * @property {'ACTIVE' | 'INACTIVE'=} status
 * @property {number=} page
 * @property {number=} limit
 */

/**
 * @typedef {Object} FolderContentParams
 * @property {string} facultySubjectId
 * @property {FacultyCategory} category
 * @property {string} folderId
 * @property {number=} page
 * @property {number=} limit
 * @property {string=} sortBy
 * @property {'asc' | 'desc'=} sortOrder
 */

/**
 * @typedef {Object} FolderHasContentErrorDetails
 * @property {number=} liveClassCount
 * @property {number=} recordingCount
 * @property {number=} mainsAnswerWritingCount
 * @property {number=} subjectPdfCount
 * @property {number=} prelimsTestCount
 * @property {number=} contentCount
 */

export {}
