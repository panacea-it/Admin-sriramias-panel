import { CalendarX2 } from 'lucide-react'

export default function CalendarEmptyState({ hasFilters, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e8f4fc] bg-[#fafbff] px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6fc] text-[#55ace7]">
        <CalendarX2 className="h-7 w-7" />
      </span>
      <h3 className="text-base font-bold text-[#1a3a5c]">No events to display</h3>
      <p className="mt-2 max-w-sm text-sm text-[#686868]">
        {hasFilters
          ? 'No classes match your current filters. Try adjusting centers, faculty, or search.'
          : 'No scheduled classes for this period. Create sessions from Schedule Class, Live Sessions, or Recorded Classes.'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 rounded-lg bg-[#55ace7] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#4a9ad4]"
        >
          Reset Filters
        </button>
      )}
    </div>
  )
}
