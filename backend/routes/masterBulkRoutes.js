import { Router } from 'express'
import { bulkUpdateMasterStatus } from '../controllers/masterBulkStatusController.js'

const router = Router()

router.patch('/:resource/bulk-status', bulkUpdateMasterStatus)

export default router
