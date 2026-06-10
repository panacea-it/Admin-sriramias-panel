import { useEffect, useState } from 'react'
import { BarChart3, Download, Filter } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreBarChart from '../../components/bookstore/BookstoreBarChart'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { fetchBookstoreReports } from '../../api/bookstoreAPI'
import { exportToCsv } from '../../utils/financeExport'
import { formatINR } from '../../utils/financeFilters'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

export default function BookstoreReportsPage() {
  const [data, setData] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchBookstoreReports({ dateFrom, dateTo }).then(setData)
  }, [dateFrom, dateTo])

  const columns = [
    { key: 'productId', label: 'SKU' },
    { key: 'name', label: 'Product' },
    { key: 'units', label: 'Units' },
    { key: 'revenue', label: 'Revenue', render: (r) => formatINR(r.revenue) },
  ]

  return (
    <BookstorePageShell
      icon={BarChart3}
      title="Reports & Analytics"
      actions={
        <div className="flex gap-2">
          <button type="button" onClick={() => setFilterOpen(true)} className="inline-flex items-center gap-1 rounded-lg border border-white/30 px-2.5 py-1.5 text-xs font-semibold text-white">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
          <button type="button" onClick={() => setExportOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      }
    >
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold">Date-wise sales</h3>
        <BookstoreBarChart data={data?.dateWise || []} valueKey="amount" labelKey="label" formatValue={formatINR} />
      </div>
      <PaginatedFigmaTable columns={columns} data={data?.productSales || []} itemLabel="rows" />

      <BookstoreModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export report"
        subtitle="Download bookstore analytics"
        size="sm"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={() => { exportToCsv(data?.productSales || [], 'bookstore-product-sales.csv'); setExportOpen(false) }}>Export CSV</Button>
          </BookstoreModalFooter>
        }
      >
        <p className="text-sm text-[#444]">Exports the current product sales table. Excel export can be wired to the same dataset.</p>
      </BookstoreModal>

      <BookstoreModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Analytics filters"
        subtitle="Refine report date range"
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); setFilterOpen(false) }}>Reset</Button>
            <Button onClick={() => setFilterOpen(false)}>Apply filters</Button>
          </BookstoreModalFooter>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>From</span>
            <input type="date" className={BOOKSTORE_INPUT_CLASS} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label>
            <span className={BOOKSTORE_LABEL_CLASS}>To</span>
            <input type="date" className={BOOKSTORE_INPUT_CLASS} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
        </div>
      </BookstoreModal>
    </BookstorePageShell>
  )
}
