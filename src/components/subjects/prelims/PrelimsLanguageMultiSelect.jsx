import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { examDropdownTriggerClass } from '../../courses/exam/examFormStyles'

function serializeList(list = []) {
  return (Array.isArray(list) ? list : []).map(String).filter(Boolean).join('\u0001')
}

function useStableMenuPosition(triggerRef, open, offset = 8) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const lastCoordsRef = useRef(coords)

  useEffect(() => {
    if (!open) return undefined

    const update = () => {
      const el = triggerRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const width = Math.max(0, rect.width)
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      const top = rect.bottom + offset
      const prev = lastCoordsRef.current

      if (
        Math.abs(prev.top - top) < 0.5 &&
        Math.abs(prev.left - left) < 0.5 &&
        Math.abs(prev.width - width) < 0.5
      ) {
        return
      }

      const next = { top, left, width }
      lastCoordsRef.current = next
      setCoords(next)
    }

    update()
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('resize', update)
    }
  }, [open, offset, triggerRef])

  return coords
}

const LanguageChipTag = memo(function LanguageChipTag({ label, disabled, onRemove }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#246392] shadow-sm ring-1 ring-[#55ace7]/15">
      <span className="truncate select-none">{label}</span>
      {!disabled ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="rounded p-0.5 text-[#687180] transition hover:bg-[#e8f4fc] hover:text-[#246392]"
        >
          <X className="h-3 w-3" strokeWidth={2.5} />
        </button>
      ) : null}
    </span>
  )
})

const LanguageDropdownMenu = memo(function LanguageDropdownMenu({
  open,
  triggerRef,
  menuRef,
  optionList,
  selectedSet,
  onToggle,
  onClose,
}) {
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const searchRef = useRef(null)
  const wasOpenRef = useRef(false)
  const coords = useStableMenuPosition(triggerRef, open, 8)

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return optionList
    return optionList.filter((lang) => lang.toLowerCase().includes(q))
  }, [optionList, search])

  const safeHighlightIndex = Math.min(
    highlightIndex,
    Math.max(0, filteredOptions.length - 1),
  )

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setSearch('')
      setHighlightIndex(0)
      requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }))
    }
    wasOpenRef.current = open
  }, [open])

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value)
    setHighlightIndex(0)
  }, [])

  const handleMenuKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (!filteredOptions.length) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex((idx) => (idx + 1) % filteredOptions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex((idx) => (idx - 1 + filteredOptions.length) % filteredOptions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const lang = filteredOptions[safeHighlightIndex]
        if (lang) onToggle(lang)
      }
    },
    [filteredOptions, onClose, onToggle, safeHighlightIndex],
  )

  if (!open) return null

  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-multiselectable="true"
      onKeyDown={handleMenuKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
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
          ref={searchRef}
          type="text"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={search}
          onChange={handleSearchChange}
          placeholder="Search languages…"
          className="h-9 w-full rounded-lg bg-[#eef2fc] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
          aria-label="Search languages"
        />
      </div>
      <ul className="max-h-52 overflow-y-auto py-1">
        {optionList.length === 0 ? (
          <li className="px-4 py-3 text-sm text-[#7a8a9a]">
            Add languages in Test Configuration → Language Settings.
          </li>
        ) : filteredOptions.length === 0 ? (
          <li className="px-4 py-5 text-center text-sm text-[#686868]">No languages found</li>
        ) : (
          filteredOptions.map((lang, index) => {
            const checked = selectedSet.has(lang)
            const highlighted = index === safeHighlightIndex
            return (
              <li key={lang}>
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onToggle(lang)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition',
                    highlighted ? 'bg-[#eef6fc]' : 'hover:bg-[#f0f7fc]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      checked
                        ? 'border-[#55ace7] bg-[#55ace7] text-white'
                        : 'border-[#cbd5e1] bg-white',
                    )}
                  >
                    {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="font-medium text-[#1a3a5c]">{lang}</span>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </div>,
    document.body,
  )
})

/**
 * Searchable multi-select with chip tags — languages from Test Configuration master data.
 */
function PrelimsLanguageMultiSelect({
  value = [],
  onChange,
  options = [],
  loading = false,
  disabled = false,
  error,
  placeholder = 'Select Languages',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const onChangeRef = useRef(onChange)

  onChangeRef.current = onChange

  const valueKey = serializeList(value)
  const optionsKey = serializeList(options)

  const optionList = useMemo(
    () => [...new Set(optionsKey.split('\u0001').filter(Boolean))],
    [optionsKey],
  )

  const selectedSet = useMemo(() => new Set(valueKey.split('\u0001').filter(Boolean)), [valueKey])

  const orderedSelected = useMemo(
    () => [
      ...optionList.filter((opt) => selectedSet.has(opt)),
      ...[...selectedSet].filter((lang) => !optionList.includes(lang)),
    ],
    [optionList, selectedSet],
  )

  const orphanedSelections = useMemo(
    () => orderedSelected.filter((lang) => !optionList.includes(lang)),
    [orderedSelected, optionList],
  )

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const emitChange = useCallback(
    (nextSet) => {
      const ordered = [
        ...optionList.filter((opt) => nextSet.has(opt)),
        ...orphanedSelections.filter((lang) => nextSet.has(lang)),
      ]
      onChangeRef.current(ordered)
    },
    [optionList, orphanedSelections],
  )

  const toggle = useCallback(
    (lang) => {
      const set = new Set(selectedSet)
      if (set.has(lang)) set.delete(lang)
      else set.add(lang)
      emitChange(set)
    },
    [emitChange, selectedSet],
  )

  const remove = useCallback(
    (lang) => {
      const set = new Set(selectedSet)
      set.delete(lang)
      emitChange(set)
    },
    [emitChange, selectedSet],
  )

  const handleClose = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }, [])

  const handleTriggerMouseDown = useCallback(
    (e) => {
      if (disabled || loading || e.button !== 0) return
      // Keep focus off the trigger so the browser does not show a blinking text caret on the button.
      e.preventDefault()
    },
    [disabled, loading],
  )

  const handleTriggerClick = useCallback(() => {
    if (disabled || loading) return
    setOpen((isOpen) => !isOpen)
  }, [disabled, loading])

  const handleTriggerKeyDown = useCallback(
    (e) => {
      if (disabled || loading) return
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Backspace' && selectedSet.size && !open) {
        const last = orderedSelected[orderedSelected.length - 1]
        if (last) remove(last)
      }
    },
    [disabled, loading, open, orderedSelected, remove, selectedSet.size],
  )

  const isDisabled = disabled || loading

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={isDisabled}
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="listbox"
        onMouseDown={handleTriggerMouseDown}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          examDropdownTriggerClass,
          'min-h-12 h-auto cursor-pointer py-2',
          isDisabled && 'cursor-not-allowed opacity-60',
          error && 'ring-2 ring-red-400',
        )}
      >
        <div className="flex min-h-[28px] flex-wrap items-center gap-1.5 pr-8">
          {loading ? (
            <span className="select-none font-normal text-[#7a8a9a]">Loading languages…</span>
          ) : orderedSelected.length === 0 ? (
            <span className="select-none font-normal text-[#7a8a9a]">
              {optionList.length ? placeholder : 'No active languages configured'}
            </span>
          ) : (
            orderedSelected.map((lang) => (
              <LanguageChipTag
                key={lang}
                label={lang}
                disabled={isDisabled}
                onRemove={() => remove(lang)}
              />
            ))
          )}
        </div>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-[#687180] transition',
            open && 'rotate-180',
          )}
        />
      </button>

      <LanguageDropdownMenu
        open={open}
        triggerRef={triggerRef}
        menuRef={menuRef}
        optionList={optionList}
        selectedSet={selectedSet}
        onToggle={toggle}
        onClose={handleClose}
      />

      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
      {orphanedSelections.length > 0 ? (
        <p className="mt-1 text-xs text-amber-700">
          {orphanedSelections.join(', ')} no longer active in Language Settings but remain saved
          on this test.
        </p>
      ) : null}
      {!loading && optionList.length === 0 ? (
        <p className="mt-1 text-xs text-[#686868]">
          Configure languages in Test Configuration → Language Settings.
        </p>
      ) : null}
    </div>
  )
}

function propsAreEqual(prev, next) {
  return (
    serializeList(prev.value) === serializeList(next.value) &&
    serializeList(prev.options) === serializeList(next.options) &&
    prev.loading === next.loading &&
    prev.disabled === next.disabled &&
    prev.error === next.error &&
    prev.placeholder === next.placeholder
  )
}

export default memo(PrelimsLanguageMultiSelect, propsAreEqual)
