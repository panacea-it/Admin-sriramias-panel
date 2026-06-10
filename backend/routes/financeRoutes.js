import { Router } from 'express'
import { financeRbac } from '../middleware/financeRbac.js'
import {
  centerDashboard,
  centerPerformance,
  centerRanking,
  compareCentersHandler,
  overallDashboard,
} from '../controllers/financeCenterController.js'
import {
  approveOfflinePayment,
  getOfflineDailySummary,
  getOfflineNotifications,
  uploadOfflineProofHandler,
  overrideOfflineDuplicateHandler,
  updateOfflineReconciliationHandler,
  bulkResendReceiptsHandler,
  generateReceipt,
  getCompletedReceiptsHandler,
  getCommunicationLogs,
  getEmiPlans,
  getFinanceDashboard,
  getGstSettings,
  getOfflineApprovals,
  getPaymentAttemptLogs,
  getPaymentAttemptAnalytics,
  assignPaymentAttemptCounselor,
  blockPaymentAttemptDevice,
  unblockPaymentAttemptDevice,
  sendPaymentAttemptRecoveryMessage,
  getPaymentReportById,
  getPaymentReports,
  getStudentFinanceProfiles,
  getStudentFinanceProfileById,
  creditStudentWallet,
  uploadStudentFinanceDocument,
  getVerificationQueue,
  verifyPaymentHandler,
  financeHeadApproveHandler,
  rejectVerificationHandler,
  escalateVerificationHandler,
  requestVerificationReuploadHandler,
  requestVerificationClarificationHandler,
  markDuplicateValidHandler,
  getVerificationNotifications,
  previewReceiptNumberHandler,
  resendReceipt,
  sendReceiptHandler,
  sendPaymentReminder,
  updateEmiPlan,
  updateGstSettings,
  updatePaymentStatus,
  updateCompletedReceiptHandler,
} from '../controllers/financeController.js'
import {
  getCommunicationAnalytics,
  getCommunicationLogsEnriched,
  tagCommunicationCounselor,
  bulkCommunicationAction,
  getCommunicationTemplates,
  upsertCommunicationTemplate,
  deleteCommunicationTemplate,
  getCommunicationAutomationRules,
  upsertCommunicationAutomationRule,
  deleteCommunicationAutomationRule,
  toggleCommunicationAutomationRule,
  testSendCommunicationTemplate,
} from '../controllers/communicationController.js'
import {
  assignEmiCounselor,
  applyEmiSuspension,
  arrangeEmiCall,
  getEmiSettings,
  previewEmiSchedule,
  regenerateEmiSchedule,
  sendEmiReminder,
  submitEmiSettlement,
  updateEmiSettings,
} from '../controllers/emiManagementController.js'

const router = Router()

router.use('/payments', financeRbac)
router.get('/payments/overall-dashboard', overallDashboard)
router.get('/payments/center/:centerId', centerDashboard)
router.get('/payments/compare-centers', compareCentersHandler)
router.get('/payments/center-performance', centerPerformance)
router.get('/payments/center-ranking', centerRanking)

router.get('/dashboard', getFinanceDashboard)
router.get('/reports', getPaymentReports)
router.get('/reports/:id', getPaymentReportById)
router.patch('/reports/:id/status', updatePaymentStatus)
router.get('/offline-approvals', getOfflineApprovals)
router.get('/offline-approvals/summary', getOfflineDailySummary)
router.get('/offline-approvals/notifications', getOfflineNotifications)
router.post('/offline-approvals/:id/decision', approveOfflinePayment)
router.post('/offline-approvals/:id/proof', uploadOfflineProofHandler)
router.post('/offline-approvals/:id/duplicate-override', overrideOfflineDuplicateHandler)
router.patch('/offline-approvals/:id/reconciliation', updateOfflineReconciliationHandler)
router.get('/emi', getEmiPlans)
router.get('/emi/settings', getEmiSettings)
router.put('/emi/settings', updateEmiSettings)
router.post('/emi/schedule/preview', previewEmiSchedule)
router.post('/emi/reminders', sendEmiReminder)
router.post('/emi/:planId/schedule/regenerate', regenerateEmiSchedule)
router.post('/emi/:planId/assign-counselor', assignEmiCounselor)
router.post('/emi/:planId/arrange-call', arrangeEmiCall)
router.post('/emi/:planId/suspend', applyEmiSuspension)
router.post('/emi/:planId/settlement', submitEmiSettlement)
router.put('/emi/:planId', updateEmiPlan)
router.get('/profiles', getStudentFinanceProfiles)
router.get('/profiles/:studentId', getStudentFinanceProfileById)
router.post('/profiles/:studentId/wallet/credit', creditStudentWallet)
router.post('/profiles/:studentId/documents', uploadStudentFinanceDocument)
router.get('/attempts', getPaymentAttemptLogs)
router.get('/attempts/analytics', getPaymentAttemptAnalytics)
router.post('/attempts/assign-counselor', assignPaymentAttemptCounselor)
router.post('/attempts/block', blockPaymentAttemptDevice)
router.post('/attempts/unblock', unblockPaymentAttemptDevice)
router.post('/attempts/recovery-message', sendPaymentAttemptRecoveryMessage)
router.get('/communication-logs', getCommunicationLogs)
router.get('/communication-logs/enriched', getCommunicationLogsEnriched)
router.get('/communication/analytics', getCommunicationAnalytics)
router.post('/communication/bulk', bulkCommunicationAction)
router.post('/communication/:id/counselor', tagCommunicationCounselor)
router.get('/communication/templates', getCommunicationTemplates)
router.post('/communication/templates', upsertCommunicationTemplate)
router.put('/communication/templates/:id', upsertCommunicationTemplate)
router.delete('/communication/templates/:id', deleteCommunicationTemplate)
router.post('/communication/templates/test-send', testSendCommunicationTemplate)
router.get('/communication/automation', getCommunicationAutomationRules)
router.post('/communication/automation', upsertCommunicationAutomationRule)
router.put('/communication/automation/:id', upsertCommunicationAutomationRule)
router.delete('/communication/automation/:id', deleteCommunicationAutomationRule)
router.post('/communication/automation/:id/toggle', toggleCommunicationAutomationRule)
router.post('/reminders', sendPaymentReminder)
router.get('/verification', getVerificationQueue)
router.get('/verification/notifications', getVerificationNotifications)
router.post('/verification/:id/verify', verifyPaymentHandler)
router.post('/verification/:id/head-approve', financeHeadApproveHandler)
router.post('/verification/:id/approve', financeHeadApproveHandler)
router.post('/verification/:id/reject', rejectVerificationHandler)
router.post('/verification/:id/escalate', escalateVerificationHandler)
router.post('/verification/:id/reupload', requestVerificationReuploadHandler)
router.post('/verification/:id/clarification', requestVerificationClarificationHandler)
router.post('/verification/:id/mark-valid', markDuplicateValidHandler)
router.get('/gst-settings', getGstSettings)
router.put('/gst-settings', updateGstSettings)
router.get('/receipts/completed', getCompletedReceiptsHandler)
router.get('/receipts/preview-number', previewReceiptNumberHandler)
router.post('/receipts/bulk-resend', bulkResendReceiptsHandler)
router.post('/receipts/:paymentId/send', sendReceiptHandler)
router.put('/receipts/:paymentId', updateCompletedReceiptHandler)
router.post('/receipts/:paymentId/generate', generateReceipt)
router.post('/receipts/:paymentId/resend', resendReceipt)

export default router
