import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import YoutubePriorityBadge from './YoutubePriorityBadge'
import {
  WebsiteStatusBadge,
  YoutubeUrlLink,
} from './websiteUi'
import { cn } from '../../utils/cn'
import { youtubeThumbnailUrl } from '../../utils/youtubeVideoPriority'

function PinnedCard({ video }) {
  const thumb = youtubeThumbnailUrl(video.url)

  return (
    <article
      className={cn(
        'flex min-w-[280px] max-w-[320px] shrink-0 snap-start flex-col gap-3 rounded-xl border border-[#fecaca] bg-gradient-to-br from-white to-[#fff5f5] p-4',
        'shadow-[0_8px_24px_rgba(239,68,68,0.12)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(239,68,68,0.18)]',
        'sm:min-w-0 sm:max-w-none',
      )}
    >
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-[#eef2fc] shadow-inner">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold text-[#9ca0a8]">
            No thumbnail
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="line-clamp-2 text-sm font-bold text-[#111]" title={video.name}>
          {video.name}
        </h3>
        <YoutubeUrlLink url={video.url} />
        <div className="flex flex-wrap items-center gap-2">
          <WebsiteStatusBadge status={video.status} />
          <YoutubePriorityBadge priorityLevel={1} />
        </div>
      </div>
    </article>
  )
}

export default function YoutubePinnedSection({ videos = [] }) {
  const scrollRef = useRef(null)
  const pinned = videos.filter((v) => v.priorityLevel === 1)

  if (!pinned.length) return null

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  return (
    <section className="rounded-xl border border-[#fecaca]/60 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#111]">Pinned Videos</h2>
          <p className="text-xs text-[#686868]">Priority 1 videos highlighted for quick access</p>
        </div>
        <div className="flex gap-1 sm:hidden">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef6fc] text-[#246392]"
            aria-label="Scroll pinned left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef6fc] text-[#246392]"
            aria-label="Scroll pinned right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          'flex gap-4 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4',
        )}
      >
        {pinned.map((video) => (
          <PinnedCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  )
}
