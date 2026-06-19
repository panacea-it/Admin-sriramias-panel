import ViewButton from '../../common/ViewButton'
import { TABLE_ACTIONS_WRAP } from '../../../utils/tableColumnHelpers'

export default function CbtTopicsTableActions({ row, onView }) {
  return (
    <div className={TABLE_ACTIONS_WRAP}>
      <ViewButton onClick={onView} />
    </div>
  )
}
