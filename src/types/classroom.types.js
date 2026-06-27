/**
 * @typedef {'ACTIVE' | 'INACTIVE'} ClassroomStatus
 */

/**
 * @typedef {Object} ClassroomUsage
 * @property {number} upcoming
 * @property {number} totalBookings
 */

/**
 * @typedef {Object} Classroom
 * @property {string} _id
 * @property {string} classroomId
 * @property {string} center
 * @property {string} [centerName]
 * @property {string} city
 * @property {string} [cityAddress]
 * @property {string} classroomName
 * @property {string} classroomCode
 * @property {number} capacity
 * @property {ClassroomStatus} status
 * @property {ClassroomUsage} [usage]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} ClassroomDropdownItem
 * @property {string} _id
 * @property {string} classroomId
 * @property {string} classroomName
 * @property {string} classroomCode
 * @property {string} centerId
 * @property {number} capacity
 */

/**
 * @typedef {Object} ClassroomListParams
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [search]
 * @property {string} [center]
 * @property {string} [city]
 * @property {ClassroomStatus} [status]
 * @property {'createdAt' | 'classroomName' | 'classroomCode' | 'capacity' | 'status' | 'centerName' | 'cityAddress'} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 */

/**
 * @typedef {Object} CreateClassroomPayload
 * @property {string} center
 * @property {string} city
 * @property {string} classroomName
 * @property {string} classroomCode
 * @property {number} [capacity]
 * @property {ClassroomStatus} [status]
 */

/**
 * @typedef {Object} UpdateClassroomPayload
 * @property {string} [center]
 * @property {string} [city]
 * @property {string} [classroomName]
 * @property {string} [classroomCode]
 * @property {number} [capacity]
 * @property {ClassroomStatus} [status]
 */

/**
 * @typedef {Object} ClassroomDropdownParams
 * @property {string} [centerId]
 * @property {string} [city]
 * @property {ClassroomStatus} [status]
 */

export {}
