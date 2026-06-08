import { Router } from 'express'
import {
  listSectionConfigs,
  getSectionConfig,
  createSectionConfig,
  updateSectionConfig,
  deleteSectionConfig,
} from '../controllers/testSectionConfigController.js'

const router = Router()

router.get('/', listSectionConfigs)
router.get('/:id', getSectionConfig)
router.post('/', createSectionConfig)
router.put('/:id', updateSectionConfig)
router.delete('/:id', deleteSectionConfig)

export default router
