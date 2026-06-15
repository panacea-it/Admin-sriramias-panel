import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

export default function MainsFacultySubjectsTable({
  rows,
  loading,
  resetDeps = [],
  emptyMessage,
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'subjectName',
        label: 'Faculty Subject',
        width: '35%',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
        render: (row) => {
          const label = `${row.subjectName} by ${row.facultyName}`
          return (
            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-900" title={label}>
                {label}
              </div>
            </div>
          )
        },
      },
      {
        key: 'totalTopics',
        label: 'Topics',
        width: '10%',
        align: 'center',
        headerClassName: 'min-w-[72px] whitespace-nowrap',
        cellClassName: 'min-w-[72px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.totalTopics}</span>
        ),
      },
      {
        key: 'totalTests',
        label: 'Tests/PDFs',
        width: '12%',
        align: 'center',
        headerClassName: 'min-w-[96px] whitespace-nowrap',
        cellClassName: 'min-w-[96px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.totalTests}</span>
        ),
      },
      {
        key: 'lastUpdated',
        label: 'Last Updated',
        width: '23%',
        headerClassName: 'min-w-[180px] whitespace-nowrap',
        cellClassName: 'min-w-[180px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">
            {row.lastUpdated ? formatCategoryDateTime(row.lastUpdated) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        width: '20%',
        align: 'center',
        headerClassName: 'min-w-[160px] whitespace-nowrap',
        cellClassName: 'min-w-[160px] whitespace-nowrap align-middle',
        render: (row) => renderActions(row),
      },
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      className="w-full"
      columns={columns}
      data={rows}
      emptyMessage={emptyMessage}
      itemLabel="faculty subjects"
      loading={loading}
      skeletonRowCount={8}
      resetDeps={resetDeps}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={880}
      paginationClassName={cn(
        '[&>div:last-child]:items-center',
        '[&_nav]:items-center',
        '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
        '[&_form_input]:h-9 [&_form_input]:leading-none',
        '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
      )}
    />
  )
}