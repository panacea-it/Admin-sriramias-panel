import CbtTableActionButton from './ui/CbtTableActionButton'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../../utils/tableColumnHelpers'

export default function CbtTestsTableActions({ onView }) {
  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <CbtTableActionButton label="View" onClick={onView} />
    </div>
  )
}
