// Guard session-based (pola SMG-EMPmvp)
export function requireAuth(req, res, next) {
  if (req.session?.user) return next()
  return res.status(401).json({ error: 'Unauthorized' })
}

export function adminOnly(req, res, next) {
  const role = req.session?.user?.role
  if (['admin', 'superadmin'].includes(role)) return next()
  return res.status(403).json({ error: 'Forbidden' })
}
