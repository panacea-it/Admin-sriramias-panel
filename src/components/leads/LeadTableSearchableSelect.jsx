import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'
import { getLeadStatusChipClass } from '../enquiries/EnquiryTableSelect'
import { cn } from '../../utils/cn'
import { useLeadTableDropdownPosition } from './useLeadTableDropdownPosition'

const TABLE_TRIGGER = cn(
  'flex h-9 w-full items-center justify-between rounded-lg border border-slate-200/90 bg-white pl-3 pr-9 text-left text-xs font-semibold leading-normal shadow-sm outline-none transition',
  'hover:border-[#55ace7]/50 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
)

const TABLE_STATUS_TRIGGER = cn(
  'flex h-9 w-full items-center justify-between rounded-lg border pl-3 pr-9 text-left text-xs font-semibold leading-normal shadow-sm outline-none transition',
  'hover:border-[#55ace7]/50 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
)

const MENU_Z_INDEX = 100

export default function LeadTableSearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  emptyMessage = 'No options found',
  variant = 'counselor',
  ariaLabel,
  className,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [menuVisible, setMenuVisible] = useState(false)

  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const coords = useLeadTableDropdownPosition(triggerRef, open, 4, 280)

  const selected = options.find((o) => String(o.value) === String(value))
  const isPlaceholder = !value

  const filtered = useMemo(() => {
    const selectable = options.filter((o) => !o.disabled)
    const q = search.trim().toLowerCase()
    if (!q) return selectable
    return selectable.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  const closeMenu = useCallback(() => {
    setMenuVisible(false)
    setOpen(false)
    setSearch('')
    setHighlightIndex(-1)
  }, [])

  useEffect(() => {
    if (!open) {
      setMenuVisible(false)
      return undefined
    }
    if (!coords) return undefined
    const t = requestAnimationFrame(() => setMenuVisible(true))
    return () => cancelAnimationFrame(t)
  }, [open, coords])

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      closeMenu()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [closeMenu])

  useEffect(() => {
    if (!open) return
    setHighlightIndex(filtered.length > 0 ? 0 : -1)
    const t = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(t)
  }, [open, filtered.length])

  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return
    listRef.current.children[highlightIndex]?.scrollIntoView?.({ block: 'nearest' })
  }, [highlightIndex])

  const selectOption = useCallback(
    (opt) => {
      if (opt?.disabled) return
      onChange(opt.value)
      closeMenu()
      triggerRef.current?.focus()
    },
    [onChange, closeMenu],
  )

  const handleTriggerKeyDown = (e) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu()
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Enter' && highlightIndex >= 0 && filtered[highlightIndex]) {
      e.preventDefault()
      selectOption(filtered[highlightIndex])
    }
  }

  const chipClass = variant === 'status' ? getLeadStatusChipClass(value) : ''
  const listMaxHeight = coords ? coords.maxHeight - 52 : 228

  const triggerClassName =
    variant === 'status'
      ? cn(
          TABLE_STATUS_TRIGGER,
          chipClass,
          isPlaceholder && 'text-[#8b98bb]',
        )
      : cn(
          TABLE_TRIGGER,
          isPlaceholder ? 'text-[#8b98bb]' : 'text-[#1a3a5c]',
        )

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClassName}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-[#686868] transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            data-placement={coords.placement}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
              transform: coords.transform,
              zIndex: MENU_Z_INDEX,
            }}
            className={cn(
              'overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]',
              'origin-top transition-all duration-150 ease-out',
              menuVisible ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0',
            )}
          >
            <div className="relative border-b border-[#f0f0f0] p-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search..."
                className="h-9 w-full rounded-lg bg-[#eef2fc] pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#55ace7]"
              />
            </div>
            <ul
              ref={listRef}
              className={cn(
                'overflow-y-auto py-1',
                '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent',
                '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80',
                'hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/80',
              )}
              style={{ maxHeight: listMaxHeight }}
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-[#686868]">{emptyMessage}</li>
              ) : (
                filtered.map((opt, index) => {
                  const isSelected = String(value) === String(opt.value)
                  const isHighlighted = index === highlightIndex
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        disabled={opt.disabled}
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => selectOption(opt)}
                        className={cn(
                          'w-full px-4 py-2.5 text-left text-sm transition',
                          opt.disabled && 'cursor-not-allowed opacity-50',
                          !opt.disabled && 'hover:bg-[#f0f7fc]',
                          (isSelected || isHighlighted) &&
                            'bg-[#e8f4fc] font-semibold text-[#246392]',
                        )}
                      >
                        {opt.label}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body,
        )}

      {ariaLabel && <span className="sr-only">{ariaLabel}</span>}
    </div>
  )
}
