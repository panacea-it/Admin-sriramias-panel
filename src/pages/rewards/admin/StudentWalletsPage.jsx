import { useState } from 'react'
import { Wallet, Eye, Plus, Minus } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import CourseFilterToolbar from '../../../components/courses/CourseFilterToolbar'
import WalletViewDrawer from '../../../components/rewards/WalletViewDrawer'
import WalletAdjustModal from '../../../components/rewards/WalletAdjustModal'
import ConfirmRewardActionModal from '../../../components/rewards/ConfirmRewardActionModal'
import RewardsErrorState from '../../../components/rewards/RewardsErrorState'
import { useStudentWalletsManagement } from '../../../hooks/useStudentWalletsManagement'
import { formatCoins } from '../../../utils/rewardApiHelpers'
import { adjustWallet } from '../../../services/rewardService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '@/utils/toast'

export default function StudentWalletsPage() {
  const { wallets, loading, loadError, search, setSearch, refresh } = useStudentWalletsManagement()
  const [viewWallet, setViewWallet] = useState(null)
  const [adjustMode, setAdjustMode] = useState(null)
  const [confirmAdjust, setConfirmAdjust] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const columns = [
    { key: 'studentName', label: 'Student Name', render: (r) => <span className="font-medium">{r.studentName}</span> },
    { key: 'balance', label: 'Wallet Balance', render: (r) => formatCoins(r.balance) },
    { key: 'lifetimeEarned', label: 'Lifetime Earned', render: (r) => formatCoins(r.lifetimeEarned) },
    { key: 'lifetimeRedeemed', label: 'Lifetime Redeemed', render: (r) => formatCoins(r.lifetimeRedeemed) },
    { key: 'expiredCoins', label: 'Expired Coins', render: (r) => formatCoins(r.expiredCoins) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-[#246392]" onClick={() => setViewWallet(r)}>
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700" onClick={() => setAdjustMode('credit')}>
            <Plus className="h-3.5 w-3.5" /> Credit
          </button>
          <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600" onClick={() => setAdjustMode('debit')}>
            <Minus className="h-3.5 w-3.5" /> Debit
          </button>
        </div>
      ),
    },
  ]

  return (
    <RewardsPageShell icon={Wallet} title="Student Wallets">
      <CourseFilterToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Student name, ID, mobile…" />
      {loadError ? <RewardsErrorState message={loadError} onRetry={refresh} /> : (
        <PaginatedFigmaTable columns={columns} data={wallets} loading={loading} stickyHeader />
      )}
      <WalletViewDrawer open={Boolean(viewWallet)} wallet={viewWallet} onClose={() => setViewWallet(null)} />
      <WalletAdjustModal
        open={Boolean(adjustMode)}
        mode={adjustMode}
        students={wallets}
        onClose={() => setAdjustMode(null)}
        onSubmit={(form) => setConfirmAdjust(form)}
      />
      <ConfirmRewardActionModal
        open={Boolean(confirmAdjust)}
        title="Confirm wallet adjustment?"
        description={`${confirmAdjust?.type === 'credit' ? 'Credit' : 'Debit'} ${confirmAdjust?.amount} 1S — ${confirmAdjust?.reason}`}
        loading={submitting}
        onCancel={() => setConfirmAdjust(null)}
        onConfirm={async () => {
          setSubmitting(true)
          try {
            await adjustWallet(confirmAdjust)
            toast.success('Wallet updated')
            setConfirmAdjust(null)
            setAdjustMode(null)
            await refresh()
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'Adjustment failed'))
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </RewardsPageShell>
  )
}
