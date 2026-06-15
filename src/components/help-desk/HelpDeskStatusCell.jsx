import HelpDeskStatusBadge from './HelpDeskStatusBadge'

export default function HelpDeskStatusCell({ status }) {
  return (
    <div className="flex w-full items-center justify-center">
      <HelpDeskStatusBadge status={status} />
    </div>
  )
}
