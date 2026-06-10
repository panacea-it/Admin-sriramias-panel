import { MapPin } from 'lucide-react'
import DashboardProgressBar from './DashboardProgressBar'

export default function CenterPerformanceCard({ center }) {
  return (
    <article className="rounded-xl bg-[#dff4ff] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <MapPin size={15} className="text-gray-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">{center.name}</h3>
            <p className="text-xs text-gray-500">
              {center.students} Students | {center.staff} Staff
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-green-600 shadow-sm">
            {center.conversion}% Conversion
          </span>
          <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#c0b400] shadow-sm">
            {center.rating} ⭐
          </span>
        </div>
      </div>

      <div className="mb-3 space-y-2">
        <div className="flex justify-between text-xs font-semibold text-gray-700">
          <span>Revenue</span>
          <span className="text-green-600">{center.revenue}</span>
        </div>
        <DashboardProgressBar
          value={center.revenueW}
          color="linear-gradient(90deg,#81d36f,#0fa20f)"
          className="h-2.5"
        />
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-xs font-semibold text-gray-700">
          <span>Students Enrolled</span>
          <span className="text-[#005b9a]">{center.students}</span>
        </div>
        <DashboardProgressBar
          value={center.studentsW}
          color="linear-gradient(90deg,#33b8ff,#005b9a)"
          className="h-2.5"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2">
        {[
          ['Total', `Rs ${center.revenue}`, '#ff4e00'],
          ['Expenses', 'Rs 2.5 L', '#be2525'],
          ['Profit', 'Rs 10 L', '#16a34a'],
        ].map(([label, val, col]) => (
          <div key={label} className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="mb-1 text-[10px] font-medium text-gray-500">{label}</p>
            <p className="text-sm font-bold" style={{ color: col }}>
              {val}
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}
