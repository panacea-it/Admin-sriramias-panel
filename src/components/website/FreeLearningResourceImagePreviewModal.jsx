import { X } from 'lucide-react'
import WebsiteFormModal from './WebsiteFormModal'

export default function FreeLearningResourceImagePreviewModal({ open, onClose, src, alt }) {
  if (!open || !src) return null

  return (
    <WebsiteFormModal open={open} onClose={onClose}>
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>
        <img src={src} alt={alt || 'Preview'} className="max-h-[80vh] w-full object-contain" />
      </div>
    </WebsiteFormModal>
  )
}
