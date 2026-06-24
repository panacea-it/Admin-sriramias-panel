/**
 * @typedef {'ACTIVE' | 'INACTIVE'} TopicStatus
 */

/**
 * @typedef {Object} Topic
 * @property {string} _id
 * @property {string} topicId
 * @property {string} topicName
 * @property {string} description
 * @property {string} subject
 * @property {string} [subjectId]
 * @property {string} [subjectName]
 * @property {TopicStatus} status
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} TopicDropdownItem
 * @property {string} _id
 * @property {string} topicId
 * @property {string} topicName
 */

/**
 * @typedef {Object} TopicListParams
 * @property {string} [search]
 * @property {string} [subject]
 * @property {TopicStatus} [status]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {'createdAt' | 'topicName' | 'topicId' | 'status'} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 */

/**
 * @typedef {Object} CreateTopicPayload
 * @property {string} subjectId
 * @property {string} topicName
 * @property {string} [description]
 * @property {TopicStatus} [status]
 */

/**
 * @typedef {Object} UpdateTopicPayload
 * @property {string} [subjectId]
 * @property {string} [topicName]
 * @property {string} [description]
 * @property {TopicStatus} [status]
 */

export {}
