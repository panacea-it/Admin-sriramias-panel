import { useEffect, useState } from 'react'
import { BarChart3, Download, Filter } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import { BannerButton } from '../../components/academics/AcademicsUi'
import ReportsSalesTable from '../../components/bookstore/reports/ReportsSalesTable'
import {
  ReportsCategoryRevenueSection,
  ReportsDateWiseSalesSection,
  ReportsSummaryCards,
} from '../../components/bookstore/reports/BookstoreReportsCharts'
import { fetchBookstoreReports } from '../../api/bookstoreAPI'
import { exportToCsv } from '../../utils/financeExport'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

export default function BookstoreReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchBookstoreReports({ dateFrom, dateTo })
      .then(setData)
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo])

  const productSales = data?.productSales || []

  return (
    <BookstorePageShell
      icon={BarChart3}
      title="Reports & Analytics"
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <BannerButton showPlusIcon={false} onClick={() => setFilterOpen(true)}>
            <Filter className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            Filters
          </BannerButton>
          <BannerButton showPlusIcon={false} onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 shrink-0" strokeWidth={2.2} />
            Export
          </BannerButton>
        </div>
      }
    >
      <div className="space-y-5 sm:space-y-6">
        <ReportsSummaryCards />

        <ReportsDateWiseSalesSection />

        <ReportsCategoryRevenueSection />

        <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
          <h3 className="mb-5 text-sm font-bold text-[#111] sm:text-base">Product sales</h3>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <ReportsSalesTable
              rows={productSales}
              loading={loading}
              resetDeps={[dateFrom, dateTo]}
            />
          </div>
        </section>
      </div>

      <BookstoreModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export report"
        subtitle="Download bookstore analytics"
        size="sm"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button onClick={() => { exportToCsv(productSales, 'bookstore-product-sales.csv'); setExportOpen(false) }}>Export CSV</Button>
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
