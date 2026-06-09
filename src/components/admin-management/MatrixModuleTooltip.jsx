import { cn } from '../../utils/cn'

/** Compact hover tooltip for matrix module headers — features + description. */
export default function MatrixModuleTooltip({
  title,
  description,
  features = [],
  children,
  className,
}) {
  const preview = features.slice(0, 8)
  const remaining = features.length - preview.length

  return (
    <div className={cn('group/tip relative flex flex-col items-center', className)}>
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-50 hidden w-56 -translate-x-1/2 rounded-xl border border-slate-200/90 bg-slate-900 px-3.5 py-3 text-left shadow-xl group-hover/tip:block group-focus-within/tip:block"
      >
        <p className="text-xs font-bold text-white">{title}</p>
        {description ? (
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{description}</p>
        ) : null}
        {preview.length > 0 ? (
          <ul className="mt-2.5 space-y-1 border-t border-slate-700/80 pt-2">
            {preview.map((label) => (
              <li key={label} className="text-[11px] text-slate-200">
                · {label}
              </li>
            ))}
            {remaining > 0 ? (
              <li className="text-[10px] font-medium text-slate-400">+{remaining} more</li>
            ) : null}
          </ul>
        ) : null}
        <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-200/90 bg-slate-900" />
      </div>
    </div>
  )
}
