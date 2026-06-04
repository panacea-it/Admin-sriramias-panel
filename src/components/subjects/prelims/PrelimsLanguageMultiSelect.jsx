import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { usePortalMenuPosition } from '../../ui/usePortalMenuPosition'
import { examDropdownTriggerClass } from '../../courses/exam/examFormStyles'

/**
 * Multi-select dropdown with checkboxes — languages from Test Configuration master data.
 */
export default function PrelimsLanguageMultiSelect({
  value = [],
  onChange,
  options = [],
  loading = false,
  disabled = false,
  error,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const coords = usePortalMenuPosition(triggerRef, open, 8)

  const optionList = useMemo(
    () => [...new Set((Array.isArray(options) ? options : []).map(String).filter(Boolean))],
    [options],
  )

  const selected = useMemo(
    () => [...new Set((Array.isArray(value) ? value : []).map(String).filter(Boolean))],
    [value],
  )

  const orphanedSelections = useMemo(
    () => selected.filter((lang) => !optionList.includes(lang)),
    [selected, optionList],
  )

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const toggle = (lang) => {
    const set = new Set(selected)
    if (set.has(lang)) set.delete(lang)
    else set.add(lang)
    const ordered = [
      ...optionList.filter((opt) => set.has(opt)),
      ...orphanedSelections.filter((lang) => set.has(lang)),
    ]
    onChange(ordered)
  }

  const displayLabel = loading
    ? 'Loading languages…'
    : selected.length === 0
      ? optionList.length
        ? 'Select languages…'
        : 'No active languages configured'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} languages selected`

  const isDisabled = disabled || loading

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={isDisabled}
        ref={triggerRef}
        onClick={() => !isDisabled && setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          examDropdownTriggerClass,
          'justify-between',
          isDisabled && 'cursor-not-allowed opacity-60',
          error && 'ring-2 ring-red-400',
        )}
      >
        <span
          className={cn(
            'min-w-0 truncate pr-2',
            selected.length === 0 && 'font-normal text-[#7a8a9a]',
          )}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-[#687180]',
            open && 'rotate-180',
          )}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-multiselectable="true"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 220,
            }}
            className="overflow-hidden rounded-xl border border-[#cfe8f8] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
          >
            <ul className="max-h-52 overflow-y-auto py-1">
              {optionList.length === 0 ? (
                <li className="px-4 py-3 text-sm text-[#7a8a9a]">
                  Add languages in Test Configuration → Language Settings.
                </li>
              ) : (
                optionList.map((lang) => {
                  const checked = selected.includes(lang)
                  return (
                    <li key={lang}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={checked}
                        onClick={() => toggle(lang)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#f0f7fc]"
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
        )}

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
