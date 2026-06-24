import { useCallback, useEffect, useState } from 'react'
import { Medal, PlusCircle, Ban } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import AdminDataPanel from '../../../components/admin/AdminDataPanel'
import AdminStandardTable from '../../../components/admin/AdminStandardTable'
import TableActionMenu from '../../../components/common/TableActionMenu'
import { StatusBadge } from '../../../components/academics/AcademicsUi'
import BadgeFormModal from '../../../components/rewards/BadgeFormModal'
import { getBadges, saveBadge } from '../../../services/rewardService'
import { formatCoins } from '../../../utils/rewardApiHelpers'
import { getApiErrorMessage } from '../../../utils/apiError'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'
import { ADMIN_CREATE_BTN } from '../../../utils/adminUiStandards'
import { RULE_STATUS } from '../../../constants/rewards'
import { toast } from '@/utils/toast'

export default function BadgesPage() {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBadges()
      setBadges(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load badges'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const columns = [
    { key: 'name', label: 'Badge Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'criteria', label: 'Criteria' },
    { key: 'rewardCoins', label: 'Reward Coins', render: (r) => formatCoins(r.rewardCoins) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    createActionsColumn({
      buttonCount: 1,
      render: (r) => (
        <TableActionMenu
          triggerLabel={`Actions for ${r.name}`}
          items={[
            {
              label: 'Edit',
              icon: Medal,
              onClick: () => {
                setEditing(r)
                setOpen(true)
              },
            },
            {
              label: r.status === RULE_STATUS.ACTIVE ? 'Disable' : 'Enable',
              icon: Ban,
              onClick: async () => {
                const next = r.status === RULE_STATUS.ACTIVE ? RULE_STATUS.INACTIVE : RULE_STATUS.ACTIVE
                await saveBadge({ status: next }, r.id)
                toast.success('Badge status updated')
                refresh()
              },
            },
          ]}
        />
      ),
    }),
  ]

  return (
    <RewardsPageShell
      icon={Medal}
      title="Badge Management"
      actions={
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
          className={ADMIN_CREATE_BTN}
        >
          <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          Create Badge
        </button>
      }
    >
      <AdminDataPanel>
        <AdminStandardTable columns={columns} data={badges} loading={loading} stickyHeader itemLabel="badges" />
      </AdminDataPanel>
      <BadgeFormModal
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        initial={editing}
        loading={submitting}
        onSubmit={async (form) => {
          setSubmitting(true)
          try {
            await saveBadge(form, editing?.id)
            toast.success('Badge saved')
            setOpen(false)
            refresh()
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'Save failed'))
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </RewardsPageShell>
  )
}
