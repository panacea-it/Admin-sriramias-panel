import { BookMarked } from 'lucide-react'
import DashboardProgressBar from './DashboardProgressBar'
import DashboardNavLink from './DashboardNavLink'

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

export default function PopularCoursesSection({ courses, embedded = false }) {
  const content = (
    <div className="space-y-4">
      {courses.map((course, i) => {
        const card = (
          <>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-gray-800">
                  #{i + 1} {course.name}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {course.enrolled} Students Enrolled
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-[#c0b400] shadow-sm">
                {course.rating} ⭐
              </span>
            </div>
            <div className="mb-2 flex justify-between text-xs font-semibold text-gray-700">
              <span>Revenue</span>
              <span className="text-[#005b9a]">{course.revenue}</span>
            </div>
            <DashboardProgressBar
              value={92}
              color="linear-gradient(90deg,#33b8ff,#005b9a)"
              className="h-2.5"
            />
          </>
        )

        if (!course.href) {
          return (
            <article key={course.name} className="rounded-xl p-4" style={{ background: course.bg }}>
              {card}
            </article>
          )
        }

        return (
          <DashboardNavLink
            key={course.name}
            to={course.href}
            ariaLabel={`Open ${course.name} in Course Management`}
            className="rounded-xl p-4"
            style={{ background: course.bg }}
          >
            {card}
          </DashboardNavLink>
        )
      })}
    </div>
  )

  if (embedded) return content

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
      <SectionTitle icon={BookMarked} title="Popular Courses" />
      {content}
    </section>
  )
}
