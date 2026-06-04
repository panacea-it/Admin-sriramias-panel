export default function BookstoreDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 shadow-sm"
          />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-[380px] rounded-2xl bg-white shadow-sm lg:col-span-2" />
        <div className="h-[300px] rounded-2xl bg-white shadow-sm" />
        <div className="h-[300px] rounded-2xl bg-white shadow-sm" />
        <div className="h-[300px] rounded-2xl bg-white shadow-sm" />
      </div>
      <div className="h-[520px] rounded-2xl bg-white shadow-sm" />
      <div className="h-[520px] rounded-2xl bg-white shadow-sm" />
    </div>
  )
}
