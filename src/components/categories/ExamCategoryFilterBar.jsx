import { Search, MapPin } from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  CATEGORY_FILTER_BAR_SHELL,
  CATEGORY_SEARCH_INPUT_CLASS,
  categoryFilterGridClass,
} from '../../utils/categoryUiStandards'
import { CategoryFilterSelect } from './CategoryFilterBar'

export default function ExamCategoryFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search Category',
  program,
  onProgramChange,
  programOptions = [],
  centerFilter,
  onCenterFilterChange,
  centerOptions = [],
  status,
  onStatusChange,
  statusOptions = [],
}) {
  const filterCount =
    (programOptions.length > 0 && onProgramChange ? 1 : 0) +
    (centerOptions.length > 0 && onCenterFilterChange ? 1 : 0) +
    (onStatusChange && statusOptions.length > 0 ? 1 : 0)

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

        {programOptions.length > 0 && onProgramChange && (
          <CategoryFilterSelect
            label="Program"
            value={program}
            onChange={onProgramChange}
            options={programOptions}
          />
        )}
        {centerOptions.length > 0 && onCenterFilterChange && (
          <CategoryFilterSelect
            label="Center"
            value={centerFilter}
            onChange={onCenterFilterChange}
            options={centerOptions}
            icon={MapPin}
          />
        )}
        {onStatusChange && statusOptions.length > 0 && (
          <CategoryFilterSelect
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={statusOptions}
          />
        )}
      </div>
    </div>
  )
}
