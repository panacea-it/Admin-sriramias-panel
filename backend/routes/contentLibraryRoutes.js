import { Router } from 'express'
import {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  listSubjects,
  listTopics,
  listCategories,
  listAccessRules,
  listVersions,
  getAnalyticsSummary,
  recordStudentView,
  toggleBookmark,
} from '../controllers/contentLibraryController.js'

const router = Router()

router.get('/items', listItems)
router.get('/items/:id', getItem)
router.post('/items', createItem)
router.put('/items/:id', updateItem)
router.delete('/items/:id', deleteItem)

router.get('/subjects', listSubjects)
router.get('/topics', listTopics)
router.get('/categories', listCategories)
router.get('/access-rules', listAccessRules)
router.get('/items/:contentId/versions', listVersions)
router.get('/analytics/summary', getAnalyticsSummary)

router.post('/student/view', recordStudentView)
router.post('/student/bookmark', toggleBookmark)

export default router
