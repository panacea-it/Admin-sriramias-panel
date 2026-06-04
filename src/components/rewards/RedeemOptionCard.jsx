import { Gift } from 'lucide-react'
import { formatCoins } from '../../utils/rewardApiHelpers'

export default function RedeemOptionCard({ option, balance, onRedeem }) {
  const insufficient = balance < option.requiredCoins

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      <div className="bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-3">
        <Gift className="h-5 w-5 text-white" />
        <h3 className="mt-2 text-base font-bold text-white">{option.title}</h3>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm text-slate-600">{option.description}</p>
        <p className="mt-3 text-lg font-bold text-[#1a3a5c]">{formatCoins(option.requiredCoins)}</p>
        <button
          type="button"
          disabled={insufficient}
          onClick={() => onRedeem(option)}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {insufficient ? 'Insufficient balance' : 'Redeem'}
        </button>
      </div>
    </article>
  )
}
