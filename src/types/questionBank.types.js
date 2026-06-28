/**
 * @typedef {'MCQ' | 'NUMERICAL' | 'MATCH_THE_FOLLOWING' | 'ASSERTION_REASON' | 'DESCRIPTIVE'} QuestionType
 * @typedef {'PRELIMS' | 'MAINS'} QuestionCategory
 * @typedef {'ACTIVE' | 'INACTIVE'} QuestionStatus
 * @typedef {'EASY' | 'MEDIUM' | 'HARD'} QuestionDifficulty
 * @typedef {'SKIP' | 'UPLOAD_ANYWAY'} DuplicateMode
 */

/**
 * @typedef {Object} QuestionBankItem
 * @property {string} _id
 * @property {string} id
 * @property {string} questionCode
 * @property {QuestionCategory | string} category
 * @property {QuestionType | string} type
 * @property {string} subject
 * @property {string} topic
 * @property {QuestionDifficulty | string} difficulty
 * @property {string[]} tags
 * @property {QuestionStatus | string} status
 * @property {string} questionText
 * @property {string} questionPreview
 * @property {string | null} explanation
 * @property {string | null} imageUrl
 * @property {number} usageCount
 * @property {string | null} createdBy
 * @property {string | null} updatedBy
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} [optionA]
 * @property {string} [optionB]
 * @property {string} [optionC]
 * @property {string} [optionD]
 * @property {string} [correctAnswer]
 * @property {string} [numericalAnswer]
 * @property {string} [prompt]
 * @property {string} [left1]
 * @property {string} [right1]
 * @property {string} [assertion]
 * @property {string} [reason]
 * @property {{ prompt: string, pairs: { left: string, right: string }[] }} [matchData]
 * @property {Object} [content]
 */

/**
 * @typedef {Object} QuestionListFilters
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [sortBy]
 * @property {'asc' | 'desc'} [sortOrder]
 * @property {QuestionType | string} [type]
 * @property {QuestionCategory | string} [category]
 * @property {string} [subject]
 * @property {string} [topic]
 * @property {QuestionDifficulty | string} [difficulty]
 * @property {QuestionStatus | string} [status]
 * @property {string} [tags]
 * @property {string} [search]
 */

/**
 * @typedef {Object} QuestionAnalytics
 * @property {number} totalQuestions
 * @property {number} easyCount
 * @property {number} mediumHardCount
 */

/**
 * @typedef {Object} QuestionListResponse
 * @property {boolean} success
 * @property {string} [message]
 * @property {number} count
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 * @property {QuestionBankItem[]} data
 * @property {QuestionBankItem[]} items
 */

/**
 * @typedef {Object} BulkValidationResult
 * @property {number} totalRows
 * @property {number} validRows
 * @property {number} invalidRows
 * @property {number} duplicateRows
 * @property {Array<{ row: number, reason?: string, category?: string, type?: string, questionText?: string, duplicateOfRow?: number }>} duplicates
 * @property {Array<{ row?: number, field?: string, message?: string }>} errors
 * @property {boolean} canImport
 */

/**
 * @typedef {Object} BulkImportResult
 * @property {number} insertedCount
 * @property {number} duplicateCount
 * @property {number} skippedCount
 * @property {number} failedCount
 * @property {string[]} questionCodes
 * @property {Array<{ row?: number, message?: string }>} errors
 */

/**
 * @typedef {Object} EditableFieldsMeta
 * @property {QuestionType} type
 * @property {string[]} commonFields
 * @property {string[]} typeSpecificFields
 * @property {string} imageField
 * @property {string} removeImageField
 * @property {string[]} nonEditableFields
 */

export {}
