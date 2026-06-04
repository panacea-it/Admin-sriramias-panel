import { Router } from 'express'
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  updateCourse,
} from '../controllers/courseController.js'
import { syncAcademicCourses } from '../controllers/academicCourseController.js'
import { validateCourseBody } from '../middleware/validateCourse.js'

const router = Router()

router.get('/', getCourses)
router.post('/catalog/sync', syncAcademicCourses)
router.get('/:id', getCourseById)
router.post('/', validateCourseBody, createCourse)
router.put('/:id', validateCourseBody, updateCourse)
router.delete('/:id', deleteCourse)

export default router
