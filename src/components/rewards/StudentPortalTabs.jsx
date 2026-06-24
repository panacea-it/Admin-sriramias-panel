import { NavLink } from 'react-router-dom'
import { STUDENT_REWARDS_NAV_ITEMS } from '../../constants/rewardsNav'
import { cn } from '../../utils/cn'
import { rewardsTabNavClass } from './rewardsModalUi'

function studentTabClass(isActive) {
  return cn(
    'inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:py-2 sm:text-[13px]',
    isActive
      ? 'bg-gradient-to-r from-[#1a3a5c] to-[#03045e] text-white shadow-sm'
      : 'bg-white text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-50',
  )
}

export default function StudentPortalTabs() {
  return (
    <nav className={rewardsTabNavClass()} aria-label="Student rewards">
      {STUDENT_REWARDS_NAV_ITEMS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path !== '/student/wallet'}
          className={({ isActive }) => studentTabClass(isActive)}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
