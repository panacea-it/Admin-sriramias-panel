/** @typedef {'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'} PublishStatus */

/**
 * @typedef {Object} MainsAnswerWritingRow
 * @property {string} _id
 * @property {string} mainsAnswerWritingId
 * @property {string} facultySubjectId
 * @property {string} folderId
 * @property {string[]} batchIds
 * @property {Array<{ _id: string, batchId: string, batchName: string }>} batches
 * @property {string} batchNamesLabel
 * @property {string=} topicId
 * @property {string} topicName
 * @property {string} testName
 * @property {string} scheduleDate
 * @property {number} durationMinutes
 * @property {string} durationLabel
 * @property {number} totalMarks
 * @property {number=} passMarks
 * @property {string} resultDate
 * @property {string} questionsText
 * @property {{ url: string, publicId?: string, format?: string, bytes?: number }} pdf
 * @property {PublishStatus} publishStatus
 * @property {string} folderName
 * @property {string} facultySubjectName
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} MainsAnswerWritingListParams
 * @property {string=} facultySubjectId
 * @property {string=} folderId
 * @property {string=} batchId
 * @property {string=} topicId
 * @property {string=} topicName
 * @property {PublishStatus=} publishStatus
 * @property {string=} search
 * @property {number=} page
 * @property {number=} limit
 * @property {string=} sortBy
 * @property {'asc' | 'desc'=} sortOrder
 */

export {}
