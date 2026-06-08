import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatCard from '../../components/bookstore/BookstoreStatCard'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { fetchBookstoreWallet } from '../../api/bookstoreAPI'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { toast } from '../../utils/toast'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

export default function BookstoreWalletPage() {
  const [txns, setTxns] = useState([])
  const [rewardOpen, setRewardOpen] = useState(false)
  const [txnOpen, setTxnOpen] = useState(false)
  const [rewardForm, setRewardForm] = useState({ user: '', points: '', type: 'credit', reason: '' })

  useEffect(() => {
    fetchBookstoreWallet().then((res) => setTxns(res?.transactions || []))
  }, [])

  const credits = txns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.points, 0)
  const debits = txns.filter((t) => t.type === 'debit').reduce((s, t) => s + t.points, 0)

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'User' },
    { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type}</span> },
    { key: 'points', label: 'Points' },
    { key: 'reason', label: 'Reason' },
    { key: 'createdAt', label: 'Date', render: (r) => formatCategoryDateTime(r.createdAt) },
  ]

  return (
    <BookstorePageShell
      icon={Wallet}
      title="Wallet & Rewards"
      actions={
        <div className="flex gap-2">
          <button type="button" onClick={() => setRewardOpen(true)} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">Adjust rewards</button>
          <button type="button" onClick={() => setTxnOpen(true)} className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold text-white">Log transaction</button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <BookstoreStatCard label="Credits (period)" value={credits} sub="Reward points issued" />
        <BookstoreStatCard label="Debits (period)" value={debits} sub="Points redeemed" accent="from-[#e74c3c] to-[#c0392b]" />
        <BookstoreStatCard label="Net balance trend" value={credits - debits} sub="Analytics snapshot" accent="from-[#55ace7] to-[#246392]" />
      </div>
      <PaginatedFigmaTable columns={columns} data={txns} itemLabel="transactions" />

      <BookstoreModal
        open={rewardOpen}
        onClose={() => setRewardOpen(false)}
        title="Reward adjustment"
        subtitle="Credit or debit reward points"
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setRewardOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success('Reward adjustment saved'); setRewardOpen(false) }}>Apply</Button>
          </BookstoreModalFooter>
        }
      >
        <div className="space-y-4">
          <label><span className={BOOKSTORE_LABEL_CLASS}>User</span><input className={BOOKSTORE_INPUT_CLASS} value={rewardForm.user} onChange={(e) => setRewardForm((f) => ({ ...f, user: e.target.value }))} /></label>
          <label><span className={BOOKSTORE_LABEL_CLASS}>Type</span>
            <select className={BOOKSTORE_INPUT_CLASS} value={rewardForm.type} onChange={(e) => setRewardForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="credit">Credit</option><option value="debit">Debit</option>
            </select>
          </label>
          <label><span className={BOOKSTORE_LABEL_CLASS}>Points</span><input type="number" className={BOOKSTORE_INPUT_CLASS} value={rewardForm.points} onChange={(e) => setRewardForm((f) => ({ ...f, points: e.target.value }))} /></label>
          <label><span className={BOOKSTORE_LABEL_CLASS}>Reason</span><input className={BOOKSTORE_INPUT_CLASS} value={rewardForm.reason} onChange={(e) => setRewardForm((f) => ({ ...f, reason: e.target.value }))} /></label>
        </div>
      </BookstoreModal>

      <BookstoreModal
        open={txnOpen}
        onClose={() => setTxnOpen(false)}
        title="Wallet transaction"
        subtitle="Record a manual wallet entry"
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setTxnOpen(false)}>Cancel</Button>
            <Button onClick={() => { toast.success('Transaction logged'); setTxnOpen(false) }}>Save</Button>
          </BookstoreModalFooter>
        }
      >
        <p className="text-sm text-[#686868]">Use the same fields as reward adjustment for bookstore wallet audit trail.</p>
      </BookstoreModal>
    </BookstorePageShell>
  )
}
