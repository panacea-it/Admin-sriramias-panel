import { memo } from 'react'
import { cn } from '../../utils/cn'

export const MESSAGE_PREVIEW_LENGTH = 38

export function truncateNotificationMessage(message, max = MESSAGE_PREVIEW_LENGTH) {
  const text = String(message || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}...`
}

function PushNotificationMessageCell({ message }) {
  const fullText = String(message || '').replace(/\s+/g, ' ').trim()
  const preview = truncateNotificationMessage(fullText)
  const isTruncated = fullText.length > MESSAGE_PREVIEW_LENGTH

  return (
    <div className="group/tip relative w-full min-w-0 max-w-full">
      <span
        className={cn(
          'block truncate text-sm leading-snug text-[#111111]',
          isTruncated && 'cursor-default',
        )}
        aria-label={fullText}
      >
        {preview}
      </span>
      {isTruncated && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-30 max-w-[min(20rem,calc(100vw-2rem))]',
            'rounded-lg bg-[#1a3a5c] px-3 py-2 text-left text-xs font-medium leading-snug text-white shadow-[0_8px_24px_rgba(15,23,42,0.22)]',
            'scale-95 whitespace-normal opacity-0 transition-all duration-200 ease-out',
            'group-hover/tip:scale-100 group-hover/tip:opacity-100',
          )}
        >
          {fullText}
        </span>
      )}
    </div>
  )
}

export default memo(PushNotificationMessageCell)
