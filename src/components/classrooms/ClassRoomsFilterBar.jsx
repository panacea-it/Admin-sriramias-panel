import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  CATEGORY_FILTER_BAR_SHELL,
  CATEGORY_SEARCH_INPUT_CLASS,
  categoryFilterGridClass,
} from '../../utils/categoryUiStandards'
import { CategoryFilterSelect } from '../categories/CategoryFilterBar'

const DEFAULT_STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Deactivated', label: 'Deactivated' },
]

export default function ClassRoomsFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search by Code, Center or City / Place...',
  cityFilter,
  onCityFilterChange,
  cityOptions = [],
  centerFilter,
  onCenterFilterChange,
  centerOptions,
  status,
  onStatusChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}) {
  const filterCount =
    (cityOptions.length > 0 && onCityFilterChange ? 1 : 0) +
    (centerOptions && onCenterFilterChange ? 1 : 0) +
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
            aria-label={searchPlaceholder}
            className={CATEGORY_SEARCH_INPUT_CLASS}
          />
        </div>

        {cityOptions.length > 0 && onCityFilterChange && (
          <CategoryFilterSelect
            label="City"
            value={cityFilter}
            onChange={onCityFilterChange}
            options={cityOptions}
          />
        )}

        {centerOptions && onCenterFilterChange && (
          <CategoryFilterSelect
            label="Center"
            value={centerFilter}
            onChange={onCenterFilterChange}
            options={centerOptions}
          />
        )}

        {onStatusChange && (
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
