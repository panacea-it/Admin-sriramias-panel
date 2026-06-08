import PageBanner from '../figma/PageBanner'
import FinanceBreadcrumbs from './FinanceBreadcrumbs'
import { cn } from '../../utils/cn'

export default function FinancePageShell({
  icon,
  title,
  actions,
  breadcrumbs = [],
  children,
  className,
}) {
  return (
    <div className={cn('flex flex-col gap-4 p-4 sm:gap-5 sm:p-6', className)}>
      {title && (
        <FinanceBreadcrumbs items={breadcrumbs.length > 0 ? breadcrumbs : [{ label: title }]} />
      )}
      <PageBanner icon={icon} title={title}>
        {actions}
      </PageBanner>
      {children}
    </div>
  )
}
