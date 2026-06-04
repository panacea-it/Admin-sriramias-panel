import { Router } from 'express'
import {
  getSubjectContent,
  upsertSubjectContent,
  deleteSubjectContent,
} from '../controllers/facultySubjectContentController.js'

const router = Router()

router.get('/:subjectId', getSubjectContent)
router.put('/:subjectId', upsertSubjectContent)
router.delete('/:subjectId', deleteSubjectContent)

export default router
