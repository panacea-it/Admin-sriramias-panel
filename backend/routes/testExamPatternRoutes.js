import { Router } from 'express'
import {
  listExamPatterns,
  getExamPattern,
  createExamPattern,
  updateExamPattern,
  deleteExamPattern,
} from '../controllers/testExamPatternController.js'

const router = Router()

router.get('/', listExamPatterns)
router.get('/:id', getExamPattern)
router.post('/', createExamPattern)
router.put('/:id', updateExamPattern)
router.delete('/:id', deleteExamPattern)

export default router
