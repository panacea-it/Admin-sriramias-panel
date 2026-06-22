import { useCallback, useEffect, useState } from 'react'
import { Gift, Settings2 } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import AdminDataPanel from '../../../components/admin/AdminDataPanel'
import AdminStandardTable from '../../../components/admin/AdminStandardTable'
import CourseFilterToolbar from '../../../components/courses/CourseFilterToolbar'
import RedemptionSettingsModal from '../../../components/rewards/RedemptionSettingsModal'
import { StatusBadge } from '../../../components/academics/AcademicsUi'
import { getRedemptions, getRedemptionSettings, updateRedemptionSettings } from '../../../services/rewardService'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { formatCoins } from '../../../utils/rewardApiHelpers'
import { getApiErrorMessage } from '../../../utils/apiError'
import { ADMIN_SECONDARY_BTN } from '../../../utils/adminUiStandards'
import { toast } from '@/utils/toast'

export default function RedemptionsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [settings, setSettings] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, cfg] = await Promise.all([getRedemptions({ search }), getRedemptionSettings()])
      setRows(Array.isArray(list) ? list : [])
      setSettings(cfg)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load redemptions'))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'coinsUsed', label: 'Coins Used', render: (r) => formatCoins(r.coinsUsed) },
    { key: 'skuName', label: 'SKU Name' },
    { key: 'orderId', label: 'Order ID' },
    { key: 'redemptionDate', label: 'Redemption Date', render: (r) => formatCategoryDateTime(r.redemptionDate) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  const saveSettings = async (payload) => {
    setSaving(true)
    try {
      await updateRedemptionSettings(payload)
      setSettings(payload)
      toast.success('Redemption settings saved')
      setSettingsOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <RewardsPageShell
      icon={Gift}
      title="Redemption Management"
      actions={
        <button type="button" onClick={() => setSettingsOpen(true)} className={ADMIN_SECONDARY_BTN}>
          <Settings2 className="h-4 w-4" />
          Settings
        </button>
      }
    >
      <AdminDataPanel
        toolbar={
          <CourseFilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search student or order…"
            disabled={loading && rows.length === 0}
          />
        }
      >
        <AdminStandardTable columns={columns} data={rows} loading={loading} stickyHeader itemLabel="redemptions" />
      </AdminDataPanel>
      <RedemptionSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initial={settings}
        onSave={saveSettings}
        loading={saving}
      />
    </RewardsPageShell>
  )
}
