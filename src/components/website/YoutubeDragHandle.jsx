import { GripHorizontal } from 'lucide-react'
import { cn } from '../../utils/cn'

export const YOUTUBE_DRAG_MIME = 'application/x-youtube-video-id'

export default function YoutubeDragHandle({ videoId, className }) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(YOUTUBE_DRAG_MIME, videoId)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-[#9ca0a8] transition hover:bg-[#eef6fc] hover:text-[#246392] active:cursor-grabbing',
        className,
      )}
      aria-label="Drag to priority slot"
      title="Drag to a priority slot"
    >
      <GripHorizontal className="h-4 w-4" />
    </button>
  )
}
