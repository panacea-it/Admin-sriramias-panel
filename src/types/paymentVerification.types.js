/**
 * @typedef {'FULL_PAYMENT' | 'EMI_PLAN' | 'DOWN_PAYMENT' | 'INSTALLMENT_PAYMENT' | 'EMI_CLOSURE_PAYMENT'} VerificationRecordType
 */

/**
 * @typedef {Object} VerificationFilterOption
 * @property {string} value
 * @property {string} label
 */

/**
 * @typedef {Object} ApiVerificationRecord
 * @property {string} _id
 * @property {string} verificationId
 * @property {string} [submissionRef]
 * @property {VerificationRecordType} [type]
 * @property {string} studentName
 * @property {string} studentCode
 * @property {string} [centerName]
 * @property {string} [courseName]
 * @property {string} [batchName]
 * @property {string} [paymentModeId]
 * @property {string} [paymentModeName]
 * @property {number} amount
 * @property {string} [paymentDate]
 * @property {string} [utrNumber]
 * @property {string} [paymentProofUrl]
 * @property {boolean} [isDuplicate]
 * @property {string | null} [duplicateLabel]
 * @property {string} verificationStatus
 * @property {string} verificationStatusLabel
 * @property {string} [financeHeadStatus]
 * @property {string} [financeHeadStatusLabel]
 * @property {string} [verifiedByName]
 * @property {string | null} [verifiedAt]
 * @property {string | null} [approvedAt]
 * @property {string | null} [rejectedAt]
 * @property {string | null} [rejectionReason]
 * @property {string | null} [rejectionReasonLabel]
 * @property {string | null} [rejectionComment]
 * @property {string | null} [reviewStartedAt]
 * @property {string | null} [escalatedAt]
 * @property {string} [remarks]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} VerificationListSummary
 * @property {number} totalCount
 * @property {number} pendingCount
 * @property {number} underReviewCount
 * @property {number} verifiedCount
 * @property {number} rejectedCount
 * @property {number} escalatedCount
 */

/**
 * @typedef {Object} VerificationListResponse
 * @property {VerificationListSummary} [summary]
 * @property {number} count
 * @property {number} totalCount
 * @property {number} page
 * @property {number} limit
 * @property {number} totalPages
 * @property {ApiVerificationRecord[]} items
 */

/**
 * @typedef {Object} VerificationFilterOptionsResponse
 * @property {VerificationFilterOption[]} verificationStatuses
 * @property {VerificationFilterOption[]} financeHeadStatuses
 * @property {VerificationFilterOption[]} rejectionReasons
 */

/**
 * @typedef {Object} PaymentModeItem
 * @property {string} paymentModeId
 * @property {string} paymentModeName
 * @property {string} [category]
 * @property {string} [icon]
 */

/**
 * @typedef {Object} VerificationListParams
 * @property {string} [search]
 * @property {string} [verificationStatus]
 * @property {string} [financeHeadStatus]
 * @property {string} [paymentModeId]
 * @property {string} [centerId]
 * @property {string} [courseId]
 * @property {string} [batchId]
 * @property {string} [dateFrom]
 * @property {string} [dateTo]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [sortBy]
 * @property {string} [sortOrder]
 */

export {}
