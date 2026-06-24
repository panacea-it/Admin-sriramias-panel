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
import { GripVertical, Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getRankedVideos, getRankBadgeClass, getRankLabel, youtubeThumbnailUrl } from '../../utils/youtubeVideoPriority'

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
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function YoutubePriorityManager({
  videos = [],
  onReorderRanks,
  onRemoveRank,
}) {
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE)

  const ranked = useMemo(() => getRankedVideos(videos), [videos])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ranked
    return ranked.filter(
      (v) =>
        (v.name || '').toLowerCase().includes(q) ||
        (v.url || '').toLowerCase().includes(q),
    )
  }, [ranked, search])

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
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#111]">Priority Manager</h2>
        <p className="text-xs text-[#686868]">
          {ranked.length} ranked video{ranked.length === 1 ? '' : 's'} — unlimited dynamic ranks
        </p>
      </div>

      <div className="mb-3">
        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setVisibleCount(PAGE)
            }}
            placeholder="Search by video name or URL"
            className="h-10 w-full rounded-lg bg-[#eef2fc] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/40"
          />
        </div>
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
