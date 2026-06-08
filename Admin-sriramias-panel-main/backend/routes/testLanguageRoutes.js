import { Router } from 'express'
import {
  listLanguages,
  getLanguage,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} from '../controllers/testLanguageController.js'

const router = Router()

router.get('/', listLanguages)
router.get('/:id', getLanguage)
router.post('/', createLanguage)
router.put('/:id', updateLanguage)
router.delete('/:id', deleteLanguage)

export default router
