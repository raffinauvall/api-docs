import { Router } from 'express'
import { requireAuth } from '../auth/middleware.js'
import { asyncHandler, badRequest } from '../middleware/error.js'

export const proxyRouter = Router()
proxyRouter.use(requireAuth)

proxyRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const method = String(req.body?.method || 'GET').toUpperCase()
    const headers = req.body?.headers && typeof req.body.headers === 'object' ? req.body.headers : {}
    const body = req.body?.body
    let url

    try {
      url = new URL(req.body?.url)
    } catch {
      return badRequest(res, 'URL tidak valid')
    }
    if (!['http:', 'https:'].includes(url.protocol)) return badRequest(res, 'URL harus http/https')

    const started = Date.now()
    const upstream = await fetch(url, {
      method,
      headers,
      body: ['GET', 'HEAD'].includes(method) ? undefined : body,
      signal: AbortSignal.timeout(30000)
    })
    const text = await upstream.text()
    let data = text
    try { data = JSON.parse(text) } catch {}

    res.json({
      status: upstream.status,
      ok: upstream.ok,
      duration: Date.now() - started,
      headers: Object.fromEntries(upstream.headers.entries()),
      data
    })
  })
)
