import { usePermissions } from '../../hooks/usePermissions'

/**
 * Renders children only when the signed-in role is allowed.
 * @param {string[]} roles - canonical role ids from constants/roles
 */
export default function PermissionGate({ roles, children, fallback = null }) {
  const { hasRole } = usePermissions()
  if (!roles?.length || !hasRole(...roles)) return fallback
  return children
}
