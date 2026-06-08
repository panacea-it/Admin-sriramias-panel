import Modal from '../../ui/Modal'

export default function ConfirmRoleDeleteModal({
  open,
  roleLabel,
  loading,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal open={open} onClose={onCancel} title="Delete role access" size="md">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">Delete role access?</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
            Are you sure you want to delete this role access?
            {roleLabel ? (
              <>
                {' '}
                <span className="font-semibold text-slate-900">{roleLabel}</span> will be removed
                permanently.
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200/80 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-2.5 text-[14px] font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
