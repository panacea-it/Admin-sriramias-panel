import { RefreshCw } from 'lucide-react'
import { cn } from '../../../../utils/cn'

export function FacultySubjectChildDashboard({ cards = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {card.label}
          </p>
          <p className={cn('mt-1 text-2xl font-bold text-[#1a3a5c]', card.tone)}>
            {card.value ?? 0}
          </p>
          {card.hint ? <p className="mt-1 text-xs text-slate-500">{card.hint}</p> : null}
        </div>
      ))}
    </div>
  )
}

export function FacultySubjectChildTabHeader({
  title,
  folderName,
  onRefresh,
  refreshing = false,
  onCreate,
  createLabel = 'Create',
  canCreate = true,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div>
        <h2 className="text-lg font-bold text-[#1a3a5c]">{title}</h2>
        {folderName ? (
          <p className="text-sm text-slate-500">Folder: {folderName}</p>
        ) : (
          <p className="text-sm text-slate-500">All folders in this category</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1a3a5c] hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
        {canCreate && onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            {createLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function FacultySubjectChildEmptyState({ title, description, onCreate, createLabel }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-[#1a3a5c]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex h-10 items-center rounded-xl bg-[#55ace7] px-5 text-sm font-semibold text-white hover:bg-[#4696cc]"
        >
          {createLabel}
        </button>
      ) : null}
    </div>
  )
}
