/**
 * @typedef {'ACTIVE' | 'INACTIVE' | ''} ClassSectionApiStatus
 */

/**
 * @typedef {'createdAt' | 'className' | 'status' | 'classSectionId'} ClassSectionSortField
 */

/**
 * @typedef {Object} ClassSectionListParams
 * @property {string} [search]
 * @property {ClassSectionApiStatus} [status]
 * @property {string} [subjectId]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {ClassSectionSortField} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 */

/**
 * @typedef {Object} ClassSectionCreatePayload
 * @property {string} subjectId
 * @property {string} className
 * @property {'ACTIVE' | 'INACTIVE'} [status]
 */

/**
 * @typedef {Object} ClassSectionUpdatePayload
 * @property {string} [subjectId]
 * @property {string} [className]
 * @property {'ACTIVE' | 'INACTIVE'} [status]
 */

export {}
