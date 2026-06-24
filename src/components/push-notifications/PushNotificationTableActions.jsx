import EditButton from '../common/EditButton'

export default function PushNotificationTableActions({ row, onEdit, onDelete: _onDelete }) {
  return (
    <div
      role="group"
      aria-label={`Actions for notification ${row.id}`}
      className="mx-auto flex w-max max-w-full flex-nowrap items-center justify-center gap-1 sm:gap-1.5"
    >
      <EditButton onClick={onEdit} />
    </div>
  )
}
