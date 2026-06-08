import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function OmrErrorState({ message, onRetry, loading = false }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-6 py-14 text-center shadow-[0_8px_28px_rgba(15,23,42,0.06)] ring-1 ring-red-50">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-600">
        <AlertTriangle className="h-6 w-6" strokeWidth={2.2} />
      </div>
      <h3 className="text-lg font-bold text-[#222]">Unable to load OMR exams</h3>
      <p className="mt-2 max-w-md text-sm font-medium text-[#686868]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] disabled:opacity-60"
        >
          <RefreshCw className={cnIcon(loading)} />
          {loading ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </div>
  )
}

function cnIcon(loading) {
  return loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'
}
