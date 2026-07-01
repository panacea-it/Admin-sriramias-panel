/**
 * EMI Management — API types
 * Contract: docs/EMI_MANAGEMENT_FRONTEND_API_GUIDE.md
 */

/**
 * @typedef {Object} EmiFilterOption
 * @property {string} value
 * @property {string} label
 */

/**
 * @typedef {Object} EmiCourseOption
 * @property {string} _id
 * @property {string} courseName
 */

/**
 * @typedef {Object} EmiCounselorOption
 * @property {string} _id
 * @property {string} [employeeId]
 * @property {string} name
 * @property {string} [fullName]
 * @property {string} [officialEmail]
 */

/**
 * @typedef {Object} EmiPaymentModeOption
 * @property {string} _id
 * @property {string} paymentModeId
 * @property {string} paymentModeName
 */

/**
 * @typedef {Object} EmiFilterOptionsResponse
 * @property {EmiCourseOption[]} courses
 * @property {EmiFilterOption[]} emiStatuses
 * @property {EmiCounselorOption[]} counselors
 * @property {EmiFilterOption[]} months
 * @property {EmiPaymentModeOption[]} paymentModes
 */

/**
 * @typedef {Object} EmiDashboardCards
 * @property {number} totalEmiStudents
 * @property {number} activeEmiPlans
 * @property {number} pendingEmiCollection
 * @property {number} overdueEmi
 * @property {number} emiCollectedThisMonth
 * @property {number} totalEmiRevenue
 */

/**
 * @typedef {Object} EmiCenterTab
 * @property {string | null} _id
 * @property {string} centerName
 * @property {string} [city]
 * @property {string} label
 */

/**
 * @typedef {Object} EmiAutomationReminderRow
 * @property {string} emiPlanId
 * @property {string} installmentId
 * @property {string} studentName
 * @property {string} [studentId]
 * @property {string} [courseName]
 * @property {string} city
 * @property {string} dueDate
 * @property {number} emiAmount
 * @property {number} [pendingAmount]
 * @property {number} daysRemaining
 * @property {string} reminderStatus
 * @property {boolean} canResend
 */

/**
 * @typedef {Object} EmiStudentRow
 * @property {string} emiPlanId
 * @property {string} emiPlanRef
 * @property {string} studentId
 * @property {string} studentName
 * @property {string} [mobileNumber]
 * @property {string} [email]
 * @property {string} city
 * @property {string} [courseId]
 * @property {string} courseName
 * @property {string} [batchId]
 * @property {string} emiPlanSummary
 * @property {number} emiAmount
 * @property {number} installmentsPaid
 * @property {number} remainingInstallments
 * @property {string | null} nextDueDate
 * @property {number} pendingAmount
 * @property {string} emiStatus
 * @property {string} emiStatusLabel
 * @property {string | null} [assignedCounselor]
 * @property {string} assignedCounselorName
 * @property {string | null} [counselorPriority]
 */

/**
 * @typedef {Object} EmiPaginatedSection
 * @property {number} page
 * @property {number} limit
 * @property {number} total
 * @property {number} totalPages
 * @property {Array} items
 */

/**
 * @typedef {Object} EmiDashboardResponse
 * @property {string | null} selectedCenterId
 * @property {EmiCenterTab[]} centers
 * @property {EmiDashboardCards} cards
 * @property {EmiPaginatedSection & { items: EmiAutomationReminderRow[] }} automationReminders
 * @property {EmiPaginatedSection & { items: EmiStudentRow[] }} emiStudents
 */

/**
 * @typedef {Object} EmiInstallmentRow
 * @property {string} _id
 * @property {number} installmentNo
 * @property {string} emiMonth
 * @property {string} dueDate
 * @property {number} amount
 * @property {number} paidAmount
 * @property {number} remainingBalance
 * @property {string} status
 * @property {string} statusLabel
 * @property {string | null} [paymentModeId]
 * @property {string} [paymentModeName]
 * @property {string} [receiptNumber]
 * @property {string} [utrNumber]
 * @property {string} [paymentProofUrl]
 * @property {boolean} [hasProof]
 * @property {string | null} [paidDate]
 * @property {string} [remarks]
 * @property {number} [lateFee]
 * @property {number} [discount]
 * @property {number} [customCharge]
 */

/**
 * @typedef {Object} EmiDetailsResponse
 * @property {string} emiPlanId
 * @property {string} emiPlanRef
 * @property {Object} student
 * @property {number} amountPaid
 * @property {number} pendingAmount
 * @property {number} overdueAmount
 * @property {string | null} nextDueDate
 * @property {number} totalFee
 * @property {string} emiPlanSummary
 * @property {string} emiStatus
 * @property {string} emiStatusLabel
 * @property {string} [assignedCounselor]
 * @property {string} assignedCounselorName
 * @property {string} [courseName]
 * @property {string} [batchName]
 * @property {string} [centerName]
 * @property {Object} schedule
 * @property {EmiInstallmentRow[]} installmentSchedule
 * @property {Array} paymentHistory
 */

export {}
