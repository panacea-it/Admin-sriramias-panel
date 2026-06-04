import { BarChart2 } from 'lucide-react'
import PageBanner from '../components/figma/PageBanner'
import SectionHeader from '../components/figma/SectionHeader'
import ProgressBar from '../components/figma/ProgressBar'
import MiniChart from '../components/figma/MiniChart'

function ChartPanel({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <h3 className="mb-4 bg-gradient-to-r from-[#1fa2ff] to-[#ef8b8b] bg-clip-text text-base font-black uppercase tracking-wide text-transparent sm:text-lg">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-xl space-y-6">
        <PageBanner icon={BarChart2} title="Reports & Analytics" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {[
            { label: 'Total Revenue', value: '1.2 cr', color: '#a5ad00' },
            { label: 'Enrollments', value: '468', color: '#c16d6d' },
            { label: 'Conversion', value: '82%', color: '#655ed3' },
            { label: 'Active Users', value: '2.8k', color: '#2b20e7' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            >
              <p className="text-sm font-semibold text-gray-500">{s.label}</p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <p className="text-3xl font-extrabold" style={{ color: s.color }}>
                  {s.value}
                </p>
                <MiniChart color={s.color} className="hidden sm:block" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartPanel title="Enrollment by Month">
            <div className="space-y-4">
              {[
                { m: 'January', v: 72 },
                { m: 'February', v: 85 },
                { m: 'March', v: 91 },
              ].map((row) => (
                <div key={row.m}>
                  <div className="mb-1.5 flex justify-between text-xs font-semibold">
                    <span>{row.m}</span>
                    <span>{row.v}%</span>
                  </div>
                  <ProgressBar value={row.v} color="linear-gradient(90deg,#33b8ff,#005b9a)" />
                </div>
              ))}
            </div>
          </ChartPanel>

          <ChartPanel title="Revenue by Center">
            <SectionHeader icon={BarChart2} title="Center Split" />
            <div className="space-y-3">
              {[
                { name: 'Delhi', pct: 42, color: '#39bf2e' },
                { name: 'Hyderabad', pct: 33, color: '#c9967d' },
                { name: 'Pune', pct: 25, color: '#9d80d2' },
              ].map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex justify-between text-xs font-semibold">
                    <span>{c.name}</span>
                    <span>{c.pct}%</span>
                  </div>
                  <ProgressBar value={c.pct} color={c.color} />
                </div>
              ))}
            </div>
          </ChartPanel>
        </div>
      </section>
    </div>
  )
}
