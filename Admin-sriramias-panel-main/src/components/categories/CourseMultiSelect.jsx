import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function CourseMultiSelect({ courses = [], selectedIds = [], onChange, loading }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.courseId?.toLowerCase().includes(q) ||
        c.examCategory?.toLowerCase().includes(q) ||
        c.examSubcategory?.toLowerCase().includes(q),
    )
  }, [courses, search])

  const toggle = (id) => {
    const key = String(id)
    const set = new Set(selectedIds.map(String))
    if (set.has(key)) set.delete(key)
    else set.add(key)
    onChange([...set].map((v) => (Number.isNaN(Number(v)) ? v : Number(v))))
  }

  if (loading) {
    return (
      <div className="space-y-2 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-[#eef2fc]" />
        ))}
      </div>
    )
  }

  if (!courses.length) {
    return (
      <div className="rounded-xl border border-dashed border-[#d1d5db] bg-[#fafafa] px-4 py-8 text-center">
        <p className="text-sm font-semibold text-[#111]">No courses created yet</p>
        <p className="mt-1 text-xs text-[#686868]">Add courses from Academics → Batch first.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white">
      <div className="relative border-b border-[#f0f0f0] p-3">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="h-10 w-full rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]"
        />
      </div>
      <ul className="max-h-56 overflow-y-auto p-2">
        {filtered.map((course) => {
          const checked = selectedIds.map(String).includes(String(course.id))
          return (
            <li key={course.id}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[#f0f7fc]',
                  checked && 'bg-[#e8f4fc]',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(course.id)}
                  className="mt-1 h-4 w-4 rounded accent-[#246392]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#111]">{course.name}</p>
                  <p className="text-xs text-[#686868]">
                    {course.courseId} · {course.examCategory} · {course.examSubcategory}
                  </p>
                </div>
              </label>
            </li>
          )
        })}
      </ul>
      <p className="border-t border-[#f0f0f0] px-3 py-2 text-xs text-[#686868]">
        {selectedIds.length} course(s) selected
      </p>
    </div>
  )
}
