export default function SalesTableSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="h-10 rounded-lg bg-[#f3f4f6]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-[#f9fafb]" />
      ))}
    </div>
  )
}
