import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Play, Star, GripVertical, Pencil, Upload, Link as LinkIcon, BarChart3 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { generateContentId } from '../../../utils/facultySubjectContentStorage'

function SortableVideoCard({ video, onEdit, onDelete, onToggleFeatured }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: video.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
    >
      </div>
      </div>
    </div>
  )
}

export default function VideosTab({ topic, onUpdateTopic }) {
  const videos = topic?.videos || []
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    sourceType: 'youtube',
    featured: false,
  })
  const [uploading, setUploading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      videoUrl: '',
      duration: '',
      sourceType: 'youtube',
      featured: false,
    })
    setEditing(null)
    setFormOpen(false)
  }

  const saveVideo = () => {
    if (!form.title.trim()) return
    const list = [...videos]
    if (editing) {
      const idx = list.findIndex((v) => v.id === editing.id)
      if (idx >= 0) list[idx] = { ...list[idx], ...form, id: editing.id }
    } else {
      list.push({
        id: generateContentId('vid'),
        ...form,
        orderIndex: list.length,
        views: 0,
        watchProgress: 0,
        createdAt: new Date().toISOString(),
      })
    }
    onUpdateTopic({ videos: list })
    resetForm()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result
      setForm((f) => ({
        ...f,
        videoUrl: url,
        sourceType: 'upload',
        title: f.title || file.name.replace(/\.[^.]+$/, ''),
        thumbnail: file.type.startsWith('video/') ? '' : f.thumbnail,
      }))
      setUploading(false)
      setFormOpen(true)
    }
    reader.onerror = () => setUploading(false)
    reader.readAsDataURL(file)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = videos.findIndex((v) => v.id === active.id)
    const newIndex = videos.findIndex((v) => v.id === over.id)
    const reordered = arrayMove(videos, oldIndex, newIndex).map((v, i) => ({
      ...v,
      orderIndex: i,
    }))
    onUpdateTopic({ videos: reordered })
  }

  const featured = videos.find((v) => v.featured) || videos[0]

  return (
    <div className="space-y-5">
      {featured && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="relative aspect-video max-h-[280px] bg-slate-900">
            {featured.thumbnail ? (
              <img src={featured.thumbnail} alt="" className="h-full w-full object-cover opacity-80" />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#55ace7] shadow-lg">
                <Play className="h-7 w-7 fill-white text-white" />
              </div>
            </div>
            {featured.duration && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 text-xs text-white">
                Duration: {featured.duration} | High Definition
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-[#1a3a5c]">{featured.title}</h3>
              {featured.featured && (
                <span className="rounded bg-[#55ace7]/15 px-2 py-0.5 text-xs font-semibold text-[#246392]">
                  Featured
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600">{featured.description || 'No description.'}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-[#246392]">
                <BarChart3 className="h-4 w-4" />
                Views: {featured.views ?? 0}
              </span>
              <span className="text-slate-500">Watch progress: {featured.watchProgress ?? 0}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <label
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-[#55ace7] hover:text-[#246392]',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload Video'}
          <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
        </label>
        <button
          type="button"
          onClick={() => {
            resetForm()
            setFormOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-4 py-3 text-sm font-semibold text-white"
        >
          <LinkIcon className="h-4 w-4" />
          Add URL
        </button>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-3 font-semibold text-[#1a3a5c]">
            {editing ? 'Edit video' : 'Add video'}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title *"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder="Duration (e.g. 45:12)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={form.sourceType}
              onChange={(e) => setForm((f) => ({ ...f, sourceType: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="upload">Upload</option>
            </select>
            <input
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
              placeholder="Video URL"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              rows={2}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              />
              Mark as featured video
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveVideo}
              className="rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white"
            >
              Save
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
          No videos yet. Upload or add a YouTube/Vimeo URL.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={videos.map((v) => v.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {videos.map((video) => (
                <SortableVideoCard
                  key={video.id}
                  video={video}
                  onEdit={(v) => {
                    setEditing(v)
                    setForm({
                      title: v.title,
                      description: v.description,
                      videoUrl: v.videoUrl,
                      duration: v.duration,
                      sourceType: v.sourceType,
                      featured: v.featured,
                    })
                    setFormOpen(true)
                  }}
                  onDelete={(id) =>
                    onUpdateTopic({ videos: videos.filter((v) => v.id !== id) })
                  }
                  onToggleFeatured={(id) => {
                    onUpdateTopic({
                      videos: videos.map((v) => ({
                        ...v,
                        featured: v.id === id ? !v.featured : false,
                      })),
                    })
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
