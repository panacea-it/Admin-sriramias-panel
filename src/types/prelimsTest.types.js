/** @typedef {'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'} PublishStatus */

/**
 * @typedef {Object} PrelimsTestLanguageStat
 * @property {string} language
 * @property {number} questionCount
 * @property {{ url?: string, publicId?: string, viewUrl?: string, downloadUrl?: string }=} uploadFile
 */

/**
 * @typedef {Object} PrelimsTestRow
 * @property {string} _id
 * @property {string} prelimsTestId
 * @property {string} facultySubjectId
 * @property {string} folderId
 * @property {string[]} batchIds
 * @property {Array<{ _id: string, batchId: string, batchName: string }>} batches
 * @property {string} batchNamesLabel
 * @property {string} testName
 * @property {string[]} languages
 * @property {number} durationMinutes
 * @property {string} durationLabel
 * @property {number} totalMarks
 * @property {number} marksPerCorrectAnswer
 * @property {PublishStatus} publishStatus
 * @property {number} totalQuestions
 * @property {PrelimsTestLanguageStat[]} languageStats
 * @property {string} folderName
 * @property {string} facultySubjectName
 * @property {string} scheduleDate
 * @property {string} scheduleTime
 * @property {string} resultDate
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} PrelimsTestListParams
 * @property {string=} facultySubjectId
 * @property {string=} folderId
 * @property {string=} batchId
 * @property {string=} language
 * @property {PublishStatus=} publishStatus
 * @property {string=} search
 * @property {string=} scheduleDateFrom
 * @property {string=} scheduleDateTo
 * @property {number=} page
 * @property {number=} limit
 * @property {string=} sortBy
 * @property {'asc' | 'desc'=} sortOrder
 */

/**
 * @typedef {Object} PrelimsTestQuestion
 * @property {string} _id
 * @property {string} prelimsTestQuestionId
 * @property {string} prelimsTestId
 * @property {string} language
 * @property {number} questionNo
 * @property {string} questionText
 * @property {string} option1
 * @property {string} option2
 * @property {string} option3
 * @property {string} option4
 * @property {number} correctAnswer
 * @property {string} explanation
 * @property {'ACTIVE' | 'INACTIVE'} status
 */

export {}
