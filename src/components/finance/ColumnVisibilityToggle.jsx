import { useState, useRef, useEffect } from 'react'
import { Columns3, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function ColumnVisibilityToggle({ columns = [], visibleKeys = [], onChange, className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (key) => {
    const next = visibleKeys.includes(key)
      ? visibleKeys.filter((k) => k !== key)
      : [...visibleKeys, key]
    if (next.length > 0) onChange?.(next)
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#55ace7]/30 bg-white px-3 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Columns3 className="h-4 w-4" />
        Columns
        <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-2 min-w-[200px] rounded-xl border border-slate-100 bg-white py-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        >
          <p className="border-b border-slate-100 px-3 pb-2 text-xs font-semibold uppercase text-[#55ace7]">
            Show columns
          </p>
          <ul className="max-h-64 overflow-y-auto px-1 py-1">
            {columns.map((col) => {
              const key = col.key || col.id
              const checked = visibleKeys.includes(key)
              return (
                <li key={key}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#eef2fc]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(key)}
                      className="h-4 w-4 rounded border-[#55ace7] text-[#246392] focus:ring-[#55ace7]"
                    />
                    <span className="font-medium text-[#222]">{col.label || col.header}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
