import { Search, MapPin } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatCategoryStatusDisplayLabel } from '../../utils/categoryStatusHelpers'
import {
  CATEGORY_FILTER_BAR_SHELL,
  CATEGORY_SEARCH_INPUT_CLASS,
  categoryFilterGridClass,
} from '../../utils/categoryUiStandards'
import { CategoryFilterSelect } from './CategoryFilterBar'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Deactivated' },
]

const formatStatusOptionLabel = (opt) =>
  formatCategoryStatusDisplayLabel(opt.label ?? opt.value)

export default function ProgramsFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search by program name or ID...',
  centre,
  onCentreChange,
  centreOptions = [],
  program,
  onProgramChange,
  programOptions,
  status,
  onStatusChange,
  statusOptions = STATUS_OPTIONS,
}) {
  const filterCount =
    (onCentreChange ? 1 : 0) +
    (programOptions?.length > 0 && onProgramChange ? 1 : 0) +
    (onStatusChange ? 1 : 0)

  return (
    <div className={CATEGORY_FILTER_BAR_SHELL}>
      <div className={categoryFilterGridClass(filterCount)}>
        <div
          className={cn(
            'relative min-w-0 w-full',
            filterCount > 0 && 'sm:col-span-2 lg:col-span-1',
          )}
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className={CATEGORY_SEARCH_INPUT_CLASS}
          />
        </div>

        {onCentreChange && (
          <CategoryFilterSelect
            label="Centre Wise"
            value={centre}
            onChange={onCentreChange}
            options={centreOptions}
            icon={MapPin}
          />
        )}
        {programOptions?.length > 0 && onProgramChange && (
          <CategoryFilterSelect
            label="Program"
            value={program}
            onChange={onProgramChange}
            options={programOptions}
          />
        )}
        {onStatusChange && (
          <CategoryFilterSelect
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={statusOptions}
            formatOptionLabel={formatStatusOptionLabel}
          />
        )}
      </div>
    </div>
  )
}
