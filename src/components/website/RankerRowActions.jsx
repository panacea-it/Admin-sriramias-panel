import EditButton from '../common/EditButton'
import ViewButton from '../common/ViewButton'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'

export default function RankerRowActions({
  rowName = 'ranker',
  onView,
  onEdit,
}) {
  return (
    <div
      role="group"
      aria-label={`Actions for ${rowName}`}
      className={TABLE_ACTIONS_WRAP}
    >
      <ViewButton onClick={onView} label={`View ${rowName}`} />
      <EditButton onClick={onEdit} label={`Edit ${rowName}`} />
    </div>
  )
}
