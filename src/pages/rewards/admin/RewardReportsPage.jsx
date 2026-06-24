import { useCallback, useEffect, useState } from 'react'
import { FileSpreadsheet, Download, Loader2, Upload } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import AdminDataPanel from '../../../components/admin/AdminDataPanel'
import AdminStandardTable from '../../../components/admin/AdminStandardTable'
import UploadResultSheetModal from '../../../components/rewards/UploadResultSheetModal'
import { exportRewardReport, getExportHistory } from '../../../services/rewardService'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../utils/apiError'
import { ADMIN_CARD, ADMIN_PRIMARY_BTN, ADMIN_SECONDARY_BTN } from '../../../utils/adminUiStandards'
import { courseFieldShell } from '../../../components/courses/CourseFormField'
import { cn } from '../../../utils/cn'
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
        <button type="button" onClick={() => setUploadOpen(true)} className={ADMIN_SECONDARY_BTN}>
          <Upload className="h-4 w-4" />
          Upload Result Sheet
        </button>
      }
    >
      <div className={ADMIN_CARD}>
        <div className="grid gap-4 sm:grid-cols-3">
          <select value={report} onChange={(e) => setReport(e.target.value)} className={courseFieldShell}>
            {REPORT_TYPES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className={courseFieldShell}>
            {FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button type="button" onClick={handleExport} disabled={exporting} className={cn(ADMIN_PRIMARY_BTN, 'justify-center')}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </button>
        </div>
        {exporting && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-[#55ace7] transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <AdminDataPanel tableClassName="mt-4">
        <AdminStandardTable columns={columns} data={history} itemLabel="exports" />
      </AdminDataPanel>
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
