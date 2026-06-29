import CreateAdminModal from '../admin-management/CreateAdminModal'
import UserFormModal from './UserFormModal'
import { isStudentRow } from '../../utils/userHelpers'

/**
 * Role-based edit dialog for List Users.
 * Students → Create Student form (edit mode).
 * All other roles → Admin Management Create User Access form (edit mode).
 */
export default function EditUserModal({
  open,
  onClose,
  user,
  onStudentUpdate,
  updatePending = false,
  createLabel = 'Create Student',
  onAdminSuccess,
}) {
  if (!user) return null

  if (isStudentRow(user)) {
    return (
      <UserFormModal
        open={open}
        onClose={onClose}
        onUpdate={onStudentUpdate}
        editingUser={user}
        createLabel={createLabel}
        updatePending={updatePending}
      />
    )
  }

  return (
    <CreateAdminModal
      open={open}
      onClose={onClose}
      editingId={user.id}
      prefillRow={user}
      onSuccess={onAdminSuccess}
    />
  )
}
