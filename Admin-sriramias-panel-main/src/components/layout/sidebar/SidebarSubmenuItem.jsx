import { NavLink } from 'react-router-dom'
import { cn } from '../../../utils/cn'

const inlineActive = 'rounded-lg bg-[#1e2145] text-white'
const inlineIdle = 'rounded-lg text-white/90 hover:bg-white/[0.06] hover:text-white'

export default function SidebarSubmenuItem({
  to,
  label,
  icon: Icon,
  onNavigate,
  disabled,
  comingSoon,
  variant = 'panel',
}) {
  const isDisabled = disabled || comingSoon
  const isInline = variant === 'inline'

  if (isDisabled) {
    return (
      <span
        className={cn(
          'flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium leading-snug',
          isInline ? 'text-white/40' : 'text-[#05092b]/40',
        )}
        title={comingSoon ? 'Coming soon' : undefined}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-50" strokeWidth={2} />
        <span>{label}</span>
        {comingSoon && (
          <span
            className={cn(
              'ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              isInline
                ? 'bg-white/[0.06] text-white/45'
                : 'bg-[#05092b]/[0.06] text-[#05092b]/45',
            )}
          >
            Soon
          </span>
        )}
      </span>
    )
  }

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-[13px] font-medium leading-snug transition-colors duration-150',
          isInline
            ? isActive
              ? inlineActive
              : inlineIdle
            : isActive
              ? 'bg-gradient-to-r from-[#d1e9f6] to-[#b3d9eb] text-[#05092b]'
              : 'px-3 text-[#05092b] hover:bg-[#05092b]/[0.05]',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  )
}
