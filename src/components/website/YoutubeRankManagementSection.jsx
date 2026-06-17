import YoutubePriorityManager from './YoutubePriorityManager'
import { useYoutubeVideos } from '../../contexts/YoutubeVideosContext'
import { toast } from '@/utils/toast'

export default function YoutubeRankManagementSection() {
  const { videos, removeRank, reorderRanks } = useYoutubeVideos()

  const handleReorder = async (orderedIds) => {
    try {
      await reorderRanks(orderedIds)
      toast.success('Priority list reordered')
    } catch {
      toast.error('Failed to reorder priorities')
    }
  }

  const handleRemove = async (videoOrId) => {
    const videoId = typeof videoOrId === 'object' && videoOrId?.id ? videoOrId.id : videoOrId
    try {
      await removeRank(videoId)
      toast.success('Priority removed')
    } catch {
      toast.error('Failed to remove priority')
    }
  }

  return (
    <YoutubePriorityManager
      videos={videos}
      onReorderRanks={handleReorder}
      onRemoveRank={handleRemove}
    />
  )
}
