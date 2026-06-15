import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { buildFacultySubjectOptionsForBatch } from '../../utils/facultySubjectBatch'
import { usePortalMenuPosition } from '../ui/usePortalMenuPosition'

export default function FacultySubjectSearchSelect({
  subjects = [],
  loading = false,
  onSelect,
  disabled = false,
  placeholder = 'Search and select a subject…',
  error,
  className,
}) {
  const listboxId = useId()
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)

  const options = useMemo(
    () => buildFacultySubjectOptionsForBatch(subjects),
    [subjects],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (opt) =>
        opt.subjectCode?.toLowerCase().includes(q) ||
        opt.subjectName?.toLowerCase().includes(q) ||
        opt.facultyName?.toLowerCase().includes(q) ||
        String(opt.subjectId).includes(q),
    )
  }, [options, query])

  const coords = usePortalMenuPosition(triggerRef, open, 8)

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

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

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const pick = (opt) => {
    onSelect?.(opt)
    setOpen(false)
    setQuery('')
    setHighlight(0)
  }

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (!disabled && !loading) setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter' && filtered[highlight]) {
      e.preventDefault()
      pick(filtered[highlight])
    }
  }

  const empty = !loading && options.length === 0
  const noResults = !loading && filtered.length === 0

  return (
    <div ref={rootRef} className={cn('relative', className)} onKeyDown={onKeyDown}>
      <button
        type="button"
        disabled={disabled || loading || empty}
        onClick={() => setOpen((o) => !o)}
        ref={triggerRef}
        className={cn(
          'flex h-12 min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 text-left text-sm shadow-sm transition',
          'hover:border-[#93c5fd] focus:border-[#55ace7] focus:ring-2 focus:ring-blue-400/35',
          error && 'border-red-300 ring-2 ring-red-400/40',
          (disabled || loading || empty) && 'cursor-not-allowed opacity-60',
          !disabled && !loading && !empty && 'text-gray-400',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className="truncate">
          {loading
            ? 'Loading faculty subjects…'
            : empty
              ? 'No faculty subjects available'
              : placeholder}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#55ace7]" />
        ) : (
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-[#246392] transition', open && 'rotate-180')}
          />
        )}
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            id={listboxId}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 220,
            }}
            className="overflow-hidden rounded-xl border border-[#e8f4fc] bg-white shadow-[0_16px_40px_rgba(36,99,146,0.15)]"
          >
          <div className="border-b border-[#eef2fc] p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by ID, name, or faculty…"
                className="h-10 w-full rounded-lg bg-[#eef2fc] pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/30"
                aria-label="Search subjects"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#686868] hover:bg-[#e8f4fc]"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
          <ul className="custom-scrollbar max-h-56 overflow-y-auto py-1">
            {noResults ? (
              <li className="px-4 py-3 text-sm text-[#9ca0a8]">
                {options.length ? 'No matching subjects' : 'Create subjects under Academics → Faculty Subjects'}
              </li>
            ) : (
              filtered.map((opt, index) => (
                <li key={opt.subjectId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === highlight}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => pick(opt)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#eef2fc]',
                      index === highlight && 'bg-[#e8f4fc]',
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cbeeff] text-[10px] font-bold leading-tight text-[#246392]">
                      {opt.subjectCode?.replace('SUB-', '') || opt.subjectId}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[11px] font-bold uppercase tracking-wide text-[#246392]">
                        {opt.subjectCode}
                      </span>
                      <span className="block font-semibold text-[#222]">{opt.subjectName}</span>
                      <span className="block truncate text-xs text-[#686868]">
                        {opt.facultyName || 'No faculty assigned'}
                      </span>
                    </span>
                    {index === highlight ? (
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#55ace7]" />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
          </div>,
          document.body,
        )}

      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  )
}
