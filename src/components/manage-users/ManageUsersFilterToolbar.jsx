import { Search, ChevronDown } from 'lucide-react';
import { cn } from "../../utils/cn";

const controlHeight = "h-11 min-h-[44px]";

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative min-w-0 flex-1 sm:min-w-[148px] sm:flex-none lg:min-w-[160px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(
          controlHeight,
          "w-full appearance-none rounded-lg border-0 bg-[#1D72B8] pl-4 pr-10 text-sm font-semibold text-white outline-none transition",
          "focus:ring-2 focus:ring-[#4CA6E8]/50",
        )}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-white text-[#14213D]"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  );
}

export default function ManageUsersFilterToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  centerFilter,
  onCenterFilterChange,
  statusFilter,
  onStatusFilterChange,
  recordTypeFilter = 'all',
  onRecordTypeFilterChange,
  roleOptions = [],
  centerOptions = [],
}) {
  const roleOpts =
    Array.isArray(roleOptions) && roleOptions.length
      ? roleOptions
      : [{ value: "all", label: "All roles" }];

  const centerOpts =
    Array.isArray(centerOptions) && centerOptions.length
      ? centerOptions
      : [{ value: "all", label: "All centers" }];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
      <div className="relative min-w-0 flex-1 lg:max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#667085]" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search by name, email or User ID..."
          className={cn(
            controlHeight,
            "w-full rounded-lg border border-[#E7ECF5] bg-[#EEF5FF] pl-11 pr-4 text-sm text-[#14213D] outline-none transition",
            "placeholder:text-[#667085]",
            "focus:border-[#1D72B8] focus:bg-white focus:ring-2 focus:ring-[#4CA6E8]/30",
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:shrink-0 lg:flex-wrap lg:gap-3">
        <FilterSelect
          label="Role"
          value={roleFilter}
          onChange={onRoleFilterChange}
          options={roleOpts}
        />
        <FilterSelect
          label="Center"
          value={centerFilter}
          onChange={onCenterFilterChange}
          options={centerOpts}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { value: "all", label: "All status" },
            { value: "Active", label: "Active" },
            { value: "In Active", label: "Inactive" },
          ]}
        />
        {onRecordTypeFilterChange ? (
          <FilterSelect
            label="Record type"
            value={recordTypeFilter}
            onChange={onRecordTypeFilterChange}
            options={[
              { value: "all", label: "All types" },
              { value: "USER", label: "Portal users" },
              { value: "STUDENT", label: "Batch students" },
              { value: "ADMIN", label: "Admins" },
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}
