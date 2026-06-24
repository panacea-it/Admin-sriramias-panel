import ViewButton from '../common/ViewButton'
import EditButton from '../common/EditButton'

export default function CouponTableActions({
  row,
  onView,
  onEdit,
  onStatusToggle: _onStatusToggle,
  onDelete: _onDelete,
  disabled = false,
}) {
  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      <ViewButton onClick={onView} disabled={disabled} />
      <EditButton onClick={onEdit} disabled={disabled} />
    </div>
  )
}
