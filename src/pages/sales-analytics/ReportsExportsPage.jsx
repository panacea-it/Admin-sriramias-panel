import { useEffect, useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import { fetchReportTypes, exportSalesReport } from '../../api/salesAnalyticsAPI'
import { useSalesPermissions } from '../../hooks/useSalesPermissions'
import { toast } from '../../utils/toast'

export default function ReportsExportsPage() {
  const { canExport } = useSalesPermissions()
  const [types, setTypes] = useState([])
  const [dateFrom, setDateFrom] = useState('2026-05-01')
  const [dateTo, setDateTo] = useState('2026-05-20')
  const [center, setCenter] = useState('all')

  useEffect(() => {
    fetchReportTypes().then((res) => setTypes(res.types || []))
  }, [])

  const handleExport = async (type, format) => {
    if (!canExport) {
      toast.error('Export not permitted for your role')
      return
    }
    try {
      await exportSalesReport(type, { format, dateFrom, dateTo, center })
      toast.success(`${format.toUpperCase()} export started for ${type}`)
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <SalesPageShell icon={FileSpreadsheet} title="Reports & Exports">
      <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <h3 className="mb-4 text-sm font-bold text-[#111]">Filters</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-[#686868]">
            From
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-[#686868]">
            To
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-[#686868]">
            Center
            <select value={center} onChange={(e) => setCenter(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
              <option value="all">All centers</option>
              <option value="delhi">Delhi</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="pune">Pune</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {types.map((report) => (
          <div
            key={report.id}
            className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <div>
              <h3 className="font-bold text-[#111]">{report.name}</h3>
              <p className="mt-1 text-sm text-[#686868]">{report.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleExport(report.id, 'excel')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#246392] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a4d6e]"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </button>
              <button
                type="button"
                onClick={() => handleExport(report.id, 'pdf')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#246392] px-3 py-2 text-xs font-semibold text-[#246392] hover:bg-[#f0f7fc]"
              >
                <FileText className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </SalesPageShell>
  )
}
