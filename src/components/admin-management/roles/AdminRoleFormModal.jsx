import { useRef, useState } from 'react'
import { getModalEditKey, useInitOnModalOpen } from '../../../hooks/modalFormSync'
import { Loader2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import FloatingInput from '../ui/FloatingInput'
import { cn } from '../../../utils/cn'
import Modal from '../../ui/Modal'
import { getApiErrorMessage } from '../../../utils/apiError'
import {
  createRole as createRoleApi,
  updateRole as updateRoleApi,
} from '../../../services/roleService'
import { normalizeRoleCodeInput, validateRoleForm } from '../../../utils/roleValidation'

const fieldLabelClass = cn(
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500',
)

export default function AdminRoleFormModal({ open, onClose, initialRole, onSuccess }) {
  const isEdit = !!initialRole
  const isSystemRole = !!(initialRole?.fullAccess || initialRole?.systemProtected)

  const [loading, setLoading] = useState(false)
  const [label, setLabel] = useState('')
  const [roleCode, setRoleCode] = useState('')
  const initialRoleRef = useRef(initialRole)
  initialRoleRef.current = initialRole
  const editKey = getModalEditKey(initialRole)
  const savingRef = useRef(false)

  useInitOnModalOpen(open, editKey, () => {
    const role = initialRoleRef.current
    if (role) {
      setLabel(role.label || '')
      setRoleCode(role.roleCode || '')
    } else {
      setLabel('')
      setRoleCode('')
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (savingRef.current) return

    const role = initialRoleRef.current
    if (isEdit && role && isSystemRole) {
      toast.error('This system role cannot be edited')
      return
    }

    const { isValid, errors, payload } = validateRoleForm({
      roleTitle: label,
      roleCode,
      isEdit,
    })

    if (!isValid) {
      const firstError = errors.roleTitle || errors.roleCode
      toast.error(firstError)
      return
    }

    savingRef.current = true
    setLoading(true)

    try {
      if (isEdit && role) {
        await updateRoleApi(role.id, {
          roleTitle: payload.roleTitle,
          roleCode: role.roleCode || roleCode.trim(),
        })
        toast.success('Role access updated')
      } else {
        await createRoleApi(payload)
        toast.success('Role access created')
      }
      await onSuccess?.()
      onClose()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Could not save role'))
    } finally {
      savingRef.current = false
      setLoading(false)
    }
  }

  const modalTitle = isEdit ? 'Edit Role Access' : 'Create Role Access'

  return (
    <Modal open={open} onClose={onClose} size="md" title={modalTitle}>
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 pr-14">
          <h2 id="role-access-modal-title" className="text-xl font-bold text-slate-900">
            {modalTitle}
          </h2>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-6 px-6 py-6">
            <FloatingInput
              id="role-access-label"
              label="Role Title (Display)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isSystemRole && isEdit}
            />

            {isEdit ? (
              <div>
                <label className={fieldLabelClass}>Role Code</label>
                <p className="rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 font-mono text-sm font-semibold tracking-wide text-slate-700">
                  {roleCode}
                </p>
              </div>
            ) : (
              <FloatingInput
                label="Role Code"
                value={roleCode}
                onChange={(e) => setRoleCode(normalizeRoleCodeInput(e.target.value))}
                placeholder="e.g. SUPER_ADMIN"
              />
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200/90 bg-white/98 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (isSystemRole && isEdit) || !label.trim()}
              className="inline-flex min-w-[8rem] items-center justify-center gap-2 rounded-xl bg-[#1a3a5c] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#152f4a] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
