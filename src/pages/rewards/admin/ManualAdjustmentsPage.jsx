import { useState } from 'react'
import { SlidersHorizontal, Plus, Minus } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import WalletAdjustModal from '../../../components/rewards/WalletAdjustModal'
import ConfirmRewardActionModal from '../../../components/rewards/ConfirmRewardActionModal'
import { useStudentWalletsManagement } from '../../../hooks/useStudentWalletsManagement'
import { adjustWallet } from '../../../services/rewardService'
import { getApiErrorMessage } from '../../../utils/apiError'
import { ADMIN_CARD } from '../../../utils/adminUiStandards'
import { toast } from '@/utils/toast'

export default function ManualAdjustmentsPage() {
  const { wallets, refresh } = useStudentWalletsManagement()
  const [mode, setMode] = useState(null)
  const [pending, setPending] = useState(null)
  const [loading, setLoading] = useState(false)

  return (
    <RewardsPageShell icon={SlidersHorizontal} title="Manual Adjustments">
      <div className="grid gap-4 sm:grid-cols-2">
        <button type="button" onClick={() => setMode('credit')} className={cardBtn}>
          <Plus className="h-6 w-6 text-emerald-600" />
          <span className="text-base font-bold">Manual Credit</span>
          <span className="text-sm text-slate-500">Add coins with audit reason</span>
        </button>
        <button type="button" onClick={() => setMode('debit')} className={cardBtn}>
          <Minus className="h-6 w-6 text-rose-600" />
          <span className="text-base font-bold">Manual Debit</span>
          <span className="text-sm text-slate-500">Remove coins with confirmation</span>
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className={`${ADMIN_CARD} lg:col-span-2`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">Recent activity (dummy)</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Preview</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            This is placeholder content so you can judge spacing, typography, and empty-state layout.
          </p>

          <ul className="mt-4 divide-y divide-slate-100">
            {[
              { who: 'Student A', action: 'Credit', amount: '+25', note: 'Event bonus', when: '2 mins ago' },
              { who: 'Student B', action: 'Debit', amount: '-10', note: 'Correction', when: 'Today, 10:40 AM' },
              { who: 'Student C', action: 'Credit', amount: '+5', note: 'Referral', when: 'Yesterday' },
            ].map((row) => (
              <li key={`${row.who}-${row.when}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-slate-900">{row.who}</span>
                    <span className="text-sm text-slate-500">•</span>
                    <span className="text-sm font-semibold text-slate-700">{row.action}</span>
                    <span className="text-sm text-slate-500">({row.note})</span>
                  </div>
                  <div className="text-xs text-slate-500">{row.when}</div>
                </div>
                <div className="mt-1 flex items-center gap-2 sm:mt-0">
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-bold',
                      row.amount.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                    ].join(' ')}
                  >
                    {row.amount} 1S
                  </span>
                  <span className="text-xs text-slate-400">Txn: DUMMY-{row.who.replaceAll(' ', '').toUpperCase()}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className={ADMIN_CARD}>
          <h2 className="text-base font-bold text-slate-900">Notes (dummy)</h2>
          <p className="mt-2 text-sm text-slate-600">
            Use manual adjustments sparingly. Every change should include an audit-friendly reason and be reviewed when needed.
          </p>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Example reasons</div>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
              <li>“Event participation bonus”</li>
              <li>“Duplicate transaction reversal”</li>
              <li>“Admin correction after support ticket”</li>
            </ul>
          </div>
        </aside>
      </div>

      <WalletAdjustModal open={Boolean(mode)} mode={mode} students={wallets} onClose={() => setMode(null)} onSubmit={setPending} />
      <ConfirmRewardActionModal
        open={Boolean(pending)}
        title="Confirm adjustment"
        description={`${pending?.type} ${pending?.amount} 1S for selected student`}
        loading={loading}
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          setLoading(true)
          try {
            await adjustWallet(pending)
            toast.success('Adjustment recorded')
            setPending(null)
            setMode(null)
            await refresh()
          } catch (error) {
            toast.error(getApiErrorMessage(error, 'Failed'))
          } finally {
            setLoading(false)
          }
        }}
      />
    </RewardsPageShell>
  )
}

const cardBtn = `${ADMIN_CARD} flex flex-col items-start gap-2 text-left transition hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)]`
