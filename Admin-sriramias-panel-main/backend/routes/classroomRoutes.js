import { Router } from 'express'
import {
  listClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  availableClassrooms,
  checkAvailability,
  upsertBooking,
} from '../controllers/classroomController.js'

const router = Router()

router.get('/', listClassrooms)
router.get('/available', availableClassrooms)
router.get('/check', checkAvailability)
router.post('/', createClassroom)
router.post('/bookings', upsertBooking)
router.put('/:id', updateClassroom)
router.delete('/:id', deleteClassroom)

export default router
