import { Router } from 'express'
import {
  assignMentor,
  bulkAssign,
  exportCsv,
  getFilters,
  getPaper,
  getStats,
  listPapers,
  publishPaper,
  saveDraft,
} from '../controllers/evaluationOversightController.js'

const router = Router()

router.get('/stats', getStats)
router.get('/filters', getFilters)
router.get('/papers', listPapers)
router.get('/papers/:paperId', getPaper)
router.post('/papers/:paperId/assign', assignMentor)
router.post('/assignment/bulk-assign', bulkAssign)
router.post('/papers/:paperId/draft', saveDraft)
router.post('/papers/:paperId/publish', publishPaper)
router.get('/export', exportCsv)

export default router
