import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function CentreMultiSelect({
  centres = [],
  selectedIds = [],
  onChange,
  loading = false,
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return centres
    return centres.filter(
      (c) =>
        c.centerName?.toLowerCase().includes(q) ||
        c.centerCode?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q),
    )
  }, [centres, search])

  const toggle = (centerId) => {
    const set = new Set(selectedIds.map(String))
    const key = String(centerId)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    onChange([...set])
  }

  if (loading) {
    return (
      <div className="space-y-2 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-11 animate-pulse rounded-lg bg-[#eef2fc]" />
        ))}
      </div>
    )
  }

  if (!centres.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#d1d5db] bg-[#fafafa] px-4 py-8 text-center">
        <p className="text-sm font-semibold text-[#111]">No centres available</p>
        <p className="mt-1 text-xs text-[#686868]">Add centres from Centre Management first.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white">
      <div className="relative border-b border-[#f0f0f0] p-3">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search centres..."
          className="h-10 w-full rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
        />
      </div>
      <ul className="max-h-48 overflow-y-auto p-2">
        {filtered.map((centre) => {
          const checked = selectedIds.map(String).includes(String(centre.centerId))
          return (
            <li key={centre.centerId}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[#f0f7fc]',
                  checked && 'bg-[#e8f4fc]',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(centre.centerId)}
                  className="mt-1 h-4 w-4 rounded accent-[#246392]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#111]">{centre.centerName}</p>
                  <p className="text-xs text-[#686868]">
                    {centre.centerCode}
                    {centre.city ? ` · ${centre.city}` : ''}
                  </p>
                </div>
              </label>
            </li>
          )
        })}
      </ul>
      <p className="border-t border-[#f0f0f0] px-3 py-2 text-xs text-[#686868]">
        {selectedIds.length} centre(s) selected
      </p>
    </div>
  )
}
