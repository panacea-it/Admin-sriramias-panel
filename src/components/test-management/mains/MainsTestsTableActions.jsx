import ViewButton from '../../common/ViewButton'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../../utils/tableColumnHelpers'

export default function MainsTestsTableActions({ row, onView }) {
  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <ViewButton onClick={onView} label="View Results" />
    </div>
  )
}
