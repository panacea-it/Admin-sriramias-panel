import { useCallback, useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import PageBanner from '../../../components/figma/PageBanner'
import StudentPortalTabs from '../../../components/rewards/StudentPortalTabs'
import RedeemOptionCard from '../../../components/rewards/RedeemOptionCard'
import ConfirmRewardActionModal from '../../../components/rewards/ConfirmRewardActionModal'
import RewardsModalShell, { RewardsModalPrimaryButton } from '../../../components/rewards/RewardsModalShell'
import { getRedeemOptions, getStudentRewardsOverview, redeemCoins } from '../../../services/rewardService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '@/utils/toast'

export default function StudentRedeemPage() {
  const [options, setOptions] = useState([])
  const [balance, setBalance] = useState(0)
  const [selected, setSelected] = useState(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const [opts, overview] = await Promise.all([getRedeemOptions(), getStudentRewardsOverview()])
    setOptions(Array.isArray(opts) ? opts : [])
    setBalance(overview?.balance ?? 0)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const groups = {
    coupon: 'Discount Coupons',
    store: 'Store Purchases',
    content: 'Premium Content',
    merch: 'Merchandise',
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageBanner icon={Gift} title="Redeem Coins" />
      <StudentPortalTabs />
      {Object.entries(groups).map(([key, title]) => {
        const items = options.filter((o) => o.category === key)
        if (!items.length) return null
        return (
          <section key={key}>
            <h3 className="mb-3 text-base font-bold text-slate-900">{title}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((opt) => (
                <RedeemOptionCard key={opt.id} option={opt} balance={balance} onRedeem={setSelected} />
              ))}
            </div>
          </section>
        )
      })}
      <ConfirmRewardActionModal
        open={Boolean(selected)}
        title="Confirm redemption?"
        description={selected ? `Redeem "${selected.title}" for ${selected.requiredCoins} 1S?` : ''}
        confirmLabel="Redeem"
        loading={loading}
        onCancel={() => setSelected(null)}
        onConfirm={async () => {
          setLoading(true)
          try {
            const res = await redeemCoins({ optionId: selected.id, coins: selected.requiredCoins })
            setSuccessOpen(true)
            toast.success(`Redeemed! Order ${res.orderId}`)
            await load()
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'Redemption failed'))
          } finally {
            setLoading(false)
            setSelected(null)
          }
        }}
      />
      <RewardsModalShell
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Redemption Successful"
        description="Your redemption was recorded. Coins have been deducted from your wallet."
        footer={
          <RewardsModalPrimaryButton onClick={() => setSuccessOpen(false)}>Done</RewardsModalPrimaryButton>
        }
      />
    </div>
  )
}
