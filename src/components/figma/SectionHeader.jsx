export default function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2efff]">
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
