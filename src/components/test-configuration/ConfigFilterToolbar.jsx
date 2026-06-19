export default function ConfigFilterToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  status,
  onStatusChange,
  extraFilters,
}) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
      <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:text-base"
        />
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        {extraFilters}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-10 min-h-[38px] w-full appearance-none rounded-lg border-0 bg-[#55ace7] px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 sm:w-auto sm:min-w-[160px] sm:text-base"
        >
          <option value="all" className="bg-white text-[#222]">
            Status
          </option>
          <option value="Active" className="bg-white text-[#222]">
            Active
          </option>
          <option value="Deactivated" className="bg-white text-[#222]">
            Inactive
          </option>
        </select>
      </div>
    </div>
  )
}

export function FilterSelect({ value, onChange, label, options = [], includeAll = true, optionLabels = {} }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 min-h-[38px] w-full appearance-none rounded-lg border-0 bg-[#55ace7] px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 sm:w-auto sm:min-w-[160px] sm:text-base"
    >
      {includeAll && (
        <option value="all" className="bg-white text-[#222]">
          {label}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-white text-[#222]">
          {optionLabels[opt] || opt}
        </option>
      ))}
    </select>
  )
}
