import ViewButton from '../common/ViewButton'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../utils/tableColumnHelpers'

export default function OrderRowActions({ orderId, onView }) {
  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <ViewButton
        onClick={onView}
        label={`View details for order ${orderId}`}
      />
    </div>
  )
}
