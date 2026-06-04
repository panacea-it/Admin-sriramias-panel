import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { formatINR } from '../../../utils/financeFilters'
import { BOOKSTORE_LABEL_CLASS } from '../modal/bookstoreFormStyles'

function BookThumb({ product }) {
  if (product.thumbnailUrl) {
    return <img src={product.thumbnailUrl} alt="" className="h-full w-full object-cover" />
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f3f0fa] to-[#eef6fc] text-xs font-bold text-[#7c5cbf]">
      {product.name?.slice(0, 2)?.toUpperCase()}
    </div>
  )
}

export default function BookProductPicker({
  products,
  selectedIds,
  onChange,
  excludeId,
  label = 'Select recommended books',
}) {
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('all')

  const subjects = useMemo(() => {
    const set = new Set(products.map((p) => p.subject).filter(Boolean))
    return ['all', ...set]
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (excludeId && p.id === excludeId) return false
      if (subject !== 'all' && p.subject !== subject) return false
      if (!q) return true
      return [p.name, p.subject, p.id, p.authorName].some((v) =>
        String(v || '').toLowerCase().includes(q),
      )
    })
  }, [products, search, subject, excludeId])

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-3">
      <span className={BOOKSTORE_LABEL_CLASS}>{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books…"
            className="w-full rounded-lg border border-[#d8dce3] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#7c5cbf] focus:ring-2 focus:ring-[#7c5cbf]/20"
          />
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-lg border border-[#d8dce3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7c5cbf]"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All subjects' : s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid max-h-[280px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
        {filtered.map((p) => {
          const selected = selectedIds.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-2.5 text-left transition',
                selected
                  ? 'border-[#7c5cbf] bg-[#f3f0fa] ring-2 ring-[#7c5cbf]/25'
                  : 'border-[#e8ecf2] bg-white hover:border-[#c4b8e8]',
              )}
            >
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-[#eee]">
                <BookThumb product={p} />
                {selected && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7c5cbf] text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-semibold text-[#111]">{p.name}</p>
                <p className="text-[10px] text-[#686868]">{p.subject}</p>
                <p className="text-xs font-bold text-[#7c5cbf]">{formatINR(p.discountPrice)}</p>
              </div>
            </button>
          )
        })}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-[#686868]">No books match your filters.</p>
      )}
    </div>
  )
}
