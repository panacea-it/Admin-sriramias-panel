import { useCallback, useEffect, useState } from 'react'
import { Medal, PlusCircle } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import EditButton from '../../../components/common/EditButton'
import { StatusBadge } from '../../../components/academics/AcademicsUi'
import BadgeFormModal from '../../../components/rewards/BadgeFormModal'
import { getBadges, saveBadge } from '../../../services/rewardService'
import { formatCoins } from '../../../utils/rewardApiHelpers'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '@/utils/toast'
import { RULE_STATUS } from '../../../constants/rewards'

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
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <EditButton onClick={() => { setEditing(r); setOpen(true) }} />
          <button
            type="button"
            className="text-xs font-semibold text-amber-700"
            onClick={async () => {
              const next = r.status === RULE_STATUS.ACTIVE ? RULE_STATUS.INACTIVE : RULE_STATUS.ACTIVE
              await saveBadge({ status: next }, r.id)
              toast.success('Badge status updated')
              refresh()
            }}
          >
            Disable
          </button>
        </div>
      ),
    },
  ]

  return (
    <RewardsPageShell
      icon={Medal}
      title="Badge Management"
      actions={
        <button type="button" onClick={() => { setEditing(null); setOpen(true) }} className={addBtn}>
          <PlusCircle className="h-4 w-4" />
          Create Badge
        </button>
      }
    >
      <PaginatedFigmaTable columns={columns} data={badges} loading={loading} stickyHeader />
      <BadgeFormModal
        open={open}
        onClose={() => { setOpen(false); setEditing(null) }}
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

const addBtn =
  'inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white'
