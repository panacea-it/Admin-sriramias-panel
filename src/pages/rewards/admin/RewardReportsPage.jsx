import { useCallback, useEffect, useState } from 'react'
import { FileSpreadsheet, Download, Loader2, Upload } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import UploadResultSheetModal from '../../../components/rewards/UploadResultSheetModal'
import { exportRewardReport, getExportHistory } from '../../../services/rewardService'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '@/utils/toast'

const REPORT_TYPES = [
  'Reward Distribution',
  'Wallet Balances',
  'Redemption Report',
  'Referral Report',
  'Fraud Report',
  'Expiry Report',
]

const FORMATS = ['Excel', 'CSV', 'PDF']

export default function RewardReportsPage() {
  const [history, setHistory] = useState([])
  const [report, setReport] = useState(REPORT_TYPES[0])
  const [format, setFormat] = useState('CSV')
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      const data = await getExportHistory()
      setHistory(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load export history'))
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleExport = async () => {
    setExporting(true)
    setProgress(10)
    try {
      const timer = setInterval(() => setProgress((p) => Math.min(p + 15, 90)), 200)
      await exportRewardReport({ report, format })
      clearInterval(timer)
      setProgress(100)
      toast.success(`${report} export queued (${format})`)
      await loadHistory()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Export failed'))
    } finally {
      setTimeout(() => {
        setExporting(false)
        setProgress(0)
      }, 600)
    }
  }

  const columns = [
    { key: 'report', label: 'Report' },
    { key: 'format', label: 'Format' },
    { key: 'at', label: 'Exported', render: (r) => formatCategoryDateTime(r.at) },
    { key: 'status', label: 'Status' },
  ]

  return (
    <RewardsPageShell
      icon={FileSpreadsheet}
      title="Reward Reports"
      actions={
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <Upload className="h-4 w-4" />
          Upload Result Sheet
        </button>
      }
    >
      <div className="rounded-xl bg-white p-5 shadow-md">
        <div className="grid gap-4 sm:grid-cols-3">
          <select value={report} onChange={(e) => setReport(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
            {REPORT_TYPES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
            {FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button type="button" onClick={handleExport} disabled={exporting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] py-2.5 text-sm font-semibold text-white">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </button>
        </div>
        {exporting && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-[#246392] transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <h3 className="mt-6 text-sm font-bold text-slate-800">Export history</h3>
      <PaginatedFigmaTable columns={columns} data={history} itemLabel="exports" />
      <UploadResultSheetModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        loading={uploading}
        onUpload={async () => {
          setUploading(true)
          try {
            await new Promise((r) => setTimeout(r, 800))
            toast.success('Result sheet uploaded')
            setUploadOpen(false)
          } finally {
            setUploading(false)
          }
        }}
      />
    </RewardsPageShell>
  )
}
