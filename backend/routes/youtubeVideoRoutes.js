import { Router } from 'express'
import {
  listVideos,
  getPinnedVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  updateVideoPriority,
  reorderVideos,
  seedVideosIfEmpty,
  getRankedVideos,
  getPrioritySlots,
  checkPriorityConflict,
  assignRankHandler,
  assignPriorityHandler,
  removeRankHandler,
  removePriorityHandler,
  reorderPrioritiesHandler,
  recalculateRanksHandler,
  shiftRanksHandler,
} from '../controllers/youtubeVideoController.js'

const router = Router()

router.get('/', listVideos)
router.get('/pinned', getPinnedVideos)
router.get('/rank/ranked', getRankedVideos)
router.get('/priority/slots', getPrioritySlots)
router.get('/priority/conflict', checkPriorityConflict)
router.post('/rank/assign', assignRankHandler)
router.post('/rank/remove', removeRankHandler)
router.post('/rank/reorder', reorderPrioritiesHandler)
router.post('/rank/recalculate', recalculateRanksHandler)
router.post('/rank/shift', shiftRanksHandler)
router.post('/priority/assign', assignPriorityHandler)
router.post('/priority/remove', removePriorityHandler)
router.post('/seed', seedVideosIfEmpty)
router.post('/', createVideo)
router.put('/:id', updateVideo)
router.delete('/:id', deleteVideo)
router.patch('/:id/priority', updateVideoPriority)
router.post('/reorder', reorderVideos)

export default router
