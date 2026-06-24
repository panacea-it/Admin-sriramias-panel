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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, GripVertical, Star, X } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { formatINR } from '../../../utils/financeFilters'
import { productById } from '../../../utils/bookstoreRecommendationUtils'
import { BOOKSTORE_LABEL_CLASS } from '../modal/bookstoreFormStyles'

function SortableRow({ item, index, total, product, isBestseller, onRemove, onMove, onToggleBestseller }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!product) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-[#e8ecf2] bg-white p-2.5 shadow-sm',
        isDragging && 'ring-2 ring-[#7c5cbf]',
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7c5cbf] text-xs font-bold text-white">
        {index + 1}
      </span>
      <button
        type="button"
        className="cursor-grab text-[#888] hover:text-[#555] active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-[#f3f0fa] text-center text-[10px] font-bold leading-[3rem] text-[#7c5cbf]">
        {product.thumbnailUrl ? (
          <img src={product.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          product.name?.slice(0, 2)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#111]">{product.name}</p>
        <p className="text-xs font-medium text-[#7c5cbf]">{formatINR(product.discountPrice)}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggleBestseller(product.id)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition',
          isBestseller ? 'bg-amber-100 text-amber-700' : 'text-[#bbb] hover:bg-[#f4f4f6]',
        )}
        title="Toggle bestseller tag"
      >
        <Star className={cn('h-4 w-4', isBestseller && 'fill-current')} />
      </button>
      <div className="flex shrink-0 gap-0.5">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f0f0f4] disabled:opacity-30"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f0f0f4] disabled:opacity-30"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function SortableRecommendedBooks({
  products,
  orderedIds,
  onChange,
  bestsellerIds = [],
  onBestsellerChange,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedIds.indexOf(active.id)
    const newIndex = orderedIds.indexOf(over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(orderedIds, oldIndex, newIndex))
  }

  const move = (index, delta) => {
    const next = index + delta
    if (next < 0 || next >= orderedIds.length) return
    onChange(arrayMove(orderedIds, index, next))
  }

  const remove = (id) => {
    onChange(orderedIds.filter((x) => x !== id))
    onBestsellerChange?.(bestsellerIds.filter((x) => x !== id))
  }

  const toggleBestseller = (id) => {
    if (!onBestsellerChange) return
    if (bestsellerIds.includes(id)) {
      onBestsellerChange(bestsellerIds.filter((x) => x !== id))
    } else {
      onBestsellerChange([...bestsellerIds, id])
    }
  }

  if (!orderedIds.length) {
    return (
      <p className="rounded-lg border border-dashed border-[#d8dce3] bg-[#fafbfc] px-4 py-8 text-center text-sm text-[#686868]">
        Select books above, then arrange display order here.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <span className={BOOKSTORE_LABEL_CLASS}>Display order (drag or use arrows)</span>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedIds.map((id, index) => (
              <SortableRow
                key={id}
                item={id}
                index={index}
                total={orderedIds.length}
                product={productById(products, id)}
                isBestseller={bestsellerIds.includes(id)}
                onRemove={remove}
                onMove={move}
                onToggleBestseller={toggleBestseller}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
