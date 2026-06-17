import YoutubeDragHandle from './YoutubeDragHandle'
import { youtubeThumbnailUrl } from '../../utils/youtubeVideoPriority'

export default function YoutubeUnrankedPanel({ videos = [] }) {
  const unranked = videos.filter((v) => !v.priorityOrder)

  if (unranked.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#d0d8e4] bg-[#fafcff] px-4 py-6 text-center text-sm text-[#686868]">
        All videos are ranked. Remove a rank or add new videos to assign priorities.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-[#111]">Unranked videos</h3>
        <p className="text-xs text-[#686868]">Drag a video into the drop zone above to assign a rank.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {unranked.map((video) => (
          <div
            key={video.id}
            className="flex items-center gap-3 rounded-xl border border-[#e2ebf5] bg-white p-3 shadow-sm"
          >
            <YoutubeDragHandle videoId={video.id} />
            <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-[#eef2fc]">
              {youtubeThumbnailUrl(video.url) ? (
                <img
                  src={youtubeThumbnailUrl(video.url)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#111]">{video.name}</p>
              <p className="truncate text-xs text-[#686868]">{video.url}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
