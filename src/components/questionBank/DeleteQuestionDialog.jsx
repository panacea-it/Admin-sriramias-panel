import Modal from '../ui/Modal'

export default function DeleteQuestionDialog({
  open,
  onClose,
  question,
  onConfirm,
  deleting,
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Delete Question">
      <div className="space-y-5 p-1">
        <p className="text-sm font-medium text-slate-700">
          Permanently delete question{' '}
          <span className="font-bold text-slate-900">{question?.questionCode || question?.id}</span>? This action
          cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex h-10 items-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
