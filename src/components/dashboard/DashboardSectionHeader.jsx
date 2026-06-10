export default function DashboardSectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1fa2ff]/20 to-[#ef8b8b]/20 ring-1 ring-[#1fa2ff]/10">
          <Icon size={18} className="text-[#655ed3]" strokeWidth={2.2} />
        </div>
        <h2 className="bg-gradient-to-r from-[#1fa2ff] to-[#ef8b8b] bg-clip-text text-base font-black uppercase tracking-wide text-transparent sm:text-lg">
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}
