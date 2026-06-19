import ConfirmStatusChangeModal from '../common/ConfirmStatusChangeModal'

export default function ConfirmCityStatusModal(props) {
  return (
    <ConfirmStatusChangeModal
      open={props.open}
      activating={props.enabling}
      loading={props.loading}
      onCancel={props.onCancel}
      onConfirm={props.onConfirm}
    />
  )
}
