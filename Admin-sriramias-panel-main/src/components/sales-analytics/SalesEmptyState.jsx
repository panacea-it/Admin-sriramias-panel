import { Inbox } from 'lucide-react'

export default function SalesEmptyState({ title = 'No data yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f4f8] text-[#246392]">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-[#111]">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-[#686868]">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
