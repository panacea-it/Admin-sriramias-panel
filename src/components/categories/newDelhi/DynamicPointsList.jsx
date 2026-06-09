import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { CourseFormField, CourseInput } from '../../courses/CourseFormField'
import { cn } from '../../../utils/cn'

function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export default function DynamicPointsList({
  label = 'Points',
  points = [],
  onChange,
  addLabel = '+ Add Point',
  showReorder = true,
  className,
}) {
  const updatePoint = (index, text) => {
    const next = points.map((point, i) => (i === index ? { ...point, text } : point))
    onChange(next)
  }

  const addPoint = () => {
    onChange([...points, { id: `pt-${Date.now()}`, text: '' }])
  }

  const removePoint = (index) => {
    if (points.length <= 1) {
      onChange([{ id: points[0]?.id || 'pt-0', text: '' }])
      return
    }
    onChange(points.filter((_, i) => i !== index))
  }

  const moveUp = (index) => {
    onChange(moveItem(points, index, index - 1))
  }

  const moveDown = (index) => {
    onChange(moveItem(points, index, index + 1))
  }

  return (
    <div className={cn('space-y-4', className)}>
      <CourseFormField label={label}>
        <div className="space-y-3">
          {points.map((point, index) => (
            <div key={point.id || `point-${index}`} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <CourseInput
                  value={point.text || ''}
                  onChange={(e) => updatePoint(index, e.target.value)}
                  placeholder={`Point ${index + 1}`}
                />
              </div>
              {showReorder ? (
                <div className="flex shrink-0 items-center gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                    aria-label="Move point up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index >= points.length - 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                    aria-label="Move point down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => removePoint(index)}
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                aria-label="Remove point"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </CourseFormField>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={addPoint}
          className="inline-flex items-center gap-2 rounded-xl border border-[#55ace7]/30 bg-[#eef6fc] px-5 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition hover:border-[#55ace7] hover:bg-white hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {addLabel}
        </button>
      </div>
    </div>
  )
}
