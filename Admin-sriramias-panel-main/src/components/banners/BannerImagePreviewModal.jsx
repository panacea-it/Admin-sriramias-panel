import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import Modal from '../ui/Modal'
import { getBannerImageSrc } from '../../data/bannersData'

export default function BannerImagePreviewModal({ open, onClose, banner }) {
  const src = banner ? getBannerImageSrc(banner) : null
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [open, banner?.id, src])

  const showFallback = !src || failed

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={banner?.course ? `Banner — ${banner.course}` : 'Banner preview'}
      className="!max-w-3xl"
    >
      <div className="overflow-hidden rounded-2xl bg-[#111] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="flex min-h-[200px] max-h-[min(80dvh,720px)] items-center justify-center p-4 sm:p-8">
          {showFallback ? (
            <div className="flex flex-col items-center gap-3 text-center text-white/70">
              <ImageOff className="h-12 w-12" aria-hidden />
              <p className="text-sm font-medium">No banner image available</p>
            </div>
          ) : (
            <img
              key={src}
              src={src}
              alt={banner?.course ? `Banner for ${banner.course}` : 'Banner'}
              className="max-h-[min(72dvh,640px)] w-auto max-w-full object-contain"
              onError={() => setFailed(true)}
            />
          )}
        </div>
        {banner?.course ? (
          <p className="border-t border-white/10 px-4 py-3 text-center text-sm font-medium text-white/80 sm:px-6">
            {banner.course}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
