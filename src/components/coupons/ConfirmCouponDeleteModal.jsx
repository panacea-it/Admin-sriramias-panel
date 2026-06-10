import AppModalWrapper from '../ui/AppModalWrapper'

export default function ConfirmCouponDeleteModal({
  open,
  couponName,
  bulkCount = 0,
  loading,
  onCancel,
  onConfirm,
}) {
  const isBulk = bulkCount > 0
  const title = isBulk ? 'Delete Selected Coupons' : 'Delete Coupon'
  const message = isBulk
    ? `Are you sure you want to delete ${bulkCount} selected ${bulkCount === 1 ? 'coupon' : 'coupons'}?`
    : 'Are you sure you want to delete this coupon?'

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
      title={title}
      size="md"
      role="alertdialog"
      zIndex={120}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-[#eef2fc]"
      >
        <div className="border-b border-[#eef2fc] px-6 py-5 pr-14">
          <h2 className="text-lg font-bold text-[#111]">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#686868]">{message}</p>
          {!isBulk && couponName ? (
            <p className="mt-3 rounded-xl border border-[#eef2fc] bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#111]">
              {couponName}
            </p>
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
            {loading ? 'Deleting…' : 'Delete Coupon'}
          </button>
        </div>
      </form>
    </AppModalWrapper>
  )
}
