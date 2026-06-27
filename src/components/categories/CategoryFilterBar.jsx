import { Search, ChevronDown, MapPin } from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  CATEGORY_FILTER_BAR_SHELL,
  CATEGORY_FILTER_SELECT_CLASS,
  CATEGORY_SEARCH_INPUT_CLASS,
  categoryFilterGridClass,
} from '../../utils/categoryUiStandards'

export function CategoryFilterSelect({
  label,
  value,
  onChange,
  options,
  icon: Icon,
  formatOptionLabel,
}) {
  return (
    <div className="relative min-w-0 w-full">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white/90" />
      )}
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(CATEGORY_FILTER_SELECT_CLASS, Icon ? 'pl-9 pr-9' : 'pl-4 pr-9')}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {formatOptionLabel ? formatOptionLabel(opt) : opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  )
}

const DEFAULT_STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'In Active', label: 'Deactivated' },
]

export default function CategoryFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search Category',
  status,
  onStatusChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  centerFilter,
  onCenterFilterChange,
  centerOptions,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  subjectFilter,
  onSubjectFilterChange,
  subjectOptions,
  centerIcon = MapPin,
}) {
  const showCategory = Boolean(categoryOptions)
  const showSubject = Boolean(subjectOptions)
  const showCenter = Boolean(centerOptions && onCenterFilterChange)
  const showStatus = Boolean(onStatusChange)
  const filterCount = [showCategory, showSubject, showCenter, showStatus].filter(Boolean).length

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

        {showCategory && (
          <CategoryFilterSelect
            label="Category"
            value={categoryFilter}
            onChange={onCategoryFilterChange}
            options={categoryOptions}
          />
        )}
        {showSubject && (
          <CategoryFilterSelect
            label="Subject"
            value={subjectFilter}
            onChange={onSubjectFilterChange}
            options={subjectOptions}
          />
        )}
        {showCenter && (
          <CategoryFilterSelect
            label="Center"
            value={centerFilter}
            onChange={onCenterFilterChange}
            options={centerOptions}
            icon={centerIcon}
          />
        )}
        {showStatus && (
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
