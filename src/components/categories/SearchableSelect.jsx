import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { cn } from '../../utils/cn'
import { usePortalMenuPosition } from '../ui/usePortalMenuPosition'

/**
 * Searchable single-select dropdown.
 * @param {{ value: string, label: string, disabled?: boolean }[]} options
 * @param {boolean} usePortal - Render menu in a document portal (default). Set false to anchor near trigger without clipping.
 * @param {number} maxMenuHeight - Max list height in px (default 280).
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
  menuClassName,
  usePortal = true,
  maxMenuHeight = 280,
}) {
  const [open, setOpen] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const coords = usePortalMenuPosition(triggerRef, open, 8, maxMenuHeight)

  const selected = options.find((o) => String(o.value) === String(value))

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
      if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) {
        return
      }
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
    const item = listRef.current.children[highlightIndex]
    item?.scrollIntoView?.({ block: 'nearest' })
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
    if (disabled || loading) return
    if (
      e.key === 'Enter' ||
      e.key === ' ' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowUp'
    ) {
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

  const listMaxHeight = (coords?.maxHeight ?? maxMenuHeight) - 52

  const menuContent = (
    <>
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
          listClassName,
        )}
        style={{ maxHeight: listMaxHeight }}
      >
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-[#686868]">{emptyMessage}</li>
        ) : (
          filtered.map((opt, index) => {
            const isSelected = value === opt.value || String(value) === String(opt.value)
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
                    (isSelected || isHighlighted) && 'bg-[#e8f4fc] font-semibold text-[#246392]',
                  )}
                >
                  {opt.label}
                </button>
              </li>
            )
          })
        )}
      </ul>
    </>
  )

  const menuPanelClass = cn(
    'overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]',
    'transition-[opacity,transform] duration-150 ease-out',
    coords?.placement === 'top' ? 'origin-bottom' : 'origin-top',
    menuVisible ? 'opacity-100' : 'opacity-0',
    coords?.placement === 'bottom' && (menuVisible ? 'translate-y-0' : '-translate-y-1'),
    menuClassName,
  )

  const menuStyle = coords
    ? {
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: coords.width,
        maxHeight: coords.maxHeight,
        ...(coords.placement === 'top' ? { transform: coords.transform } : {}),
        zIndex: usePortal ? 220 : 110,
      }
    : undefined

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
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
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-[#686868] transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        )}
      </button>

      {open &&
        coords &&
        menuStyle &&
        (usePortal ? (
          createPortal(
            <div
              ref={menuRef}
              role="listbox"
              data-placement={coords.placement}
              style={menuStyle}
              className={menuPanelClass}
            >
              {menuContent}
            </div>,
            document.body,
          )
        ) : (
          <div
            ref={menuRef}
            role="listbox"
            data-placement={coords.placement}
            style={menuStyle}
            className={menuPanelClass}
          >
            {menuContent}
          </div>
        ))}

      {error && <p className="mt-1 text-xs font-medium text-[#dc2626]">{error}</p>}
    </div>
  )
}
