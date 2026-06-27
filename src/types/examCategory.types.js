/**
 * @typedef {'ACTIVE' | 'INACTIVE'} ExamCategoryStatus
 */

/**
 * @typedef {Object} ExamCategory
 * @property {string} _id
 * @property {string} categoryId
 * @property {string} categoryName
 * @property {string} centerId
 * @property {string} [centerName]
 * @property {string} programId
 * @property {string} [programName]
 * @property {ExamCategoryStatus} status
 * @property {number} linkedSubCategories
 * @property {number} linkedCourses
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} ExamCategoryDropdownItem
 * @property {string} _id
 * @property {string} categoryId
 * @property {string} categoryName
 */

/**
 * @typedef {Object} ExamCategoryListParams
 * @property {string} [search]
 * @property {string} [center]
 * @property {string} [program]
 * @property {ExamCategoryStatus} [status]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 */

/**
 * @typedef {Object} CreateExamCategoryPayload
 * @property {string} centerId
 * @property {string} programId
 * @property {string} categoryName
 * @property {ExamCategoryStatus} [status]
 */

/**
 * @typedef {Object} UpdateExamCategoryPayload
 * @property {string} [centerId]
 * @property {string} [programId]
 * @property {string} [categoryName]
 * @property {ExamCategoryStatus} [status]
 */

/**
 * @typedef {Object} ExamCategoryFilterParams
 * @property {string} centerId
 * @property {string} programId
 */

export {}
