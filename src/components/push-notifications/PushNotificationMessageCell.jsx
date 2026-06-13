import { memo } from 'react'
import { cn } from '../../utils/cn'

export const MESSAGE_PREVIEW_LENGTH = 38

export function truncateNotificationMessage(message, max = MESSAGE_PREVIEW_LENGTH) {
  const text = String(message || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}...`
}

function PushNotificationMessageCell({ message, onOpen }) {
  const preview = truncateNotificationMessage(message)
  const isTruncated = String(message || '').replace(/\s+/g, ' ').trim().length > MESSAGE_PREVIEW_LENGTH

  return (
    <button
      type="button"
      onClick={() => onOpen(message)}
      title={isTruncated ? message : 'View full message'}
      aria-label={isTruncated ? `View full message: ${preview}` : `Message: ${preview}`}
      className={cn(
        'block max-w-[220px] text-left text-sm text-[#333] transition sm:max-w-[280px] sm:text-base',
        'rounded-md px-1 py-0.5 hover:bg-[#eef6fc] hover:text-[#246392] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40',
      )}
    >
      {preview}
    </button>
  )
}

export default memo(PushNotificationMessageCell)
