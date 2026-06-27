import AppModalWrapper from '../ui/AppModalWrapper'
import { roleLabel } from '../../data/manageUsersConfig'

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[#9ca3af] sm:w-36">
        {label}
      </dt>
      <dd className="min-w-0 text-sm font-semibold text-[#111]">{value || '—'}</dd>
    </div>
  )
}

export default function ConfirmManageUserDeleteModal({
  open,
  user,
  loading,
  onCancel,
  onConfirm,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!loading) onConfirm?.()
  }

  return (
    <AppModalWrapper
      open={open}
      onClose={() => {
        if (!loading) onCancel?.()
      }}
      title="Delete User"
      size="md"
      role="alertdialog"
      zIndex={120}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-[#eef2fc]"
      >
        <div className="border-b border-[#eef2fc] px-6 py-5 pr-14">
          <h2 className="text-lg font-bold text-[#111]">Delete User</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#686868]">
            Are you sure you want to permanently delete this user? This action cannot be undone.
          </p>

          {user ? (
            <dl className="mt-4 space-y-3 rounded-xl border border-[#eef2fc] bg-[#f8fbff] p-4">
              <DetailRow label="User Name" value={user.fullName} />
              <DetailRow label="User ID" value={user.userId} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Role" value={roleLabel(user.role)} />
              <DetailRow label="Assigned Center" value={user.assignedCenter} />
            </dl>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eef2fc] bg-[#f8fafc] px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 min-h-[38px] rounded-lg border border-[#55ace7]/25 bg-white px-5 text-sm font-semibold text-[#246392] shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:bg-[#eef2fc] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-10 min-h-[38px] rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete User'}
          </button>
        </div>
      </form>
    </AppModalWrapper>
  )
}
