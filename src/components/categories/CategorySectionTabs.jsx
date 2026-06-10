import { cn } from '../../utils/cn'
import { CATEGORY_HUB_TABS } from '../../constants/categoryHubSections'

export default function CategorySectionTabs({ activeTab, onTabChange }) {
  return (
    <nav
      className="flex flex-wrap gap-2 sm:gap-2.5"
      aria-label="Category sections"
    >
      {CATEGORY_HUB_TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'inline-flex min-h-[40px] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 sm:px-5 sm:text-[15px]',
              isActive
                ? 'bg-gradient-to-r from-[#55ace7] to-[#246392] text-white shadow-[0_4px_14px_rgba(36,99,146,0.35)]'
                : 'bg-white text-[#222] shadow-[0_4px_12px_rgba(15,23,42,0.08)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.1)]',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
