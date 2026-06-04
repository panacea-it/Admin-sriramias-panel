import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { usePortalMenuPosition } from '../ui/usePortalMenuPosition'

/**
 * Searchable multi-select with chip display — matches subject form (#d1e9f6) styling.
 */
export default function SubjectChipMultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select...',
  emptyMessage = 'No options found',
  disabled = false,
  error,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const selected = useMemo(() => normalizeList(value), [value])
  const coords = usePortalMenuPosition(triggerRef, open, 8)

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options])
  const labelByValue = useMemo(() => {
    const map = new Map()
    normalizedOptions.forEach((o) => map.set(o.value, o.label))
    return map
  }, [normalizedOptions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const pool = normalizedOptions.filter((opt) => !selected.includes(opt.value))
    if (!q) return pool
    return pool.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q),
    )
  }, [normalizedOptions, search, selected])

  useEffect(() => {
    const onDoc = (e) => {
      if (
        rootRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const toggle = (optValue) => {
    const set = new Set(selected)
    if (set.has(optValue)) set.delete(optValue)
    else set.add(optValue)
    onChange([...set])
  }

  const remove = (opt, e) => {
    e.stopPropagation()
    onChange(selected.filter((x) => x !== opt))
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        ref={triggerRef}
        className={cn(
          'min-h-11 w-full rounded-xl bg-[#d1e9f6] px-3 py-2 text-left text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/40',
          disabled && 'cursor-not-allowed opacity-60',
          error && 'ring-2 ring-red-400',
        )}
      >
        <div className="flex min-h-[28px] flex-wrap items-center gap-1.5 pr-6">
          {selected.length === 0 ? (
            <span className="text-[#7a8a9a]">{placeholder}</span>
          ) : (
            selected.map((item) => (
              <span
                key={item}
                className="inline-flex max-w-full items-center gap-1 rounded-lg bg-white/90 px-2 py-0.5 text-xs font-semibold text-[#246392] shadow-sm"
              >
                <span className="truncate">{labelByValue.get(item) || item}</span>
                <button
                  type="button"
                  aria-label={`Remove ${labelByValue.get(item) || item}`}
                  onClick={(e) => remove(item, e)}
                  className="rounded p-0.5 hover:bg-[#e8f4fc]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#687180] transition',
            open && 'rotate-180',
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 220,
            }}
            className="overflow-hidden rounded-xl border border-[#cfe8f8] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
          >
            <div className="relative border-b border-[#f0f0f0] p-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-9 w-full rounded-lg bg-[#eef2fc] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
                autoFocus
              />
            </div>
            <ul className="max-h-44 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-5 text-center text-sm text-[#686868]">
                  {emptyMessage}
                </li>
              ) : (
                filtered.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => toggle(opt.value)}
                      className="w-full px-4 py-2.5 text-left text-sm transition hover:bg-[#f0f7fc]"
                    >
                      {opt.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return []
  return options
    .map((opt) => {
      if (typeof opt === 'string') return { value: opt, label: opt }
      const value = String(opt?.value ?? '').trim()
      const label = String(opt?.label ?? opt?.value ?? '').trim()
      if (!value) return null
      return { value, label: label || value }
    })
    .filter(Boolean)
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}
