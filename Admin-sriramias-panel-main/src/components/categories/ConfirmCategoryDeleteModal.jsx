import { Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'

export default function ConfirmCategoryDeleteModal({
  open,
  itemName,
  entityLabel = 'category',
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal open={open} onClose={onCancel} title={`Delete ${entityLabel}`} size="md">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#c96565]">
            <Trash2 className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#222]">Delete this {entityLabel}?</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#686868]">
              <span className="font-semibold text-[#222]">{itemName}</span> will be
              permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-w-[100px] rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#222] transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="min-w-[100px] rounded-lg bg-gradient-to-r from-[#c96565] to-[#b94b4b] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
