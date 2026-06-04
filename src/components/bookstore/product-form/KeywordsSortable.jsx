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
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, X } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { nextAssetId } from '../../../utils/bookstoreProductForm'
import { BOOKSTORE_ERROR_CLASS, BOOKSTORE_HELPER_CLASS, BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../modal/bookstoreFormStyles'

function SortableKeywordChip({ item, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[#dcd4ef] bg-[#f3f0fa] py-1.5 pl-2 pr-1.5 text-sm font-medium text-[#3d2d6b] shadow-sm',
        isDragging && 'ring-2 ring-[#7c5cbf]',
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7c5cbf] text-[10px] font-bold text-white">
        {index + 1}
      </span>
      <button
        type="button"
        className="cursor-grab rounded p-0.5 text-[#888] hover:text-[#555] active:cursor-grabbing"
        aria-label="Drag keyword"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span>{item.text}</span>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[#888] transition hover:bg-[#e8e0f5] hover:text-red-600"
        aria-label={`Remove ${item.text}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function KeywordsSortable({ items, onChange, error }) {
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const addKeyword = (raw) => {
    const text = raw.trim()
    if (!text) return
    const exists = items.some((k) => k.text.trim().toLowerCase() === text.toLowerCase())
    if (exists) {
      setInputError('This keyword already exists.')
      return
    }
    setInputError('')
    onChange([...items, { id: nextAssetId('kw'), text }])
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword(input)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className={BOOKSTORE_LABEL_CLASS}>Add keyword</span>
        <div className="flex gap-2">
          <input
            className={BOOKSTORE_INPUT_CLASS}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (inputError) setInputError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type keyword and press Enter"
          />
          <button
            type="button"
            onClick={() => addKeyword(input)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#7c5cbf] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6a4dad]"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        {inputError && <p className={BOOKSTORE_ERROR_CLASS}>{inputError}</p>}
      </label>

      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <SortableKeywordChip
                  key={item.id}
                  item={item}
                  index={index}
                  onRemove={(id) => onChange(items.filter((k) => k.id !== id))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className={BOOKSTORE_HELPER_CLASS}>
        Drag keywords to set search priority order. Duplicates are not allowed.
      </p>
      {error && <p className={BOOKSTORE_ERROR_CLASS}>{error}</p>}
    </div>
  )
}
