/**
 * @typedef {'ACTIVE' | 'INACTIVE'} ExamPatternApiStatus
 */

/**
 * @typedef {'createdAt' | 'updatedAt' | 'instructionDescription' | 'instructionId' | 'status'} ExamPatternSortField
 */

/**
 * @typedef {'createdOn_newest' | 'createdOn_oldest' | 'modifiedOn_newest' | 'modifiedOn_oldest'} ExamPatternSortPreset
 */

/**
 * @typedef {Object} ExamPatternListParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [search]
 * @property {ExamPatternApiStatus} [status]
 * @property {ExamPatternSortField} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 * @property {ExamPatternSortPreset} [sortPreset]
 */

/**
 * @typedef {Object} ExamPatternCreatePayload
 * @property {string} instructionDescription
 * @property {ExamPatternApiStatus} [status]
 */

/**
 * @typedef {Object} ExamPatternUpdatePayload
 * @property {string} [instructionDescription]
 * @property {ExamPatternApiStatus} [status]
 */

/**
 * @typedef {Object} ExamPattern
 * @property {string} id
 * @property {string} instructionId
 * @property {string} instructionDescription
 * @property {'Active' | 'Deactivated'} status
 * @property {string | null} createdAt
 * @property {string | null} updatedAt
 */

export {}
