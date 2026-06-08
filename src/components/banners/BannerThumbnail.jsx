import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getBannerImageSrc } from '../../data/bannersData'

export default function BannerThumbnail({ banner, onClick, className }) {
  const src = getBannerImageSrc(banner)
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          'inline-flex h-10 w-16 shrink-0 items-center justify-center rounded bg-[#e5e7eb] text-[#9ca3af] transition',
          onClick && 'cursor-pointer hover:ring-2 hover:ring-[#55ace7]/40',
          className,
        )}
        aria-label={onClick ? 'View banner placeholder' : 'No banner image'}
      >
        <ImageOff className="h-4 w-4" aria-hidden />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'group relative h-10 w-16 shrink-0 overflow-hidden rounded ring-offset-1 transition',
        onClick && 'cursor-pointer hover:ring-2 hover:ring-[#55ace7]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]',
        className,
      )}
      aria-label="Preview banner image"
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </button>
  )
}
