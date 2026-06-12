import { Router } from 'express'
import {
  createBatch,
  duplicateBatch,
  getBatchById,
  getBatchQuickView,
  getBatchesDropdown,
  listBatches,
  updateBatch,
  updateBatchStatus,
} from '../controllers/batchController.js'
import { parseBatchBody } from '../middleware/parseBatchBody.js'

const router = Router()

router.get('/dropdown', getBatchesDropdown)
router.post('/dropdown', getBatchesDropdown)
router.get('/', listBatches)
router.post('/', parseBatchBody, createBatch)
router.get('/:batchId/quick-view', getBatchQuickView)
router.patch('/status/:batchId', updateBatchStatus)
router.post('/:batchId/duplicate', parseBatchBody, duplicateBatch)
router.get('/:batchId', getBatchById)
router.put('/:batchId', parseBatchBody, updateBatch)

export default router
