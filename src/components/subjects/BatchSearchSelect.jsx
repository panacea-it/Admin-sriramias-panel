import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  buildActiveBatchOptions,
  formatBatchSelectLabel,
} from '../../utils/batchSelectHelpers'
import { usePortalMenuPosition } from '../ui/usePortalMenuPosition'

export default function BatchSearchSelect({
  batches = [],
  loading = false,
  value = '',
  onChange,
  disabled = false,
  error,
  required = false,
  placeholder = 'Search and select batch…',
  className,
  emptyHint = 'No batches available',
}) {
  const listboxId = useId()
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)

  const options = useMemo(() => buildActiveBatchOptions(batches), [batches])
  const selected = options.find((o) => String(o.id) === String(value))
  const coords = usePortalMenuPosition(triggerRef, open, 8)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (opt) =>
        opt.batchId?.toLowerCase().includes(q) ||
        opt.batchName?.toLowerCase().includes(q) ||
        opt.courseName?.toLowerCase().includes(q) ||
        opt.status?.toLowerCase().includes(q),
    )
  }, [options, query])

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
    if (!opt.selectable) return
    onChange?.(opt.id)
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
    if (e.key === 'Enter' && filtered[highlight]?.selectable) {
      e.preventDefault()
      pick(filtered[highlight])
    }
  }

  const empty = !loading && options.length === 0
  const noResults = !loading && filtered.length === 0

  return (
    <div className={cn('relative', className)} ref={rootRef} onKeyDown={onKeyDown}>
      <label className="mb-1.5 block text-sm font-medium text-[#333]">
        Batch
        {required && <span className="text-red-500"> *</span>}
      </label>
      <button
        type="button"
        disabled={disabled || loading || empty}
        onClick={() => setOpen((o) => !o)}
        ref={triggerRef}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-[#d1e9f6] px-4 text-left text-sm transition',
          'focus:ring-2 focus:ring-[#55ace7]/40',
          (disabled || loading || empty) && 'cursor-not-allowed opacity-60',
          error && 'ring-2 ring-red-400',
          !selected && 'text-[#7a8a9a]',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className="truncate">
          {loading
            ? 'Loading batches…'
            : empty
              ? emptyHint
              : selected
                ? formatBatchSelectLabel(selected)
                : placeholder}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#55ace7]" />
        ) : (
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-[#687180] transition', open && 'rotate-180')}
          />
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open &&
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
                  placeholder="Search batch name or ID…"
                  className="h-10 w-full rounded-lg bg-[#eef2fc] pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/30"
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
            <ul className="custom-scrollbar max-h-52 overflow-y-auto py-1">
              {noResults ? (
                <li className="px-4 py-3 text-sm text-[#9ca0a8]">
                  No matching batches
                </li>
              ) : (
                filtered.map((opt, index) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={String(opt.id) === String(value)}
                      disabled={!opt.selectable}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => pick(opt)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition',
                        opt.selectable
                          ? 'hover:bg-[#eef2fc]'
                          : 'cursor-not-allowed opacity-50',
                        index === highlight &&
                          opt.selectable &&
                          'bg-[#e8f4fc]',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-[#222]">
                          {opt.batchName}
                        </span>
                        <span className="block font-mono text-[11px] text-[#246392]">
                          {opt.batchId}
                        </span>
                        <span className="block text-xs text-[#686868]">
                          {opt.courseName || '—'} · {opt.status}
                        </span>
                      </span>
                      {String(opt.id) === String(value) ? (
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
    </div>
  )
}
