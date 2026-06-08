import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

const titleClassName =
  'w-full border-0 bg-transparent text-center text-base font-bold tracking-tight text-[#246392] outline-none sm:text-lg'

/**
 * Section heading that matches SectionBar visually; click or focus to edit inline.
 */
export default function EditableSectionBar({
  value,
  defaultValue = '',
  onChange,
  placeholder = 'Section title',
  'aria-label': ariaLabel = 'Section title',
}) {
  const displayValue = value?.trim() ? value : defaultValue
  const [editing, setEditing] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commit = (next) => {
    const trimmed = String(next ?? '').trim()
    onChange(trimmed || defaultValue)
    setEditing(false)
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-4 text-center shadow-sm">
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={value ?? ''}
          placeholder={placeholder || defaultValue}
          aria-label={ariaLabel}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit(e.currentTarget.value)
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              setEditing(false)
            }
          }}
          className={cn(titleClassName, 'ring-2 ring-blue-400/35')}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full cursor-text rounded-lg border-0 bg-transparent p-0 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55ace7]"
          aria-label={`${ariaLabel}. Click to edit.`}
        >
          <h3 className="text-base font-bold tracking-tight text-[#246392] sm:text-lg">
            {displayValue}
          </h3>
        </button>
      )}
    </div>
  )
}
