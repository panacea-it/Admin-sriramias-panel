import { useMemo } from 'react'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { cn } from '../../../utils/cn'

const UPLOAD_STATUS_STYLES = {
  Uploaded: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  'Not Uploaded': 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
}

function UploadStatusPill({ status }) {
  const label = status || 'Not Uploaded'

  return (
    <span
      className={cn(
        'inline-flex min-w-[92px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        UPLOAD_STATUS_STYLES[label] ?? UPLOAD_STATUS_STYLES['Not Uploaded'],
      )}
    >
      {label}
    </span>
  )
}

export default function MainsStudentResultsTable({
  rows,
  loading = false,
  resetDeps = [],
  emptyMessage,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'studentName',
        label: 'Student Name',
        width: '22%',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle',
        render: (row) => (
          <span className="font-semibold text-slate-900">{row.studentName || '—'}</span>
        ),
      },
      {
        key: 'registerNumber',
        label: 'Register Number',
        width: '14%',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.registerNumber || '—'}</span>
        ),
      },
      {
        key: 'uploadedStatus',
        label: 'Uploaded Status',
        width: '16%',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle',
        render: (row) => <UploadStatusPill status={row.uploadedStatus} />,
      },
      {
        key: 'marks',
        label: 'Marks',
        width: '10%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">
            {typeof row.marks === 'number' ? `${row.marks}/${row.maxMarks}` : row.marks || '—'}
          </span>
        ),
      },
      {
        key: 'rank',
        label: 'Rank',
        width: '8%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.rank ?? '—'}</span>
        ),
      },
      {
        key: 'evaluatedBy',
        label: 'Evaluated By',
        width: '16%',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.evaluatedBy || '—'}</span>
        ),
      },
      {
        key: 'evaluationDate',
        label: 'Evaluation Date',
        width: '14%',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">{row.evaluationDate || '—'}</span>
        ),
      },
    ],
    [],
  )

  return (
    <PaginatedFigmaTable
      className="w-full"
      columns={columns}
      data={rows}
      emptyMessage={emptyMessage}
      itemLabel="students"
      loading={loading}
      skeletonRowCount={8}
      initialPageSize={10}
      resetDeps={resetDeps}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={0}
      tableLayoutFixed
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
