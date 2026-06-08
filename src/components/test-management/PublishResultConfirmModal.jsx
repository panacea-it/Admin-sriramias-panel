import Modal from '../ui/Modal'

export default function PublishResultConfirmModal({ open, onClose, onConfirm, row }) {
  return (
    <Modal open={open} onClose={onClose} size="md" title="Publish Result">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
        <div className="bg-gradient-to-r from-[#55ace7] to-[#246392] px-5 py-4">
          <h2 className="text-base font-extrabold text-white sm:text-lg">Publish Result</h2>
          <p className="mt-1 text-sm text-white/85">Lock and publish this result for dashboards and AIR.</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="rounded-xl bg-[#eef2fc] p-4">
            <div className="text-sm font-extrabold text-[#1a3a5c]">{row?.studentName || 'Student'}</div>
            <div className="mt-1 text-sm font-semibold text-slate-700">{row?.testName || 'Test'} • {row?.subject || 'Subject'}</div>
            <div className="mt-2 text-sm font-semibold text-slate-700">
              Score: <span className="font-extrabold text-[#246392]">{row?.score}/{row?.total}</span> • AIR (auto):{' '}
              <span className="font-extrabold text-[#246392]">{row?.airRank ?? '—'}</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#fff7ed] p-4 ring-1 ring-orange-200">
            <div className="text-sm font-extrabold text-orange-800">Note</div>
            <div className="mt-1 text-sm font-semibold text-orange-900/90">
              Publishing updates status, refreshes rankings, and makes reports available.
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg bg-[#eef2fc] px-4 text-sm font-extrabold text-[#1a3a5c] hover:bg-[#e5ebff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7] focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm?.()}
              className="h-10 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-extrabold text-white hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7] focus-visible:ring-offset-2"
            >
              Publish Result
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

