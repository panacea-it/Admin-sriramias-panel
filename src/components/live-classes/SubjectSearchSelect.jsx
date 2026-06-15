import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Loader2, Search } from 'lucide-react'
import { cn } from '../../utils/cn'
import { fetchSubjectCategories } from '../../api/subjectCategoriesAPI'
import { usePortalMenuPosition } from '../ui/usePortalMenuPosition'

export default function SubjectSearchSelect({
  value,
  onChange,
  disabled,
  required,
  className,
}) {
  const listboxId = useId()
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    fetchSubjectCategories({ status: 'Active', signal: ac.signal })
      .then((rows) => {
        setSubjects(rows)
        setError(null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError('Failed to load subjects')
      })
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [])

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

  const selected = subjects.find((s) => s.id === value)
  const coords = usePortalMenuPosition(triggerRef, open, 8)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return subjects
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.mainCategoryName?.toLowerCase().includes(q) ||
        s.label?.toLowerCase().includes(q),
    )
  }, [subjects, query])

  const pick = (subject) => {
    onChange?.({
      subjectId: subject.id,
      subjectName: subject.name,
      mainCategoryName: subject.mainCategoryName,
    })
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        ref={triggerRef}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-transparent bg-[#e8f4fc] px-4 text-left text-sm shadow-sm transition focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
          !selected && 'text-[#9ca0a8]',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className="truncate">
          {loading ? 'Loading subjects…' : selected?.label || 'Select subject (category — subject)'}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#55ace7]" />
        ) : (
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-[#55ace7]', open && 'rotate-180')}
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
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search category or subject…"
                  className="h-10 w-full rounded-lg bg-[#eef2fc] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/30"
                  autoFocus
                />
              </div>
            </div>
            <ul className="custom-scrollbar max-h-56 overflow-y-auto py-1">
              {error && (
                <li className="px-4 py-3 text-sm text-[#c96565]">{error}</li>
              )}
              {!error && filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-[#9ca0a8]">
                  No subjects found
                </li>
              )}
              {filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === s.id}
                    onClick={() => pick(s)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#eef2fc]',
                      value === s.id && 'bg-[#e8f4fc] text-[#246392]',
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cbeeff] text-xs font-bold text-[#246392]">
                      {s.iconLabel || s.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[#222]">
                        {s.name}
                      </span>
                      <span className="block truncate text-xs text-[#686868]">
                        {s.mainCategoryName}
                      </span>
                    </span>
                    {value === s.id && (
                      <Check className="h-4 w-4 shrink-0 text-[#55ace7]" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
      {required && !value && (
        <span className="mt-1 block text-xs text-[#9ca0a8]">
          Required — classes attach to subjects only
        </span>
      )}
    </div>
  )
}
