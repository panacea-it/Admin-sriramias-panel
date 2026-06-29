import { useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { toast } from '@/utils/toast'
import EditUserModal from '../../components/manage-users/EditUserModal'
import UserDetailPageView from '../../components/manage-users/UserDetailPageView'
import { buildUserDetailModel } from '../../components/manage-users/mapUserDetailSections'
import { useUser } from '../../hooks/user/useUser'
import { useUpdateUser } from '../../hooks/user/useUpdateUser'
import {
  buildStudent360,
  mapManageUserRowToStudentProfile,
} from '../../utils/studentDetailAggregator'
import { getRecordTypeQuery } from '../../utils/userHelpers'
import { getApiErrorMessage } from '../../utils/apiError'

export default function StudentDetailPage() {
  const { userId } = useParams()
  const location = useLocation()
  const listRow = location.state?.listRow
  const recordType = location.state?.recordType || getRecordTypeQuery(listRow)

  const [editOpen, setEditOpen] = useState(false)
  const updateUserMutation = useUpdateUser()

  const userQuery = useUser(userId, recordType, Boolean(userId))
  const summary = userQuery.data?.summary || listRow

  const apiProfile = useMemo(() => mapManageUserRowToStudentProfile(summary), [summary])

  const student360 = useMemo(
    () => buildStudent360(userId, { apiProfile }),
    [userId, apiProfile],
  )

  const detailModel = useMemo(
    () => buildUserDetailModel({ summary, student360 }),
    [summary, student360],
  )

  const handleStudentUpdate = async (id, patch) => {
    try {
      const response = await updateUserMutation.mutateAsync({
        id,
        payload: patch,
        type: recordType,
      })
      toast.success(response?.message || 'Student updated successfully')
      await userQuery.refetch()
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update student'))
      return false
    }
  }

  return (
    <>
      <UserDetailPageView
        model={detailModel}
        loading={userQuery.isLoading && !listRow}
        onEdit={summary ? () => setEditOpen(true) : undefined}
      />

      <EditUserModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={summary}
        onStudentUpdate={handleStudentUpdate}
        updatePending={updateUserMutation.isPending}
        onAdminSuccess={() => {
          userQuery.refetch()
          setEditOpen(false)
        }}
      />
    </>
  )
}
