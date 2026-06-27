import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { ADMIN_SORT_OPTIONS } from '../../utils/adminManagementHelpers'
import { STATUS_FILTER_OPTIONS } from '../../constants/recordStatus'

function FilterSelect({ label, value, onChange, options, disabled }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[150px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        disabled={disabled}
        className={cn(
          'h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:opacity-60 sm:text-base',
        )}
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

export default function AdminManagementFilterToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  roleOptions = [],
  centerFilter,
  onCenterFilterChange,
  centerOptions = [],
  statusFilter,
  onStatusFilterChange,
  sortPreset,
  onSortPresetChange,
  disabled = false,
  onRefresh,
}) {
  const roleFilterOptions = [{ value: 'all', label: 'All Roles' }, ...roleOptions]
  const centerFilterOptions = [{ value: 'all', label: 'All Centers' }, ...centerOptions]
  const sortOptions = ADMIN_SORT_OPTIONS

  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
      <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search by name, email, employee ID, contact, role, or center"
          disabled={disabled}
          className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60 sm:pl-11 sm:text-base"
        />
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <FilterSelect
          label="Role"
          value={roleFilter}
          onChange={onRoleFilterChange}
          options={roleFilterOptions}
          disabled={disabled}
        />
        <FilterSelect
          label="Center"
          value={centerFilter}
          onChange={onCenterFilterChange}
          options={centerFilterOptions}
          disabled={disabled}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={STATUS_FILTER_OPTIONS}
          disabled={disabled}
        />
        <FilterSelect
          label="Sort"
          value={sortPreset}
          onChange={onSortPresetChange}
          options={sortOptions}
          disabled={disabled}
        />
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  )
}
