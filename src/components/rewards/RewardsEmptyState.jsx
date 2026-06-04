import { Coins } from 'lucide-react'

export default function RewardsEmptyState({ title = 'No records found', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2fc]">
        <Coins className="h-7 w-7 text-[#246392]" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
      {message && <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
