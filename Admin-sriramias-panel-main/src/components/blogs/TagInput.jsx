import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function TagInput({
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Type and press Enter…',
  allowCustom = true,
  className,
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return suggestions
      .filter((s) => !value.includes(s))
      .filter((s) => !q || s.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, suggestions, value])

  const addTag = (tag) => {
    const next = tag.trim()
    if (!next || value.includes(next)) return
    onChange?.([...value, next])
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const removeTag = (tag) => {
    onChange?.(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      if (filtered[0] && !allowCustom) addTag(filtered[0])
      else if (allowCustom) addTag(query)
    }
    if (e.key === 'Backspace' && !query && value.length) {
      removeTag(value[value.length - 1])
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex min-h-[52px] w-full flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition duration-150',
          'hover:border-[#93c5fd] hover:bg-[#fafcff]',
          'focus-within:border-[#55ace7] focus-within:ring-2 focus-within:ring-blue-400/35',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence mode="popLayout">
          {value.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f4fc] px-3 py-1.5 text-sm font-medium text-[#1a3a5c] ring-1 ring-[#93c5fd]/40"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
                className="rounded-full p-0.5 text-[#246392] transition hover:bg-[#d9ebf9]"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[120px] flex-1 border-0 bg-transparent py-1.5 text-sm text-gray-800 outline-none placeholder:text-gray-400"
        />
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            {filtered.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-[#f0f7fc]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addTag(s)}
                >
                  {s}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
