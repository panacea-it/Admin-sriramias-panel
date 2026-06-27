/**
 * @typedef {'ACTIVE' | 'INACTIVE'} CityStatus
 */

/**
 * @typedef {Object} City
 * @property {string} _id
 * @property {string} centerId
 * @property {string} centerName
 * @property {string} cityAddress
 * @property {CityStatus} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} CityDropdownItem
 * @property {string} _id
 * @property {string} centerId
 * @property {string} cityAddress
 * @property {string} cityName
 */

/**
 * @typedef {Object} CityListParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [search]
 * @property {string} [center]
 * @property {CityStatus} [status]
 * @property {'createdAt' | 'cityAddress' | 'status' | 'centerName'} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 */

/**
 * @typedef {Object} CreateCityPayload
 * @property {string} centerId
 * @property {string} cityAddress
 * @property {CityStatus} [status]
 */

/**
 * @typedef {Object} UpdateCityPayload
 * @property {string} [centerId]
 * @property {string} [cityAddress]
 * @property {CityStatus} [status]
 */

export {}
