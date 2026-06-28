/**
 * @typedef {'ACTIVE' | 'INACTIVE'} TestConfigLanguageApiStatus
 */

/**
 * @typedef {'createdAt' | 'updatedAt' | 'languageName' | 'languageId' | 'status'} TestConfigLanguageSortField
 */

/**
 * @typedef {
 *   | 'createdOn_newest'
 *   | 'createdOn_oldest'
 *   | 'modifiedOn_newest'
 *   | 'modifiedOn_oldest'
 *   | 'languageName_az'
 *   | 'languageName_za'
 * } TestConfigLanguageSortPreset
 */

/**
 * @typedef {Object} TestConfigLanguageListParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [search]
 * @property {TestConfigLanguageApiStatus} [status]
 * @property {TestConfigLanguageSortField} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 * @property {TestConfigLanguageSortPreset} [sortPreset]
 */

/**
 * @typedef {Object} TestConfigLanguageCreatePayload
 * @property {string} languageName
 * @property {TestConfigLanguageApiStatus} [status]
 */

/**
 * @typedef {Object} TestConfigLanguageUpdatePayload
 * @property {string} [languageName]
 * @property {TestConfigLanguageApiStatus} [status]
 */

/**
 * @typedef {Object} TestConfigLanguage
 * @property {string} id
 * @property {string} languageId
 * @property {string} languageName
 * @property {'Active' | 'Deactivated'} status
 * @property {string | null} createdAt
 * @property {string | null} updatedAt
 * @property {string} createdOn
 * @property {string} modifiedOn
 */

export {}
