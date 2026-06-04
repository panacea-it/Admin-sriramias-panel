import { useLocation, useNavigate } from 'react-router-dom'
import { VERIFICATION_CENTER_SECTIONS } from '../../../constants/paymentCommunicationConstants'
import { cn } from '../../../utils/cn'

export default function VerificationCenterNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const active = location.pathname.includes('/communication') ? 'communication' : 'verification'

  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200" role="tablist" aria-label="Verification center sections">
      {VERIFICATION_CENTER_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          role="tab"
          aria-selected={active === section.id}
          onClick={() => navigate(`/finance/${section.path}`)}
          className={cn(
            'relative px-4 py-2.5 text-sm font-semibold transition',
            active === section.id ? 'text-[#246392]' : 'text-[#686868] hover:text-[#222]',
          )}
        >
          {section.label}
          {active === section.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#246392]" />}
        </button>
      ))}
    </div>
  )
}
