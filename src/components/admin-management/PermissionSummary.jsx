export default function PermissionSummary({ allowed, restricted, total, className }) {
  return (
    <div
      className={
        className ||
        'flex flex-wrap gap-3 rounded-xl border border-slate-200/70 bg-gradient-to-br from-slate-50/90 to-white/80 px-4 py-3 text-sm'
      }
    >
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Allowed
        </span>
        <p className="mt-0.5 text-lg font-bold text-emerald-600">{allowed}</p>
      </div>
      <div className="h-10 w-px self-center bg-slate-200" aria-hidden />
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Restricted
        </span>
        <p className="mt-0.5 text-lg font-bold text-rose-600">{restricted}</p>
      </div>
      <div className="h-10 w-px self-center bg-slate-200 max-sm:hidden" aria-hidden />
      <div className="max-sm:hidden">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Total features
        </span>
        <p className="mt-0.5 text-lg font-bold text-slate-800">{total}</p>
      </div>
    </div>
  )
}
