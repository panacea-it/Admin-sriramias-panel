import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { liveClassesTw } from '../../constants/liveClassesTheme'

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[140px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={liveClassesTw.filterSelect}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
]

export default function LiveClassesFilterBar({
  search,
  onSearchChange,
  lessonType,
  onLessonTypeChange,
  status,
  onStatusChange,
  subjectFilter,
  onSubjectFilterChange,
  subjectOptions,
  sort,
  onSortChange,
  selectedCount,
  onBulkDisable,
  onBulkDelete,
}) {
  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex min-h-14 flex-wrap items-center justify-between gap-3',
          liveClassesTw.filterBar,
        )}
      >
        <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder="Search lessons, teachers, subjects…"
            className={cn(liveClassesTw.searchInput, 'sm:pl-11')}
          />
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {onLessonTypeChange && (
            <FilterSelect
              label="Lesson type"
              value={lessonType}
              onChange={onLessonTypeChange}
              options={[
                { value: 'all', label: 'All types' },
                { value: 'Live', label: 'Live' },
                { value: 'Recording', label: 'Recording' },
              ]}
            />
          )}
          {subjectOptions && (
            <FilterSelect
              label="Subject"
              value={subjectFilter}
              onChange={onSubjectFilterChange}
              options={subjectOptions}
            />
          )}
          <FilterSelect
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={[
              { value: 'all', label: 'Status' },
              { value: 'Scheduled', label: 'Scheduled' },
              { value: 'Live', label: 'Live' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Disabled', label: 'Disabled' },
              { value: 'Draft', label: 'Draft' },
            ]}
          />
          <FilterSelect label="Sort" value={sort} onChange={onSortChange} options={SORT_OPTIONS} />
        </div>
      </div>

      {selectedCount > 0 && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 text-sm',
            liveClassesTw.bulkBar,
          )}
        >
          <span className="font-semibold text-[#246392]">{selectedCount} selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBulkDisable}
              className="rounded-lg bg-white px-3 py-1.5 font-medium text-[#246392] shadow-sm hover:bg-[#e8f4fc]"
            >
              Disable
            </button>
            <button
              type="button"
              onClick={onBulkDelete}
              className="rounded-lg bg-[#c96565] px-3 py-1.5 font-medium text-white shadow-sm hover:bg-[#b94b4b]"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
