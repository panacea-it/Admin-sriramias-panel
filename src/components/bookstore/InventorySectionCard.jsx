import { cn } from '../../utils/cn'

export default function InventorySectionCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
  className,
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2fc] text-[#246392]">
              <Icon className="h-5 w-5" strokeWidth={2.2} />
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#111]">{title}</h2>
              {badge != null ? (
                <span className="inline-flex items-center rounded-full bg-[#7c5cbf]/10 px-2.5 py-0.5 text-xs font-bold text-[#5c4694]">
                  {badge}
                </span>
              ) : null}
            </div>
            {description ? (
              <p className="mt-0.5 text-sm text-[#686868]">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}
