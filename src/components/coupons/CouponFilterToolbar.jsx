import { Search, ChevronDown } from 'lucide-react';

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[130px]">
      <select
        value={value}
        onChange={onChange}
        aria-label={label}
        className="h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 sm:text-base"
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

export default function CouponFilterToolbar({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  categoryOptions = [],
}) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3">
        <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder="Search Coupons"
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:pl-11 sm:text-base"
          />
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <FilterSelect
            label="Category"
            value={category}
            onChange={onCategoryChange}
            options={[
              { value: "all", label: "All Categories" },
              ...(categoryOptions.length
                ? categoryOptions
                : [
                    { value: "Course", label: "Course" },
                    { value: "Books", label: "Books" },
                    { value: "TestSeries", label: "Test Series" },
                  ]),
            ]}
          />
          <FilterSelect
            label="Type"
            value={type}
            onChange={onTypeChange}
            options={[
              { value: "all", label: "Type" },
              { value: "Percentage", label: "Percentage" },
              { value: "Flat Discount", label: "Flat Discount" },
              { value: "BOGO", label: "BOGO" },
            ]}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={onStatusChange}
            options={[
              { value: "all", label: "Status" },
              { value: "Active", label: "Active" },
              { value: "In Active", label: "Deactivated" },
            ]}
          />
        </div>
      </div>
      <p className="mt-2 flex items-center justify-end gap-1.5 text-xs font-semibold text-[#69df66] sm:text-sm">
        <span className="text-base leading-none">★</span>
        <span>-Top Performing Coupon</span>
      </p>
    </div>
  );
}
