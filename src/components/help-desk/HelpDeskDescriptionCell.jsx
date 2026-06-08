import { cn } from '../../utils/cn'

const PREVIEW_MAX = 140

export default function HelpDeskDescriptionCell({ description, onView }) {
  const isLong = description.length > PREVIEW_MAX

  return (
    <div className="w-[260px] max-w-[260px]">
      <button
        type="button"
        onClick={onView}
        className={cn(
          'group block w-full text-left',
          'rounded-md py-0.5 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40',
        )}
      >
        <p className="line-clamp-2 text-sm leading-[1.45] text-[#686868] group-hover:text-[#444]">
          {description}
        </p>
        <span className="mt-1.5 block text-xs font-semibold leading-none text-[#55ace7] transition group-hover:text-[#246392] group-hover:underline">
          {isLong ? 'View More' : 'View message'}
        </span>
      </button>
    </div>
  )
}
