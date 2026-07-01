import { cn } from '../../../../utils/cn'
import { CBT_DATA_PANEL } from './cbtTableStyles'

/** Tests list card — title + subtitle left, search right (screenshot layout) */
export default function CbtTestsListCard({
  title = 'Tests',
  subtitle,
  search,
  children,
  className,
}) {
  return (
    <section className={cn(CBT_DATA_PANEL, className)}>
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#1a3a5c]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {search}
      </header>
      {children}
    </section>
  )
}
