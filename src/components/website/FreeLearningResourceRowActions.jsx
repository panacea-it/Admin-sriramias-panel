import EditButton from '../common/EditButton'
import ViewButton from '../common/ViewButton'
import { TABLE_ACTIONS_WRAP } from '../../utils/tableColumnHelpers'

export default function FreeLearningResourceRowActions({ onView, onEdit }) {
  return (
    <div className={TABLE_ACTIONS_WRAP}>
      <ViewButton onClick={onView} />
      <EditButton onClick={onEdit} />
    </div>
  )
}
