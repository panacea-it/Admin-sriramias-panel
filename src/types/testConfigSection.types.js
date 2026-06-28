/**
 * @typedef {'ACTIVE' | 'INACTIVE'} TestConfigSectionApiStatus
 */

/**
 * @typedef {'createdAt' | 'updatedAt' | 'sectionName' | 'sectionId' | 'status'} TestConfigSectionSortField
 */

/**
 * @typedef {
 *   | 'createdOn_newest'
 *   | 'createdOn_oldest'
 *   | 'modifiedOn_newest'
 *   | 'modifiedOn_oldest'
 *   | 'sectionName_az'
 *   | 'sectionName_za'
 * } TestConfigSectionSortPreset
 */

/**
 * @typedef {Object} TestConfigSectionListParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [search]
 * @property {TestConfigSectionApiStatus} [status]
 * @property {TestConfigSectionSortField} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 * @property {TestConfigSectionSortPreset} [sortPreset]
 */

/**
 * @typedef {Object} TestConfigSectionCreatePayload
 * @property {string} sectionName
 * @property {TestConfigSectionApiStatus} [status]
 */

/**
 * @typedef {Object} TestConfigSectionUpdatePayload
 * @property {string} [sectionName]
 * @property {TestConfigSectionApiStatus} [status]
 */

/**
 * @typedef {Object} TestConfigSection
 * @property {string} id
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {'Active' | 'Deactivated'} status
 * @property {string | null} createdAt
 * @property {string | null} updatedAt
 * @property {string} createdOn
 * @property {string} modifiedOn
 */

export {}
