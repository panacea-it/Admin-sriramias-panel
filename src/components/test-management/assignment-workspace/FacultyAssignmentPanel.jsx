import { MoreHorizontal, Search, UserPlus } from 'lucide-react'
import { cn } from '../../../utils/cn'
import WorkloadIndicator from './WorkloadIndicator'

function FacultyCard({ faculty, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(faculty.id)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
        selected
          ? 'border-[#55ace7] bg-[#eef6fc] ring-1 ring-[#55ace7]/40'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-[#55ace7] bg-[#55ace7]' : 'border-slate-300 bg-white',
        )}
      >
        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a3a5c] text-[10px] font-bold text-white">
        {faculty.name
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#1a3a5c]">{faculty.name}</span>
        <span className="block text-xs text-slate-500">Workload: {faculty.pendingCount} pending</span>
      </span>
      <WorkloadIndicator level={faculty.workloadLevel} />
      <MoreHorizontal className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    </button>
  )
}

export default function FacultyAssignmentPanel({
  search,
  onSearchChange,
  faculty,
  selectedFacultyId,
  onSelectFaculty,
  loading,
}) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2fc] text-[#55ace7]">
          <UserPlus className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <h3 className="text-sm font-bold text-[#1a3a5c]">Assign To</h3>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter faculty..."
          className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-[#55ace7]/30"
        />
      </div>

      <div className={cn('mt-3 max-h-[320px] space-y-2 overflow-y-auto', loading && 'pointer-events-none opacity-50')}>
        {faculty.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No eligible faculty available for reassignment.
          </p>
        ) : (
          faculty.map((f) => (
            <FacultyCard
              key={f.id}
              faculty={f}
              selected={selectedFacultyId === f.id}
              onSelect={onSelectFaculty}
            />
          ))
        )}
      </div>
    </article>
  )
}
