import { BookOpen, X } from 'lucide-react'
import Modal from '../ui/Modal'
import CategoryStatusBadge from './CategoryStatusBadge'
import { formatCategoryDateTime } from '../../utils/formatDateTime'

export default function ViewSubjectCategoryModal({ open, onClose, item }) {
  if (!item) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title={`View ${item.name}`}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex items-center justify-between bg-gradient-to-r from-[#55ace7] to-[#246392] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <BookOpen className="h-5 w-5 text-white" />
            </span>
            <h2 className="text-lg font-bold text-white">{item.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-[#cbeeff] text-base font-bold text-[#246392]">
              {item.iconUrl ? (
                <img src={item.iconUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                item.iconLabel
              )}
            </span>
            <div>
              <p className="text-xs font-medium text-[#686868]">Main Category</p>
              <p className="mt-0.5 text-sm font-semibold text-[#222]">
                {item.mainCategoryName || '—'}
              </p>
              <div className="mt-2">
                <CategoryStatusBadge status={item.status} />
              </div>
            </div>
          </div>

          {item.description ? (
            <div>
              <p className="text-xs font-medium text-[#686868]">Description</p>
              <p className="mt-1 text-sm text-[#222]">{item.description}</p>
            </div>
          ) : null}

          {item.formData?.scheduleDate ? (
            <dl className="grid gap-3 rounded-xl bg-[#f7f9fc] p-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-[#686868]">Date</dt>
                <dd className="mt-1 text-sm font-medium text-[#222]">{item.formData.scheduleDate}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#686868]">Time</dt>
                <dd className="mt-1 text-sm font-medium text-[#222]">
                  {item.formData.scheduledTime ||
                    `${item.formData.timeHrs}:${item.formData.timeMin}:${item.formData.timeSec}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#686868]">Duration</dt>
                <dd className="mt-1 text-sm font-medium text-[#222]">
                  {item.formData.duration ||
                    `${item.formData.durationHrs}:${item.formData.durationMin}:${item.formData.durationSec}`}
                </dd>
              </div>
            </dl>
          ) : null}

          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-[#686868]">Created On</dt>
              <dd className="mt-1 text-sm font-medium text-[#222]">
                {formatCategoryDateTime(item.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#686868]">Modified On</dt>
              <dd className="mt-1 text-sm font-medium text-[#222]">
                {formatCategoryDateTime(item.modifiedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Modal>
  )
}
