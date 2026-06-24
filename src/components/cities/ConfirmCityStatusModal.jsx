import ConfirmStatusChangeModal from '../common/ConfirmStatusChangeModal'

export default function ConfirmCityStatusModal({ activating, enabling, ...props }) {
  return (
    <ConfirmStatusChangeModal
      {...props}
      activating={activating ?? enabling}
    />
  )
}
