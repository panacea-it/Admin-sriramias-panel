import { Search, MapPin } from 'lucide-react'
import {
  CATEGORY_FILTER_BAR_SHELL,
  CATEGORY_SEARCH_INPUT_CLASS,
  categoryFilterGridClass,
} from '../../utils/categoryUiStandards'
import { CategoryFilterSelect } from './CategoryFilterBar'

export default function ExamSubCategoryFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search Sub Category',
  program,
  onProgramChange,
  programOptions = [],
  category,
  onCategoryChange,
  categoryOptions = [],
  centerFilter,
  onCenterFilterChange,
  centerOptions = [],
  status,
  onStatusChange,
  statusOptions = [],
}) {
  const filterCount = 4

  return (
    <div className={CATEGORY_FILTER_BAR_SHELL}>
      <div className={categoryFilterGridClass(filterCount)}>
        <div className="relative min-w-0 w-full sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className={CATEGORY_SEARCH_INPUT_CLASS}
          />
        </div>

        <CategoryFilterSelect
          label="Program"
          value={program}
          onChange={onProgramChange}
          options={programOptions}
        />
        <CategoryFilterSelect
          label="Exam Category"
          value={category}
          onChange={onCategoryChange}
          options={categoryOptions}
        />
        <CategoryFilterSelect
          label="Center"
          value={centerFilter}
          onChange={onCenterFilterChange}
          options={centerOptions}
          icon={MapPin}
        />
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
