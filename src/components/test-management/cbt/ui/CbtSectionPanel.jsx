import { cn } from '../../../../utils/cn'
import { CBT_PANEL_CLASS } from './cbtUiConstants'

export default function CbtSectionPanel({
  title,
  subtitle,
  children,
  className,
  headerClassName,
  bodyClassName,
  headerAction,
}) {
  return (
    <section className={cn(CBT_PANEL_CLASS, className)}>
      {(title || subtitle || headerAction) && (
        <header
          className={cn(
            'mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between',
            headerClassName,
          )}
        >
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-bold text-[#1a3a5c] sm:text-lg">{title}</h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs font-medium text-[#686868] sm:text-sm">{subtitle}</p>
            ) : null}
          </div>
          {headerAction ? (
            <div className="w-full shrink-0 sm:w-auto sm:min-w-[280px] sm:max-w-md">{headerAction}</div>
          ) : null}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
