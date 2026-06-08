export default function BookstoreBarChart({ data, valueKey, labelKey, maxValue, formatValue }) {
  const max = maxValue || Math.max(...data.map((d) => d[valueKey]), 1)
  return (
    <div className="flex h-48 items-end gap-2 sm:gap-3">
      {data.map((item) => (
        <div key={item[labelKey]} className="group flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-[#4a3d8f] to-[#7c5cbf] transition group-hover:from-[#3d326f] group-hover:to-[#6a4fb0]"
            style={{ height: `${Math.max(8, (item[valueKey] / max) * 100)}%` }}
            title={formatValue ? formatValue(item[valueKey]) : String(item[valueKey])}
          />
          <span className="text-center text-[10px] font-medium text-[#686868] sm:text-xs">
            {item[labelKey]}
          </span>
        </div>
      ))}
    </div>
  )
}
