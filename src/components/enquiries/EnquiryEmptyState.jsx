import { Inbox } from 'lucide-react'

export default function EnquiryEmptyState({ message = 'No enquiries match your filters.' }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef6fc] to-[#dceefb] shadow-[0_4px_16px_rgba(85,172,231,0.15)]">
        <Inbox className="h-8 w-8 text-[#55ace7]" strokeWidth={1.8} />
      </div>
      <p className="text-base font-semibold text-[#1a3a5c]">No enquiries found</p>
      <p className="mt-1 max-w-sm text-sm text-[#686868]">{message}</p>
    </div>
  )
}
