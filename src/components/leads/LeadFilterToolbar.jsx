import { Search, ChevronDown } from 'lucide-react';
import { cn } from "../../utils/cn";
import CrmDateFilterPicker from "../crm/CrmDateFilterPicker";
import {
  formatLeadStatusLabel,
  LEAD_STATUS_OPTIONS,
} from "../../data/leadsData";

function FilterSelect({ label, value, onChange, options, className }) {
  return (
    <div
      className={cn("relative w-full sm:w-auto sm:min-w-[150px]", className)}
    >
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className={cn(
          "h-10 w-full min-h-[38px] cursor-pointer appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none transition hover:bg-[#4a9fd8] focus:ring-2 focus:ring-[#246392]/50 sm:text-base",
        )}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-white text-[#222]"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  );
}

const statusFilterOptions = [
  { value: "all", label: "Status" },
  ...LEAD_STATUS_OPTIONS.map((status) => ({
    value: status,
    label: formatLeadStatusLabel(status),
  })),
];

export default function LeadFilterToolbar({
  search,
  onSearchChange,
  center,
  onCenterChange,
  selectedDate,
  onDateChange,
  status,
  onStatusChange,
  availableCenters = [], // NEW: Accept availableCenters prop!
}) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
      <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search By Username, Email, or Mobile"
          className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:pl-11 sm:text-base"
        />
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <FilterSelect
          label="Center"
          value={center}
          onChange={onCenterChange}
          // THE FIX: Dynamically map database centers instead of hardcoding them
          options={[
            { value: "all", label: "All Centers" },
            ...availableCenters.map((c) => ({
              value: c._id,
              label: c.centerName,
            })),
          ]}
        />
        <CrmDateFilterPicker
          value={selectedDate}
          onChange={onDateChange}
          tone="solid"
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={onStatusChange}
          options={statusFilterOptions}
          className="sm:min-w-[160px]"
        />
      </div>
    </div>
  );
}
