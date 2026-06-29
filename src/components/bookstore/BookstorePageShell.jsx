import PageBanner from '../figma/PageBanner'
import { cn } from '../../utils/cn'

export default function BookstorePageShell({ icon, title, subtitle, actions, children, className }) {
  return (
    <div className={cn('flex flex-col gap-4 p-4 sm:gap-5 sm:p-6', className)}>
      <PageBanner icon={icon} title={title} subtitle={subtitle}>
        {actions}
      </PageBanner>
      {children}
    </div>
  )
}
