import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'

function labelForType(type) {
  if (!type) return 'Update'
  return String(type).replaceAll('_', ' ')
}

export default function EvaluationHistoryModal({ open, onClose, evaluation }) {
  const history = Array.isArray(evaluation?.history) ? [...evaluation.history].reverse() : []

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Evaluation History">
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader title="Evaluation History" onClose={onClose} />
        <div className="max-h-[min(78vh,760px)] overflow-y-auto p-5 sm:p-6">
          {history.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-6 text-sm font-medium text-slate-600">
              No history available yet.
            </div>
          ) : (
            <ol className="space-y-3">
              {history.map((h) => (
                <li
                  key={h.id || `${h.at}-${h.type}`}
                  className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#1a3a5c]">{labelForType(h.type)}</p>
                    <p className="text-xs font-semibold text-slate-500">{h.at ? new Date(h.at).toLocaleString() : '—'}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{h.actor || 'System'}:</span>{' '}
                    {h.message || 'Updated'}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Modal>
  )
}

