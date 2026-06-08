import { useRef } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { cn } from '../../../utils/cn'
import { isNavItemActive } from '../../../constants/navigation'
import SidebarSubmenuItem from './SidebarSubmenuItem'

const childIdle = 'rounded-lg text-white/90 hover:bg-white/[0.06] hover:text-white'

export default function AccordionSidebarSection({
  submenu,
  isOpen,
  onToggle,
  onNavigate,
  onExpand,
}) {
  const blockRef = useRef(null)
  const location = useLocation()
  const hasActiveChild = submenu.children.some((child) =>
    isNavItemActive(child, location.pathname),
  )

  const handleToggle = () => {
    const willOpen = !isOpen
    onToggle()
    if (willOpen) setTimeout(() => onExpand?.(blockRef.current), 320)
  }

  return (
    <div ref={blockRef} className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-[13px] font-medium leading-snug transition-colors duration-150',
          isOpen || hasActiveChild ? 'bg-white/[0.08] text-white' : childIdle,
        )}
      >
        <span>{submenu.label}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 opacity-90 transition-transform duration-300" strokeWidth={2.5} />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 opacity-90 transition-transform duration-300" strokeWidth={2.5} />
        )}
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              'mt-0.5 flex flex-col gap-0.5 transition-opacity duration-300',
              submenu.variant === 'inline'
                ? 'px-0'
                : 'rounded-xl bg-white p-2',
              isOpen ? 'opacity-100' : 'opacity-0',
            )}
          >
            {submenu.children.map((child) => (
              <SidebarSubmenuItem
                key={child.path || child.id}
                to={child.path}
                label={child.label}
                icon={child.icon}
                onNavigate={onNavigate}
                comingSoon={child.comingSoon}
                disabled={child.disabled}
                variant={submenu.variant === 'inline' ? 'inline' : 'panel'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
