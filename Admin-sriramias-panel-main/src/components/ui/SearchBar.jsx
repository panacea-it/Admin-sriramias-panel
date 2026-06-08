import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}) {
  return (
    <div className={cn('relative w-full min-w-0 max-w-md', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--color-input-border)] bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[var(--color-input-focus)] focus:ring-2 focus:ring-[var(--color-primary)]/15"
      />
    </div>
  )
}
