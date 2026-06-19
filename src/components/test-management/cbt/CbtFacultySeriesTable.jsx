import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, FileCheck, Folder, FolderOpen } from 'lucide-react'
import ViewButton from '../../common/ViewButton'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { StatusBadge } from '../../academics/AcademicsUi'
import { TABLE_ACTIONS_WRAP } from '../../../utils/tableColumnHelpers'

function SeriesRow({ node, depth, subjectId, expandedIds, onToggle }) {
  const navigate = useNavigate()
  const isFolder = node.type === 'folder'
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children?.length > 0

  const openResults = () => {
    if (node.type === 'testSeries') {
      navigate(TEST_MANAGEMENT_ROUTES.cbtResults(subjectId, node.id))
    }
  }

  if (isFolder) {
    return (
      <>
        <tr className="border-b border-slate-100 transition hover:bg-slate-50/60">
          <td className="px-4 py-3 sm:px-6" colSpan={5}>
            <button
              type="button"
              onClick={() => onToggle(node.id)}
              className="flex w-full items-center gap-2 text-left"
              style={{ paddingLeft: `${depth * 16}px` }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                )
              ) : (
                <span className="w-4" />
              )}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-[#55ace7]" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-[#55ace7]" />
              )}
              <span className="font-semibold text-[#1a3a5c]">{node.title}</span>
              <span className="ml-auto text-xs text-slate-500">
                {(node.children || []).filter((c) => c.type === 'testSeries').length} test series
              </span>
            </button>
          </td>
        </tr>
        {isExpanded &&
          node.children?.map((child) => (
            <SeriesRow
              key={child.id}
              node={child}
              depth={depth + 1}
              subjectId={subjectId}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
      </>
    )
  }

  const marks = node.testSeries?.details?.totalMarks ?? '—'
  const duration = node.testSeries?.durationMinutes ?? node.testSeries?.details?.durationMinutes ?? '—'

  return (
    <tr className="border-b border-slate-100 transition hover:bg-[#55ace7]/5">
      <td className="px-4 py-3 sm:px-6" style={{ paddingLeft: `${depth * 16 + 24}px` }}>
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-medium text-[#333]">{node.title}</span>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell sm:px-6">Test Series</td>
      <td className="hidden px-4 py-3 text-sm tabular-nums sm:table-cell sm:px-6">{marks}</td>
      <td className="hidden px-4 py-3 text-sm tabular-nums md:table-cell md:px-6">
        {duration !== '—' ? `${duration} min` : '—'}
      </td>
      <td className="px-4 py-3 sm:px-6">
        <StatusBadge status={node.status === 'published' ? 'Published' : 'Draft'} />
      </td>
      <td className="px-4 py-3 text-right sm:px-6">
        <div className={TABLE_ACTIONS_WRAP}>
          <ViewButton onClick={openResults} label="View Results" />
        </div>
      </td>
    </tr>
  )
}

export default function CbtFacultySeriesTable({ faculty, defaultExpanded = true }) {
  const [expandedIds, setExpandedIds] = useState(() => {
    if (!defaultExpanded || !faculty?.folders?.length) return new Set()
    return new Set(faculty.folders.map((f) => f.id))
  })

  const onToggle = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!faculty?.folders?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center text-sm text-slate-500">
        No test series folders in the TEST section for this faculty.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--card-shadow)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="sticky top-0 z-10 bg-[#1a3a5c] text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Name</th>
              <th className="hidden px-4 py-3 text-left text-sm font-semibold sm:table-cell sm:px-6">Type</th>
              <th className="hidden px-4 py-3 text-left text-sm font-semibold sm:table-cell sm:px-6">Marks</th>
              <th className="hidden px-4 py-3 text-left text-sm font-semibold md:table-cell md:px-6">Duration</th>
              <th className="px-4 py-3 text-left text-sm font-semibold sm:px-6">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faculty.folders.map((folder) => (
              <SeriesRow
                key={folder.id}
                node={folder}
                depth={0}
                subjectId={faculty.subjectId}
                expandedIds={expandedIds}
                onToggle={onToggle}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
