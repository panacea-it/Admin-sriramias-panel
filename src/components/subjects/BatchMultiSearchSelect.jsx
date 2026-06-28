import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  buildActiveBatchOptions,
  formatBatchSelectLabel,
} from '../../utils/batchSelectHelpers'
import { usePortalMenuPosition } from '../ui/usePortalMenuPosition'

function normalizeIds(value) {
  if (!Array.isArray(value)) {
    if (value) return [String(value)]
    return []
  }
  return [...new Set(value.map(String).filter(Boolean))]
}

export default function BatchMultiSearchSelect({
  batches = [],
  loading = false,
  value = [],
  onChange,
  disabled = false,
  error,
  required = false,
  hideLabel = false,
  label = 'Batch',
  placeholder = 'Search and select batches…',
  emptyHint = 'No active batches — create under Batch Management',
  className,
}) {
  const listboxId = useId()
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const options = useMemo(() => buildActiveBatchOptions(batches), [batches])
  const selectedIds = useMemo(() => normalizeIds(value), [value])
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const coords = usePortalMenuPosition(triggerRef, open, 8)

  const labelById = useMemo(() => {
    const map = new Map()
    options.forEach((o) => map.set(String(o.id), o))
    return map
  }, [options])

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

  const selectableFiltered = useMemo(
    () => filtered.filter((o) => o.selectable),
    [filtered],
  )

  const allFilteredSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every((o) => selectedSet.has(String(o.id)))

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const emitChange = (nextSet) => {
    const ordered = options
      .filter((o) => nextSet.has(String(o.id)))
      .map((o) => String(o.id))
    onChange?.(ordered)
  }

  const toggle = (opt) => {
    if (!opt.selectable) return
    const next = new Set(selectedIds)
    const id = String(opt.id)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    emitChange(next)
  }

  const removeChip = (id, e) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    next.delete(String(id))
    emitChange(next)
  }

  const toggleSelectAll = () => {
    const next = new Set(selectedIds)
    if (allFilteredSelected) {
      selectableFiltered.forEach((o) => next.delete(String(o.id)))
    } else {
      selectableFiltered.forEach((o) => next.add(String(o.id)))
    }
    emitChange(next)
  }

  const empty = !loading && options.length === 0
  const noResults = !loading && filtered.length === 0

  return (
    <div className={cn('relative', className)} ref={rootRef}>
      {!hideLabel ? (
        <label className="mb-1.5 block text-sm font-medium text-[#333]">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}
      <div
        ref={triggerRef}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        tabIndex={disabled || loading || empty ? -1 : 0}
        onClick={() => {
          if (!disabled && !loading && !empty) setOpen((o) => !o)
        }}
        onKeyDown={(e) => {
          if (disabled || loading || empty) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((o) => !o)
          }
        }}
        className={cn(
          'relative min-h-11 w-full cursor-pointer rounded-xl bg-[#d1e9f6] px-3 py-2 text-left text-sm transition outline-none',
          'focus:ring-2 focus:ring-[#55ace7]/40',
          (disabled || loading || empty) && 'cursor-not-allowed opacity-60',
          error && 'ring-2 ring-red-400',
        )}
      >
        <div className="flex min-h-[28px] flex-wrap items-center gap-1.5 pr-6">
          {loading ? (
            <span className="flex items-center gap-2 text-[#7a8a9a]">
              <Loader2 className="h-4 w-4 animate-spin text-[#55ace7]" />
              Loading batches…
            </span>
          ) : empty ? (
            <span className="text-[#7a8a9a]">{emptyHint}</span>
          ) : selectedIds.length === 0 ? (
            <span className="text-[#7a8a9a]">{placeholder}</span>
          ) : (
            selectedIds.map((id) => {
              const opt = labelById.get(id)
              return (
                <span
                  key={id}
                  className="inline-flex max-w-full items-center gap-1 rounded-lg bg-white/90 px-2 py-0.5 text-xs font-semibold text-[#246392] shadow-sm"
                >
                  <span className="truncate">
                    {opt ? formatBatchSelectLabel(opt) : id}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove batch"
                    onClick={(e) => removeChip(id, e)}
                    className="rounded p-0.5 hover:bg-[#e8f4fc]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })
          )}
        </div>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#687180] transition',
            open && 'rotate-180',
          )}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            id={listboxId}
            aria-multiselectable="true"
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
              {selectableFiltered.length > 0 ? (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#246392] hover:bg-[#eef2fc]"
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      allFilteredSelected
                        ? 'border-[#55ace7] bg-[#55ace7] text-white'
                        : 'border-[#cbd5e1] bg-white',
                    )}
                  >
                    {allFilteredSelected ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : null}
                  </span>
                  Select All{query ? ' (filtered)' : ''}
                </button>
              ) : null}
            </div>
            <ul className="custom-scrollbar max-h-52 overflow-y-auto py-1">
              {noResults ? (
                <li className="px-4 py-3 text-sm text-[#9ca0a8]">No matching batches</li>
              ) : (
                filtered.map((opt) => {
                  const checked = selectedSet.has(String(opt.id))
                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={checked}
                        disabled={!opt.selectable}
                        onClick={() => toggle(opt)}
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition',
                          opt.selectable ? 'hover:bg-[#eef2fc]' : 'cursor-not-allowed opacity-50',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                            checked
                              ? 'border-[#55ace7] bg-[#55ace7] text-white'
                              : 'border-[#cbd5e1] bg-white',
                          )}
                        >
                          {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-[#222]">{opt.batchName}</span>
                          <span className="block font-mono text-[11px] text-[#246392]">
                            {opt.batchId}
                          </span>
                          <span className="block text-xs text-[#686868]">
                            {opt.courseName || '—'} · {opt.status}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  )
}
