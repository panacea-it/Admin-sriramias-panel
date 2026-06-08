import { cn } from '../../utils/cn'

export default function CategoryPageHeader({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
  /** When true, hides the banner title/subtitle (section tabs already indicate context). */
  hideTitle = false,
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80',
        className,
      )}
    >
      <div className="bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#df8284] px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            {Icon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] sm:h-12 sm:w-12">
                <Icon className="h-5 w-5 text-[#246392] sm:h-6 sm:w-6" strokeWidth={2.2} />
              </div>
            )}
            {!hideTitle && title ? (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 text-sm font-medium text-white/85">{subtitle}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
        </div>
      </div>
    </div>
  )
}
