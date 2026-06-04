/** Finance analytics — center visibility by role */

export function resolveFinanceScope(req) {
  const role = req.headers['x-user-role'] || req.query.role || 'super_admin'
  const centerId = req.headers['x-center-id'] || req.query.centerId
  const centerIds = req.query.centerIds
    ? String(req.query.centerIds).split(',').filter(Boolean)
    : centerId
      ? [centerId]
      : []

  if (role === 'center_admin') {
    return {
      scope: 'center',
      centerIds: centerIds.length ? centerIds : centerId ? [centerId] : [],
      restricted: true,
    }
  }

  if (role === 'counseling_admin') {
    return { scope: 'none', centerIds: [], restricted: true, denied: true }
  }

  if (req.query.scope === 'overall' || (!centerIds.length && !req.query.centerIds)) {
    return { scope: 'overall', centerIds: [], restricted: false }
  }

  if (req.query.scope === 'compare' && centerIds.length) {
    return { scope: 'compare', centerIds, restricted: false }
  }

  return {
    scope: centerIds.length ? 'center' : 'overall',
    centerIds,
    restricted: false,
  }
}

export function financeRbac(req, res, next) {
  req.financeScope = resolveFinanceScope(req)
  if (req.financeScope.denied) {
    return res.status(403).json({ success: false, message: 'Finance analytics not permitted for this role' })
  }
  next()
}
