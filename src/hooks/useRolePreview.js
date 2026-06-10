import { useEffect, useState } from 'react'
import { getRoleById, unwrapRoleResponse } from '../services/roleService'
import { mapApiRoleToPreview } from '../utils/adminRoleMappers'

export function useRolePreview(roleId, fallbackLabel = '') {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = String(roleId || '').trim()
    if (!id) {
      setPreview(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getRoleById(id)
      .then((data) => {
        if (cancelled) return
        setPreview(mapApiRoleToPreview(unwrapRoleResponse(data), fallbackLabel))
      })
      .catch(() => {
        if (cancelled) return
        setPreview(
          mapApiRoleToPreview(null, fallbackLabel) || {
            id,
            label: fallbackLabel || 'Selected role',
            description: '',
            securityLevel: 'medium',
            modules: [],
            permissionCount: 0,
          },
        )
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [roleId, fallbackLabel])

  return { preview, loading }
}
