const PREVIEW_MAX = 38

function truncateDescription(text, max = PREVIEW_MAX) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max).trim()}...`
}

export default function HelpDeskDescriptionCell({ description, onView }) {
  const isLong = description.length > PREVIEW_MAX
  const preview = truncateDescription(description)

  return (
    <div className="w-[260px] max-w-[260px]">
      <p className="text-sm leading-[1.45] text-[#686868]">{preview}</p>
      {isLong && (
        <button
          type="button"
          onClick={onView}
          className="mt-1.5 text-xs font-semibold leading-none text-[#55ace7] transition hover:text-[#246392] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40"
        >
          View More
        </button>
      )}
    </div>
  )
}
