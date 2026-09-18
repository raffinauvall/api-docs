import { Router } from 'express'
import { requireAuth } from '../auth/middleware.js'
import { asyncHandler, notFound } from '../middleware/error.js'
import * as versions from '../repos/versions.js'

export const versionsRouter = Router()
versionsRouter.use(requireAuth)

// GET /api/versions/:id — detail versi
versionsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const version = await versions.getVersionById(req.params.id)
    if (!version) return notFound(res, 'Versi tidak ditemukan')
    res.json({ version })
  })
)

// GET /api/versions/:id/endpoints
versionsRouter.get(
  '/:id/endpoints',
  asyncHandler(async (req, res) => {
    const version = await versions.getVersionById(req.params.id)
    if (!version) return notFound(res, 'Versi tidak ditemukan')
    res.json({ endpoints: await versions.listEndpointsByVersion(req.params.id) })
  })
)

// GET /api/versions/:id/document — original OpenAPI document (source of truth)
versionsRouter.get(
  '/:id/document',
  asyncHandler(async (req, res) => {
    const version = await versions.getVersionById(req.params.id)
    if (!version) return notFound(res, 'Versi tidak ditemukan')

    const doc = await versions.getDocumentByVersion(req.params.id)
    if (!doc) return notFound(res, 'Dokumen tidak ditemukan')

    const contentType = doc.format === 'json' ? 'application/json' : 'application/yaml'
    res.setHeader('content-type', `${contentType}; charset=utf-8`)
    res.send(doc.content)
  })
)

// PATCH /api/versions/:id — aktivasi (rollback)
versionsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const version = await versions.getVersionById(req.params.id)
    if (!version) return notFound(res, 'Versi tidak ditemukan')

    if (req.body?.is_active === true) {
      const activated = await versions.activateVersion(version.api_id, version.id)
      res.json({ version: activated })
    } else {
      res.json({ version })
    }
  })
)
