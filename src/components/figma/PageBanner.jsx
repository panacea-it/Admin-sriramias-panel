import { cn } from '../../utils/cn'

export default function PageBanner({
  icon: Icon,
  title,
  children,
  className,
  iconClassName = 'text-[#8b98bb]',
}) {
  return (
    <div
      className={cn(
        'flex min-h-16 flex-wrap items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#df8284] px-5 py-4 shadow-[0_5px_13px_rgba(0,0,0,0.08)] sm:px-6',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
            <Icon className={cn('h-5 w-5', iconClassName)} strokeWidth={2.4} />
          </div>
        )}
        <h1 className="truncate text-lg font-bold leading-none text-white sm:text-xl">
          {title}
        </h1>
      </div>
      {children && (
        <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
          {children}
        </div>
      )}
    </div>
  )
}
