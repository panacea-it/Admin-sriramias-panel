import Modal from '../../ui/Modal'

export default function ConfirmRoleStatusModal({
  open,
  roleLabel,
  enabling,
  loading,
  onCancel,
  onConfirm,
}) {
  const title = enabling ? 'Activate role access?' : 'Deactivate role access?'
  const description = enabling
    ? `"${roleLabel}" will become active and available for assignment.`
    : `"${roleLabel}" will be marked inactive. Existing assignments may be restricted until reactivated.`

  return (
    <Modal open={open} onClose={onCancel} title={title} size="md">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{description}</p>
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
            className={
              enabling
                ? 'rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-[14px] font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60'
                : 'rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-[14px] font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60'
            }
          >
            {loading ? 'Updating…' : enabling ? 'Activate role' : 'Deactivate role'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
