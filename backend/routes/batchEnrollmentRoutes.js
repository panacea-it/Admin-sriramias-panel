import { Router } from 'express'
import {
  createEnrollment,
  deleteEnrollment,
  getEnrollmentById,
  listEnrollmentsByBatch,
  moveEnrollment,
  updateEnrollment,
  updateEnrollmentStatus,
} from '../controllers/batchEnrollmentController.js'

const router = Router()

router.get('/by-batch/:batchId', listEnrollmentsByBatch)
router.patch('/status/:enrollmentId', updateEnrollmentStatus)
router.patch('/move/:enrollmentId', moveEnrollment)
router.get('/:enrollmentId', getEnrollmentById)
router.post('/', createEnrollment)
router.put('/:enrollmentId', updateEnrollment)
router.delete('/:enrollmentId', deleteEnrollment)

export default router
