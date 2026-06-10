import { useEffect, useMemo, useState } from 'react'
import { GraduationCap, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CourseFormField } from './CourseFormField'
import FacultySubjectSearchSelect from './FacultySubjectSearchSelect'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'
import { getFacultySubjectsDropdown } from '../../api/facultySubjectsAPI'
import { isFrontendOnly } from '../../config/appMode'
import { useAcademicsSubjects } from '../../hooks/useAcademicsSubjects'
import {
  enrichLinkedSubjectsWithFaculty,
  formatBatchSubjectDropdownLabel,
  linkedSubjectFromFacultyRow,
  mapApiFacultySubjectDropdownRows,
} from '../../utils/facultySubjectBatch'
import { normalizeLinkedSubjects } from '../../utils/batchHelpers'
import { cn } from '../../utils/cn'

function SubjectChip({ link, onRemove }) {
  const label = formatBatchSubjectDropdownLabel({
    subjectId: link.subjectId,
    subjectCode: link.subjectCode,
    subjectName: link.subjectName,
    facultyName: link.facultyName,
  })
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.15 }}
      className="inline-flex max-w-full items-center gap-2 rounded-xl border border-[#cfe8f7] bg-white px-3 py-2 text-sm font-medium text-[#1a3a5c] shadow-sm ring-1 ring-[#eef2fc] transition-shadow hover:shadow-md"
    >
      <span className="min-w-0 truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-lg p-1 text-[#246392] transition hover:bg-[#eef6fc]"
        aria-label={`Remove ${link.subjectName}`}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </motion.span>
  )
}

/** Multi-select faculty subjects for Add/Edit Batch — synced with faculty-subjects API */
export default function BatchSubjectDetailsSection({ form, setForm }) {
  const { subjects: localSubjects } = useAcademicsSubjects()
  const [apiSubjects, setApiSubjects] = useState([])
  const [loading, setLoading] = useState(!isFrontendOnly)

  useEffect(() => {
    if (isFrontendOnly) return undefined
    const ac = new AbortController()
    setLoading(true)
    getFacultySubjectsDropdown({ signal: ac.signal })
      .then((rows) => setApiSubjects(mapApiFacultySubjectDropdownRows(rows)))
      .catch(() => setApiSubjects([]))
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [])

  const catalogSubjects = useMemo(() => {
    if (!isFrontendOnly && apiSubjects.length) return apiSubjects
    return localSubjects
  }, [apiSubjects, localSubjects])

  const activeSubjects = useMemo(
    () => catalogSubjects.filter((s) => s.status !== 'In Active'),
    [catalogSubjects],
  )

  const linkedSubjects = useMemo(
    () => enrichLinkedSubjectsWithFaculty(normalizeLinkedSubjects(form), catalogSubjects),
    [form, catalogSubjects],
  )

  const selectedIds = useMemo(
    () => new Set(linkedSubjects.map((s) => String(s.subjectId))),
    [linkedSubjects],
  )

  const availableSubjects = useMemo(
    () => activeSubjects.filter((s) => !selectedIds.has(String(s.id || s._id))),
    [activeSubjects, selectedIds],
  )

  const addSubject = (option) => {
    if (!option?.subjectId || selectedIds.has(String(option.subjectId))) return
    const row = activeSubjects.find(
      (s) => String(s.id || s._id) === String(option.subjectId),
    )
    const link = row
      ? linkedSubjectFromFacultyRow(row)
      : {
          subjectId: String(option.subjectId),
          subjectName: option.subjectName || '',
          facultyId: option.facultyId || '',
          facultyName: option.facultyName || '',
        }
    if (!link) return
    setForm((f) => ({
      ...f,
      linkedSubjects: [...normalizeLinkedSubjects(f), link],
    }))
  }

  const removeSubject = (subjectId) => {
    setForm((f) => ({
      ...f,
      linkedSubjects: normalizeLinkedSubjects(f).filter(
        (s) => String(s.subjectId) !== String(subjectId),
      ),
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-[#eef2fc] bg-[#f8fbff] px-4 py-3.5">
        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-[#246392]" strokeWidth={2.1} />
        <p className="text-sm leading-relaxed text-[#686868]">
          Add one or more {facultySubjectLabels.plural.toLowerCase()} to this batch. Options load
          from Academics → {facultySubjectLabels.plural} and store subject ID, name, and assigned
          faculty.
        </p>
      </div>

      <CourseFormField label={`Add ${facultySubjectLabels.singular}`}>
        <FacultySubjectSearchSelect
          subjects={availableSubjects}
          loading={loading}
          disabled={loading || availableSubjects.length === 0}
          placeholder={
            loading
              ? 'Loading faculty subjects…'
              : availableSubjects.length
                ? 'Search by subject ID, name, or faculty…'
                : activeSubjects.length
                  ? 'All available subjects already added'
                  : `No ${facultySubjectLabels.plural.toLowerCase()} yet — create them under Academics`
          }
          onSelect={addSubject}
        />
      </CourseFormField>

      {linkedSubjects.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#246392]">
            Selected subjects ({linkedSubjects.length})
          </p>
          <div className="flex flex-wrap gap-2.5 rounded-xl border border-[#eef2fc] bg-gradient-to-b from-[#fafcff] to-white p-4">
            <AnimatePresence mode="popLayout">
              {linkedSubjects.map((s) => (
                <SubjectChip
                  key={s.subjectId}
                  link={s}
                  onRemove={() => removeSubject(s.subjectId)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cfe8f7]',
            'bg-[#fafcff] px-6 py-10 text-center transition-colors',
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef6fc] ring-1 ring-[#cfe8f8]">
            <GraduationCap className="h-6 w-6 text-[#246392]" />
          </div>
          <p className="text-sm font-semibold text-[#1a3a5c]">No subjects added yet</p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#686868]">
            Use the dropdown above to attach faculty subjects to this batch.
          </p>
        </div>
      )}
    </div>
  )
}
