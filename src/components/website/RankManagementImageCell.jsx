import { useMemo, useState } from 'react'
import { cn } from '../../utils/cn'

function rankerPlaceholderSrc(name) {
  const safeName = encodeURIComponent(name?.trim() || 'Ranker')
  return `https://ui-avatars.com/api/?name=${safeName}&background=55ace7&color=ffffff&size=96&bold=true&format=png`
}

function isResolvableImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false
  const trimmed = imageUrl.trim()
  if (!trimmed || trimmed === '312×214 Kb') return false
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/')
  )
}

export default function RankManagementImageCell({ name, imageUrl, size = 'md' }) {
  const [uploadFailed, setUploadFailed] = useState(false)
  const placeholderSrc = useMemo(() => rankerPlaceholderSrc(name), [name])
  const canUseUpload = isResolvableImageUrl(imageUrl) && !uploadFailed
  const src = canUseUpload ? imageUrl.trim() : placeholderSrc

  const sizeClass =
    size === 'lg'
      ? 'h-14 w-14'
      : 'h-11 w-11'

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 bg-[#eef6fc] shadow-sm',
        sizeClass,
      )}
    >
      <img
        src={src}
        alt={name ? `${name} profile` : 'Ranker'}
        loading="lazy"
        onError={() => {
          if (canUseUpload) setUploadFailed(true)
        }}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
