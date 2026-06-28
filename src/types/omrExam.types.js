/** @typedef {'ACTIVE' | 'INACTIVE'} OmrExamStatus */

/**
 * @typedef {Object} OmrExamListItem
 * @property {string} _id
 * @property {string} examName
 * @property {string} examDate
 * @property {OmrExamStatus} status
 * @property {boolean} hasResultSheet
 * @property {string | null} uploadDate
 * @property {string} createdDate
 */

/**
 * @typedef {Object} OmrResultSheet
 * @property {string} fileName
 * @property {string} fileType
 * @property {number} fileSize
 * @property {string} uploadedBy
 * @property {string | null} uploadedDate
 * @property {string} downloadUrl
 */

/**
 * @typedef {OmrExamListItem & {
 *   resultSheet: OmrResultSheet | null
 *   createdAt: string
 *   updatedAt: string
 * }} OmrExamDetail
 */

/**
 * @typedef {Object} PaginatedOmrExamsResponse
 * @property {boolean} success
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 * @property {OmrExamListItem[]} data
 */

/**
 * @typedef {Object} CreateOmrExamPayload
 * @property {string} examName
 * @property {string} examDate
 * @property {OmrExamStatus} status
 */

/**
 * @typedef {Object} UpdateOmrExamPayload
 * @property {string=} examName
 * @property {string=} examDate
 * @property {OmrExamStatus=} status
 */

/**
 * @typedef {Object} ListOmrExamsParams
 * @property {number=} page
 * @property {number=} limit
 * @property {string=} search
 * @property {'ALL' | OmrExamStatus=} status
 * @property {'examName' | 'examDate' | 'createdAt' | 'uploadDate'=} sortBy
 * @property {'asc' | 'desc'=} sortOrder
 */

/**
 * @typedef {Object} SearchOmrExamsParams
 * @property {string} search
 * @property {'ALL' | OmrExamStatus=} status
 * @property {number=} page
 * @property {number=} limit
 */

export {}
