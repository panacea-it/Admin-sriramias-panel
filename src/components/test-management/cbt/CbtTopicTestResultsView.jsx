import { useMemo, useState } from 'react'
import {
  CbtExportToolbar,
  CBT_DATA_PANEL,
  CBT_TABLE_SCROLL_WRAP,
} from './ui'
import CbtTopicTestResultsTable from './CbtTopicTestResultsTable'
import { getCbtDummyStudentResults } from '../../../utils/cbtStudentResultsDummyData'
import { exportToCsv } from '../../../utils/financeExport'
import { toast } from '../../../utils/toast'

const RESULT_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Published', label: 'Published' },
  { value: 'Unpublished', label: 'Unpublished' },
]

export default function CbtTopicTestResultsView({ testId, testTitle = 'Test' }) {
  const [search, setSearch] = useState('')
  const [resultFilter, setResultFilter] = useState('all')
  const [sortKey, setSortKey] = useState('rank')
  const [sortDir, setSortDir] = useState('asc')
  const [exporting, setExporting] = useState(false)

  const allRows = useMemo(
    () => getCbtDummyStudentResults(testId, testTitle),
    [testId, testTitle],
  )

  const filtered = useMemo(() => {
    let list = [...allRows]
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (row) =>
          row.studentName.toLowerCase().includes(q) ||
          row.rollNumber.toLowerCase().includes(q),
      )
    }
    if (resultFilter === 'Published') {
      list = list.filter((row) => row.resultStatus === 'Published')
    } else if (resultFilter === 'Unpublished') {
      list = list.filter((row) => row.resultStatus !== 'Published')
    }

    list.sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (sortKey === 'rank') {
        av = av === '—' ? 9999 : Number(av)
        bv = bv === '—' ? 9999 : Number(bv)
      }
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })

    return list
  }, [allRows, search, resultFilter, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleExportCsv = () => {
    if (exporting) return
    setExporting(true)
    try {
      exportToCsv(
        filtered.map((row) => ({
          Student: row.studentName,
          Roll: row.rollNumber,
          Attempt: row.attemptStatus,
          Score: `${row.score}/${row.maxMarks}`,
          Accuracy: `${row.accuracyPct}%`,
          'Negative Marks': row.negativeMarks,
          Rank: row.rank,
          'Time Taken': row.timeTaken,
          'Submission Time': row.submissionDate,
          'Result Status': row.resultStatus,
        })),
        `cbt-student-results-${testId || 'export'}.csv`,
      )
      toast.success('CSV exported')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = () => {
    toast.info('PDF export will be available after backend integration.')
  }

  return (
    <section className={CBT_DATA_PANEL}>
      <CbtExportToolbar
        embedded
        size="lg"
        className="mb-0"
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search by student name or roll number..."
        filterValue={resultFilter}
        onFilterChange={(e) => setResultFilter(e.target.value)}
        filterOptions={RESULT_FILTER_OPTIONS}
        exporting={exporting}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />

      <div className={CBT_TABLE_SCROLL_WRAP}>
        <CbtTopicTestResultsTable
          rows={filtered}
          resetDeps={[search, resultFilter, testId]}
          emptyMessage="No students match your filters."
          sortKey={sortKey}
          sortDir={sortDir}
          onToggleSort={toggleSort}
        />
      </div>
    </section>
  )
}
