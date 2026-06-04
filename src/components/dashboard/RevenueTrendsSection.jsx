import { IndianRupee } from 'lucide-react'

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1fa2ff] to-[#ef8b8b]">
          <Icon size={17} className="text-white" strokeWidth={2.2} />
        </div>
        <h2 className="bg-gradient-to-r from-[#1fa2ff] to-[#ef8b8b] bg-clip-text text-base font-black uppercase tracking-wide text-transparent sm:text-lg">
          {title}
        </h2>
      </div>
      <button type="button" className="text-xs font-bold text-[#2286c3] hover:underline">
        View All
      </button>
    </div>
  )
}

export default function RevenueTrendsSection({ trends }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
      <SectionTitle icon={IndianRupee} title="Revenue Trends" />
      <div className="mb-4 flex flex-wrap gap-4 text-xs font-bold">
        <span className="text-[#39bf2e]">● Delhi</span>
        <span className="text-[#c9967d]">● Hyderabad</span>
        <span className="text-[#9d80d2]">● Pune</span>
      </div>
      <div className="space-y-4">
        {trends.map((m) => (
          <article key={m.month} className="rounded-xl p-4" style={{ background: m.bg }}>
            <div className="mb-3 flex justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[#1fa2ff]">{m.month}</h3>
              <span className="text-sm font-extrabold text-[#1fa2ff]">Rs.{m.total}</span>
            </div>
            <div className="mb-2 flex h-7 overflow-hidden rounded-full">
              <div className="flex-1 bg-[#39bf2e]" />
              <div className="flex-1 bg-[#c9967d]" />
              <div className="flex-1 bg-[#9d80d2]" />
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-[#39bf2e]">Rs.{m.delhi}L</span>
              <span className="text-[#c9967d]">Rs.{m.hyd}L</span>
              <span className="text-[#9d80d2]">Rs.{m.pune}L</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
