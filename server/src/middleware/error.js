export function notFound(res, msg = 'Resource tidak ditemukan') {
  return res.status(404).json({ error: msg })
}

export function badRequest(res, msg) {
  return res.status(400).json({ error: msg })
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

// Error handler global
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500
  if (status >= 500) {
    console.error(err)
  }
  res.status(status).json({
    error: err.message || 'Internal server error'
  })
}
