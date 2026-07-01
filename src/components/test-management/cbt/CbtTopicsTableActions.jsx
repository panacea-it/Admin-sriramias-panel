import CbtPrimaryActionButton from './ui/CbtPrimaryActionButton'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../../utils/tableColumnHelpers'

export default function CbtTopicsTableActions({ onView }) {
  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <CbtPrimaryActionButton onClick={onView} label="View Topics" />
    </div>
  )
}
