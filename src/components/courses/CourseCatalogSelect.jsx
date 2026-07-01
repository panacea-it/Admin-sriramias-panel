import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Loader2, Search } from 'lucide-react'
import { cn } from '../../utils/cn'
import { fetchAcademicCourseOptions } from '../../api/academicCoursesAPI'
import { usePortalMenuPosition } from '../ui/usePortalMenuPosition'
import { toast } from '../../utils/toast'

/**
 * Searchable course picker — Categories → Courses catalog.
 * @param {string} value - selected course _id (Mongo id or local row id)
 */
export default function CourseCatalogSelect({
  modalOpen = true,
  value,
  onChange,
  disabled,
  required,
  error,
  className,
  excludeCourseIds = [],
  fallbackCourseId,
}) {
  const listboxId = useId()
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!modalOpen) return undefined

    const ac = new AbortController()
    setLoading(true)
    setFetchError(null)
    fetchAcademicCourseOptions({ signal: ac.signal })
      .then((rows) => {
        setCourses(Array.isArray(rows) ? rows : [])
        setFetchError(null)
      })
      .catch((err) => {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return
        setCourses([])
        setFetchError('Failed to load courses')
      })
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [modalOpen])

  useEffect(() => {
    if (fetchError) toast.error(fetchError)
  }, [fetchError])

  useEffect(() => {
    const onDoc = (e) => {
      if (
        rootRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const refresh = () => {
      fetchAcademicCourseOptions().then(setCourses).catch(() => {})
    }
    window.addEventListener('academic-courses-updated', refresh)
    return () => window.removeEventListener('academic-courses-updated', refresh)
  }, [])

  useEffect(() => {
    if (value || !fallbackCourseId || !courses.length) return
    const match = courses.find((c) => c.courseId === fallbackCourseId)
    if (match) {
      onChange?.({
        academicCourseId: match._id,
        courseId: match.courseId,
        courseName: match.courseName,
      })
    }
  }, [value, fallbackCourseId, courses, onChange])

  const excludeSet = useMemo(
    () => new Set((excludeCourseIds || []).filter(Boolean).map(String)),
    [excludeCourseIds],
  )

  const selected = courses.find((c) => c._id === value)
  const coords = usePortalMenuPosition(triggerRef, open, 8)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter((c) => {
      if (excludeSet.has(c.courseId) && c._id !== value) return false
      if (!q) return true
      return (
        c.courseName.toLowerCase().includes(q) ||
        c.courseId.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q)
      )
    })
  }, [courses, query, excludeSet, value])

  const pick = (course) => {
    onChange?.({
      academicCourseId: course._id,
      courseId: course.courseId,
      courseName: course.courseName,
    })
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled || loading || Boolean(fetchError) || (!loading && courses.length === 0)}
        onClick={() => setOpen((o) => !o)}
        ref={triggerRef}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-transparent bg-[#e8f4fc] px-4 text-left text-sm shadow-sm transition focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25',
          selected ? 'font-medium text-gray-900' : 'text-[#9ca0a8]',
          error && 'ring-2 ring-red-400',
          (disabled || loading) && 'opacity-70',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className="truncate">
          {loading
            ? 'Loading courses…'
            : selected
              ? selected.label
              : 'Choose course'}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#55ace7]" />
        ) : (
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-[#55ace7]', open && 'rotate-180')}
          />
        )}
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            id={listboxId}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 220,
            }}
            className="overflow-hidden rounded-xl border border-[#e8f4fc] bg-white shadow-[0_16px_40px_rgba(36,99,146,0.15)]"
          >
          <div className="border-b border-[#eef2fc] p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search course name or ID…"
                className="h-10 w-full rounded-lg bg-[#eef2fc] pl-9 pr-3 text-sm text-gray-800 caret-[#246392] placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#55ace7]/30"
                autoFocus
              />
            </div>
          </div>
          <ul className="custom-scrollbar max-h-56 overflow-y-auto py-1">
            {fetchError && (
              <li className="px-4 py-3 text-sm text-[#c96565]">{fetchError}</li>
            )}
            {!fetchError && !loading && filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-[#9ca0a8]">No courses available</li>
            )}
            {filtered.map((c) => (
              <li key={c._id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === c._id}
                  onClick={() => pick(c)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#eef2fc]',
                    value === c._id && 'bg-[#e8f4fc] text-[#246392]',
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cbeeff] font-mono text-[10px] font-bold text-[#246392]">
                    {c.courseId}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[#222]">{c.courseName}</span>
                    <span className="block text-xs text-[#686868]">{c.courseId}</span>
                  </span>
                  {value === c._id && <Check className="h-4 w-4 shrink-0 text-[#55ace7]" />}
                </button>
              </li>
            ))}
          </ul>
          </div>,
          document.body,
        )}

      {selected && (
        <p className="mt-1 font-mono text-[11px] text-[#246392]">
          Course ID: {selected.courseId}
        </p>
      )}

      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      {required && !value && !error && (
        <p className="mt-1 text-xs text-[#9ca0a8]">Select a course from Categories → Courses</p>
      )}
    </div>
  )
}
