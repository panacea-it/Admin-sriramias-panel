import { useRef, useState } from 'react'
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
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImagePlus,
  Trash2,
  Upload,
} from 'lucide-react'
import { cn } from '../../../utils/cn'
import { BOOKSTORE_MIN_SAMPLE_IMAGES, createSampleAsset } from '../../../utils/bookstoreProductForm'
import { UploadFieldHint, UploadValidationMessage } from '../../common/UploadFieldHint'
import { validateUploadFile } from '../../../utils/uploadValidation'
import { BOOKSTORE_ERROR_CLASS, BOOKSTORE_HELPER_CLASS } from '../modal/bookstoreFormStyles'

const SAMPLE_PROFILE = 'IMAGE_MULTI'

function SortableSampleCard({ item, index, total, onRemove, onMove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-[#e8ecf2] bg-white shadow-sm',
        isDragging && 'ring-2 ring-[#7c5cbf] shadow-lg',
      )}
    >
      <div className="relative aspect-[3/4] bg-[#f4f5f8]">
        <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#7c5cbf] text-xs font-bold text-white shadow">
          {index + 1}
        </span>
        {item.uploading && (
          <div className="absolute inset-x-2 bottom-2">
            <div className="h-1 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-[#7c5cbf] transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-1 border-t border-[#eef0f4] p-2">
        <button
          type="button"
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-[#888] hover:bg-[#f0f0f4] active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(item.id, -1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#555] hover:bg-[#f0f0f4] disabled:opacity-30"
            aria-label="Move left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(item.id, 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#555] hover:bg-[#f0f0f4] disabled:opacity-30"
            aria-label="Move right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
            aria-label="Delete image"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SampleImagesSortable({ items, onChange, onUploadStart, error }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const addFiles = async (fileList) => {
    const accepted = []
    for (const file of [...(fileList || [])]) {
      const result = await validateUploadFile(file, SAMPLE_PROFILE)
      if (!result.valid) {
        setValidationError(result.message)
        return
      }
      accepted.push(file)
    }
    if (!accepted.length) return
    setValidationError(null)
    const created = accepted.map((file) => createSampleAsset(file))
    onChange([...items, ...created])
    onUploadStart?.(created.map((c) => c.id))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(items, oldIndex, newIndex))
  }

  const moveByDelta = (id, delta) => {
    const idx = items.findIndex((i) => i.id === id)
    const next = idx + delta
    if (idx < 0 || next < 0 || next >= items.length) return
    onChange(arrayMove(items, idx, next))
  }

  const remove = (id) => onChange(items.filter((i) => i.id !== id))

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition',
          dragOver
            ? 'border-[#7c5cbf] bg-[#f3f0fa]'
            : 'border-[#d8dce3] bg-[#fafbff] hover:border-[#7c5cbf]/40',
          error && 'border-red-300',
        )}
      >
        <Upload className="h-9 w-9 text-[#7c5cbf]" />
        <p className="mt-2 text-sm font-semibold text-[#3d2d6b]">Drop sample / preview images here</p>
        <p className="mt-1 text-xs text-[#686868]">Multiple files supported</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#7c5cbf] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6a4dad]"
        >
          <ImagePlus className="h-4 w-4" />
          Add images
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((item, index) => (
                <SortableSampleCard
                  key={item.id}
                  item={item}
                  index={index}
                  total={items.length}
                  onRemove={remove}
                  onMove={moveByDelta}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <UploadFieldHint profile={SAMPLE_PROFILE} className={BOOKSTORE_HELPER_CLASS} />
      <UploadValidationMessage message={validationError} className={BOOKSTORE_ERROR_CLASS} />
      <p className={BOOKSTORE_HELPER_CLASS}>
        Minimum {BOOKSTORE_MIN_SAMPLE_IMAGES} images for publishing. Drag cards or use arrows to set display order.
      </p>
      {error && <p className={BOOKSTORE_ERROR_CLASS}>{error}</p>}
    </div>
  )
}
