import { MapPin } from 'lucide-react'
import DashboardProgressBar from './DashboardProgressBar'
import DashboardNavLink from './DashboardNavLink'

export default function FacultyCard({ faculty }) {
  const content = (
    <>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-800 shadow-sm">
          #{faculty.rank}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">{faculty.name}</h3>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} className="shrink-0" />
            {faculty.center}
          </p>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          ['Rating', `${faculty.rating} ⭐`, '#c0b400'],
          ['Students', faculty.students, '#16a34a'],
          ['Classes', String(faculty.classes).padStart(2, '0'), '#ff4e00'],
        ].map(([label, val, col]) => (
          <div key={label} className="rounded-lg bg-white p-2 text-center shadow-sm">
            <p className="mb-0.5 text-[10px] text-gray-500">{label}</p>
            <p className="text-xs font-bold" style={{ color: col }}>
              {val}
            </p>
          </div>
        ))}
      </div>
      <DashboardProgressBar
        value={92}
        color="linear-gradient(90deg,#33b8ff,#005b9a)"
        className="h-2.5"
      />
    </>
  )

  if (!faculty.href) {
    return (
      <article className="rounded-xl p-4" style={{ background: faculty.bg }}>
        {content}
      </article>
    )
  }

  return (
    <DashboardNavLink
      to={faculty.href}
      ariaLabel={`Open ${faculty.name} in Faculty Management`}
      className="rounded-xl p-4"
      style={{ background: faculty.bg }}
    >
      {content}
    </DashboardNavLink>
  )
}
