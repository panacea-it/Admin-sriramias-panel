import { useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Search, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getRankedVideos, getRankBadgeClass, getRankLabel, youtubeThumbnailUrl } from '../../utils/youtubeVideoPriority'
import { YOUTUBE_DRAG_MIME } from './YoutubeDragHandle'

const PAGE = 20

function RankedRow({ video, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: video.id,
  })
  const thumb = youtubeThumbnailUrl(video.url)
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-[#e2ebf5] bg-white p-3 shadow-sm transition hover:shadow-md',
        isDragging && 'z-10 ring-2 ring-[#55ace7]/40',
      )}
    >
      <button
        type="button"
        className="cursor-grab text-[#9ca0a8] hover:text-[#246392]"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black',
          getRankBadgeClass(video.priorityOrder),
        )}
      >
        {getRankLabel(video.priorityOrder)}
      </span>
      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-[#eef2fc]">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#111]">{video.name}</p>
        <p className="truncate text-xs text-[#686868]">{video.url}</p>
      </div>
      <button
        type="button"
        onClick={() => onRemove?.(video)}
        className="rounded-lg p-2 text-[#c96565] hover:bg-red-50"
        aria-label="Remove rank"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function YoutubePriorityManager({
  videos = [],
  autoCompact,
  onAutoCompactChange,
  allowGaps,
  onAllowGapsChange,
  onDropVideo,
  onReorderRanks,
  onRemoveRank,
  onRecalculate,
}) {
  const [search, setSearch] = useState('')
  const [jumpRank, setJumpRank] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE)
  const [dropHighlight, setDropHighlight] = useState(false)

  const ranked = useMemo(() => getRankedVideos(videos), [videos])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = ranked
    if (q) {
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          String(v.priorityOrder).includes(q) ||
          v.id.includes(q),
      )
    }
    if (jumpRank) {
      const target = parseInt(jumpRank, 10)
      if (target >= 1) {
        list = list.filter((v) => v.priorityOrder === target)
      }
    }
    return list
  }, [ranked, search, jumpRank])

  const visible = filtered.slice(0, visibleCount)
  const ids = visible.map((v) => v.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ranked.findIndex((v) => v.id === active.id)
    const newIndex = ranked.findIndex((v) => v.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(ranked, oldIndex, newIndex)
    onReorderRanks?.(reordered.map((v) => v.id))
  }

  return (
    <section className="rounded-2xl border border-[#e2ebf5] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#111]">Priority Manager</h2>
          <p className="text-xs text-[#686868]">
            {ranked.length} ranked video{ranked.length === 1 ? '' : 's'} — unlimited dynamic ranks
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#333]">
            <input
              type="checkbox"
              checked={autoCompact}
              onChange={(e) => onAutoCompactChange?.(e.target.checked)}
              className="accent-[#246392]"
            />
            Auto compact priorities
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#333]">
            <input
              type="checkbox"
              checked={allowGaps}
              onChange={(e) => onAllowGapsChange?.(e.target.checked)}
              className="accent-[#246392]"
            />
            Manual gaps allowed
          </label>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDropHighlight(true)
        }}
        onDragLeave={() => setDropHighlight(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDropHighlight(false)
          const videoId = e.dataTransfer.getData(YOUTUBE_DRAG_MIME)
          const rank = parseInt(e.dataTransfer.getData('text/rank') || jumpRank || String(ranked.length + 1), 10)
          if (videoId && rank >= 1) onDropVideo?.(videoId, rank)
        }}
        className={cn(
          'mb-4 rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
          dropHighlight
            ? 'border-[#55ace7] bg-[#eef6fc]'
            : 'border-[#d0d8e4] bg-[#fafcff]',
        )}
      >
        <p className="text-sm font-semibold text-[#246392]">Drop video here to assign rank</p>
        <p className="mt-1 text-xs text-[#9ca0a8]">
          Or use Priority Order field / table actions — ranks shift automatically on insert
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setVisibleCount(PAGE)
            }}
            placeholder="Search ranked videos or rank #"
            className="h-10 w-full rounded-lg bg-[#eef2fc] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/40"
          />
        </div>
        <input
          type="number"
          min={1}
          value={jumpRank}
          onChange={(e) => setJumpRank(e.target.value)}
          placeholder="Jump to rank #"
          className="h-10 w-32 rounded-lg bg-[#eef2fc] px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#55ace7]/40"
        />
        <button
          type="button"
          onClick={onRecalculate}
          className="h-10 rounded-lg bg-[#eef6fc] px-4 text-xs font-bold text-[#246392] ring-1 ring-[#d8e8f5] hover:bg-[#dfeefb]"
        >
          Recalculate ranks
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#686868]">No ranked videos match your search.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {visible.map((video) => (
                <RankedRow key={video.id} video={video} onRemove={onRemoveRank} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {visibleCount < filtered.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE)}
          className="mt-3 w-full rounded-lg border border-[#d8e8f5] py-2 text-sm font-semibold text-[#246392] hover:bg-[#f8fbff]"
        >
          Load more ({filtered.length - visibleCount} remaining)
        </button>
      )}
    </section>
  )
}
