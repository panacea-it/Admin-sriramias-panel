import { motion } from 'framer-motion'
import {
  Building2,
  Calendar,
  Clock,
  Mail,
  Phone,
  Shield,
  User,
  Users,
} from 'lucide-react'
import Modal from '../ui/Modal'
import { roleLabel } from '../../data/manageUsersConfig'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { cn } from '../../utils/cn'

function formatEmpty(value, fallback = 'Not provided') {
  const v = typeof value === 'string' ? value.trim() : value
  if (v == null || v === '') return fallback
  return v
}

function UserStatusPill({ status, onHeader = false }) {
  const active = status === 'Active'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1',
        onHeader
          ? active
            ? 'bg-white/95 text-[#166534] ring-white/50 shadow-[0_2px_12px_rgba(255,255,255,0.25)]'
            : 'bg-white/90 text-[#9a3412] ring-white/40 shadow-[0_2px_12px_rgba(255,255,255,0.2)]'
          : active
            ? 'bg-[#ecfdf3] text-[#166534] ring-[#86efac]/50'
            : 'bg-[#fff7ed] text-[#9a3412] ring-[#fdba74]/40',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-[#22c55e]' : 'bg-[#f59e0b]',
        )}
        aria-hidden
      />
      {status || 'Active'}
    </span>
  )
}

function InfoCard({ icon: Icon, label, children, className }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#eef2fc] bg-gradient-to-b from-[#fafcff] to-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {Icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef6fc] ring-1 ring-[#cfe8f8]/80">
            <Icon className="h-4 w-4 text-[#246392]" strokeWidth={2.1} aria-hidden />
          </span>
        ) : null}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          {label}
        </p>
      </div>
      <div className="text-sm font-semibold leading-snug text-[#111]">{children}</div>
    </div>
  )
}

function EmptyValue({ children = 'Not provided' }) {
  return <span className="font-medium text-[#9ca3af]">{children}</span>
}

export default function ViewUserModal({ open, onClose, user }) {
  if (!open || !user) return null

  const parentName = formatEmpty(user.parentName)
  const parentPhone = formatEmpty(user.parentPhone)
  const center = formatEmpty(user.assignedCenter, 'Unavailable')
  const joined = user.joinedAt ? formatCategoryDateTime(user.joinedAt) : null
  const updated = user.updatedAt ? formatCategoryDateTime(user.updatedAt) : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={`View user — ${user.fullName}`}
      className="sm:my-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex max-h-[min(90vh,720px)] flex-col overflow-hidden rounded-2xl bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.2)] ring-1 ring-white/80 backdrop-blur-sm"
        role="document"
        aria-labelledby="view-user-dialog-title"
      >
        <div className="shrink-0 border-b border-[#eef2fc] bg-gradient-to-r from-[#55ace7] via-[#3d7eb5] to-[#246392] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt=""
                  className="h-20 w-20 rounded-2xl border-2 border-white/40 object-cover shadow-lg ring-2 ring-white/30 sm:h-[88px] sm:w-[88px]"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/95 text-[#246392] shadow-lg ring-2 ring-white/20 sm:h-[88px] sm:w-[88px]">
                  <User className="h-10 w-10" strokeWidth={1.75} aria-hidden />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
                User profile
              </p>
              <h2
                id="view-user-dialog-title"
                className="mt-0.5 truncate text-xl font-bold sm:text-2xl"
              >
                {user.fullName}
              </h2>
              <p className="mt-1 font-mono text-sm font-medium text-[#cbeeff]">{user.userId}</p>
              <div className="mt-3">
                <UserStatusPill status={user.status} onHeader />
              </div>
            </div>
          </div>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#c5d9eb_transparent]"
        >
          <p className="mb-4 text-sm text-[#686868]">
            Account details for this user. Contact and access information is read-only.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <InfoCard icon={Mail} label="Email">
              <span className="break-all">{user.email}</span>
            </InfoCard>

            <InfoCard icon={Phone} label="Phone">
              {user.phone ? (
                <span>{user.phone}</span>
              ) : (
                <EmptyValue>Not provided</EmptyValue>
              )}
            </InfoCard>

            <InfoCard icon={Users} label="Parent name">
              {parentName === 'Not provided' ? (
                <EmptyValue>{parentName}</EmptyValue>
              ) : (
                parentName
              )}
            </InfoCard>

            <InfoCard icon={Phone} label="Parent phone number">
              {parentPhone === 'Not provided' ? (
                <EmptyValue>{parentPhone}</EmptyValue>
              ) : (
                parentPhone
              )}
            </InfoCard>

            <InfoCard icon={Shield} label="Role">
              {roleLabel(user.role)}
            </InfoCard>

            <InfoCard icon={Building2} label="Assigned center">
              {center === 'Unavailable' ? (
                <EmptyValue>{center}</EmptyValue>
              ) : (
                center
              )}
            </InfoCard>

            <InfoCard icon={Calendar} label="Joined date">
              {joined ? joined : <EmptyValue>Unavailable</EmptyValue>}
            </InfoCard>

            <InfoCard icon={Clock} label="Last updated">
              {updated ? updated : <EmptyValue>Unavailable</EmptyValue>}
            </InfoCard>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#e5eaf2] bg-[#f8fafc]/90 px-5 py-4 backdrop-blur-md sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'h-11 min-w-[120px] rounded-xl px-8 text-sm font-semibold text-white',
                'bg-gradient-to-r from-[#1a3a5c] to-[#03045e]',
                'shadow-[0_4px_14px_rgba(3,4,94,0.35)]',
                'transition duration-200 hover:scale-[1.02] hover:opacity-95 active:scale-[0.98]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55ace7]',
              )}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </Modal>
  )
}
