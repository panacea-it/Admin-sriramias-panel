import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { cn } from '../../utils/cn'
import { usePortalMenuPosition } from '../ui/usePortalMenuPosition'

/**
 * Searchable single-select dropdown.
 * @param {{ value: string, label: string }[]} options
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  emptyMessage = 'No options available',
  disabled = false,
  loading = false,
  error,
  triggerClassName,
  listClassName,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  const coords = usePortalMenuPosition(triggerRef, open, 8)

  const selected = options.find((o) => String(o.value) === String(value))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && setOpen((o) => !o)}
        ref={triggerRef}
        className={cn(
          triggerClassName ||
            'flex h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 text-left text-sm font-medium text-[#222] shadow-sm outline-none transition hover:border-[#93c5fd] focus:ring-2 focus:ring-blue-400/35',
          !triggerClassName && 'bg-[#e8f4fc]',
          (disabled || loading) && 'cursor-not-allowed opacity-60',
          error && 'ring-2 ring-[#dc2626]/40',
        )}
      >
        <span className={cn('truncate', !selected && 'text-[#8b98bb]')}>
          {loading ? 'Loading…' : selected?.label || placeholder}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#246392]" aria-hidden />
        ) : (
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-[#246392] transition', open && 'rotate-180')}
          />
        )}
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
            className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
          >
            <div className="relative border-b border-[#f0f0f0] p-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-9 w-full rounded-lg bg-[#eef2fc] pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#55ace7]"
                autoFocus
              />
            </div>
            <ul className={cn('max-h-48 overflow-y-auto py-1', listClassName)}>
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-[#686868]">
                  {emptyMessage}
                </li>
              ) : (
                filtered.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(opt.value)
                        setOpen(false)
                        setSearch('')
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition hover:bg-[#f0f7fc]',
                        value === opt.value ||
                          String(value) === String(opt.value) &&
                          'bg-[#e8f4fc] font-semibold text-[#246392]',
                      )}
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
      {error && <p className="mt-1 text-xs font-medium text-[#dc2626]">{error}</p>}
    </div>
  )
}
