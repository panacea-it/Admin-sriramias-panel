import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function RewardsErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-100 bg-rose-50/50 px-6 py-12 text-center">
      <AlertTriangle className="h-10 w-10 text-rose-500" />
      <p className="mt-3 text-sm font-semibold text-rose-800">{message || 'Something went wrong'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-50"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  )
}
