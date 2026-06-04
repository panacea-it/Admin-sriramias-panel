import { Router } from 'express'
import {
  createFollowUp,
  createLead,
  exportReport,
  getCounselors,
  getDashboard,
  getFollowUps,
  getFunnel,
  getJourney,
  getLeadById,
  getLeads,
  getPaymentFailures,
  getReportTypes,
  getSources,
  getTrackingConfig,
  trackEvent,
  updateLead,
  updateTrackingConfig,
} from '../controllers/salesAnalyticsController.js'

const router = Router()

router.get('/dashboard', getDashboard)
router.get('/leads', getLeads)
router.get('/leads/:id', getLeadById)
router.post('/leads', createLead)
router.patch('/leads/:id', updateLead)
router.post('/events', trackEvent)
router.get('/journey/:leadId', getJourney)
router.get('/funnel', getFunnel)
router.get('/sources', getSources)
router.get('/counselors', getCounselors)
router.get('/follow-ups', getFollowUps)
router.post('/follow-ups', createFollowUp)
router.get('/payment-failures', getPaymentFailures)
router.get('/tracking-config', getTrackingConfig)
router.put('/tracking-config', updateTrackingConfig)
router.get('/reports/types', getReportTypes)
router.post('/reports/export', exportReport)

export default router
