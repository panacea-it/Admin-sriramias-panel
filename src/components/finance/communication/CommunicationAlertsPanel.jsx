import PaymentAttemptAlertsPanel from '../payment-attempts/PaymentAttemptAlertsPanel'

export default function CommunicationAlertsPanel({ alerts = [], onMarkRead, onSelectAlert }) {
  return (
    <PaymentAttemptAlertsPanel alerts={alerts} onMarkRead={onMarkRead} onSelectAlert={onSelectAlert} />
  )
}
