import { Inbox } from 'lucide-react'

export default function EmptyState({
  title = 'No data yet',
  description = 'There is nothing to show in this section.',
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-8 text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dff4ff]">
        <Inbox className="h-7 w-7 text-[#55ace7]" />
      </div>
      <h3 className="text-base font-bold text-[#111111]">{title}</h3>
      <p className="max-w-sm text-sm text-[#686868]">{description}</p>
    </div>
  )
}
