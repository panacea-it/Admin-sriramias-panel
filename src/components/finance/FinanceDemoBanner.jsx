import { Info } from 'lucide-react'

export default function FinanceDemoBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#55ace7]/25 bg-[#eef6fc] px-4 py-3 text-sm text-[#246392]">
      <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
      <p>
        <span className="font-bold">Finance Operations (demo data).</span> All modules are linked — student
        profiles, verification, receipts, EMI, and communication share the same records. Connect APIs to go live.
      </p>
    </div>
  )
}
