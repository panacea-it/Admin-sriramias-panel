import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'

export default function LeadTableActions({ onView, onEdit, onDelete: _onDelete }) {
  return (
    <div
      role="group"
      aria-label="Lead row actions"
      className="mx-auto flex w-max max-w-full flex-nowrap items-center justify-center gap-1 sm:gap-1.5"
    >
      <ViewButton onClick={onView} />
      <EditButton onClick={onEdit} />
    </div>
  )
}
