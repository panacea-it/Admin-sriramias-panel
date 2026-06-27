import { AlertCircle } from 'lucide-react'

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again or contact support.',
  onRetry,
  retryLabel = 'Try again',
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#fef2f2] p-8 text-center">
      <AlertCircle className="h-10 w-10 text-[#c96565]" />
      <h3 className="text-base font-bold text-[#111111]">{title}</h3>
      <p className="max-w-sm text-sm text-[#686868]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 h-10 rounded-lg bg-white px-5 text-sm font-semibold text-[#246392] shadow-sm ring-1 ring-[#e2e8f0] transition hover:bg-[#eef2ff]"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
