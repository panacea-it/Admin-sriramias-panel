import { Plus, ShieldCheck, Receipt, Bell, Download } from 'lucide-react'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'

export default function FinanceQuickActions({ onExport }) {
  const { goToFinance } = useFinanceOperations()
  const { canApprove, canReceipts, canExport, canEdit } = useFinancePermissions()

  const actions = [
    { label: 'Verify Payment', icon: ShieldCheck, onClick: () => goToFinance('verification'), show: canApprove },
    { label: 'Receipts', icon: Receipt, onClick: () => goToFinance('receipts'), show: canReceipts },
    { label: 'Send Reminder', icon: Bell, onClick: () => goToFinance('communication'), show: true },
    { label: 'Reports', icon: Download, onClick: () => goToFinance('reports'), show: canExport },
    { label: 'Add Payment', icon: Plus, onClick: () => goToFinance('verification', { addOffline: '1' }), show: canApprove || canEdit },
  ].filter((a) => a.show)

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#55ace7]/30 bg-white px-3 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef6fc]"
        >
          <a.icon className="h-4 w-4" strokeWidth={2} />
          {a.label}
        </button>
      ))}
      {onExport && canExport && (
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-3 text-sm font-bold text-white shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export dashboard
        </button>
      )}
    </div>
  )
}
