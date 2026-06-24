import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'

export default function PermissionDeniedPage() {
  const { defaultRoute, roleLabel } = usePermissions()

  return (
    <div className="figma-admin-section flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2fc] text-[#03045e]">
          <ShieldOff className="h-7 w-7" strokeWidth={2} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-[#111111]">Access restricted</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#686868]">
          Your account ({roleLabel}) does not have permission to view this page. Contact a Super
          Admin if you need access.
        </p>
        <Link
          to={defaultRoute}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-6 text-sm font-bold text-white shadow-[0_5px_13px_rgba(36,99,146,0.35)] transition hover:opacity-95"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
