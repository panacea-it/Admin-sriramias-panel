import { Search } from 'lucide-react'

export default function PermissionSearch({ value, onChange, placeholder = 'Search features…', id }) {
  return (
    <label htmlFor={id} className="relative block w-full">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15"
      />
    </label>
  )
}
