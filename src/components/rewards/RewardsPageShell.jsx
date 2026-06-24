import PageBanner from '../figma/PageBanner'
import { cn } from '../../utils/cn'
import { ADMIN_PAGE_INNER } from '../../utils/adminUiStandards'

export default function RewardsPageShell({ icon, title, actions, children, className }) {
  return (
    <div className={cn(ADMIN_PAGE_INNER, className)}>
      <PageBanner icon={icon} title={title}>
        {actions}
      </PageBanner>
      {children}
    </div>
  )
}
