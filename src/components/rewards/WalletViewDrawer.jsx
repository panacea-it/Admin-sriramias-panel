import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { getWalletTransactions } from '../../services/rewardService'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { formatCoins } from '../../utils/rewardApiHelpers'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '@/utils/toast'

export default function WalletViewDrawer({ open, wallet, onClose }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !wallet?.id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await getWalletTransactions(wallet.id)
        if (!cancelled) setTransactions(Array.isArray(data) ? data : [])
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, 'Failed to load transactions'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, wallet?.id])

  if (typeof document === 'undefined') return null

  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatCategoryDateTime(r.date) },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount', render: (r) => formatCoins(r.amount) },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status' },
  ]

  return createPortal(
    <AnimatePresence>
      {open && wallet && (
        <>
          <motion.div
            className="fixed inset-0 z-[200] bg-slate-900/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[201] flex w-full max-w-lg flex-col bg-white shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{wallet.studentName}</h2>
                <p className="text-xs text-slate-500">{wallet.studentId}</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 border-b border-slate-100 p-4">
              <BalanceCard label="Available" value={formatCoins(wallet.balance)} />
              <BalanceCard label="Locked" value={formatCoins(wallet.lockedBalance)} />
              <BalanceCard label="Expired" value={formatCoins(wallet.expiredCoins)} />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-800">Transactions</h3>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#246392]" />
                </div>
              ) : (
                <PaginatedFigmaTable
                  columns={columns}
                  data={transactions}
                  loading={loading}
                  initialPageSize={8}
                  stickyHeader
                />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function BalanceCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#1a3a5c]">{value}</p>
    </div>
  )
}
