export default function OfflinePaymentFooter({ loading, emiEnabled, onCancel, onApprove }) {
  return (
    <footer className="sticky bottom-0 z-30 flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-[#444] hover:bg-slate-50 disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onApprove}
        disabled={loading}
        className="h-10 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-6 text-sm font-bold text-white shadow-[0_4px_14px_rgba(36,99,146,0.35)] disabled:opacity-60"
      >
        {loading ? 'Processing…' : emiEnabled ? 'Approve & activate EMI' : 'Approve payment'}
      </button>
    </footer>
  )
}
