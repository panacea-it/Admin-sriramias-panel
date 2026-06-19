import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { dashboardNavItemClass } from '../../constants/dashboardNavigation'

export default function DashboardNavLink({ to, children, className, ariaLabel, style }) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      style={style}
      className={cn(dashboardNavItemClass, className)}
    >
      {children}
    </Link>
  )
}
