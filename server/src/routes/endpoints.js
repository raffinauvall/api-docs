import { Router } from 'express'
import { requireAuth } from '../auth/middleware.js'
import { asyncHandler, notFound } from '../middleware/error.js'
import * as versions from '../repos/versions.js'

export const endpointsRouter = Router()
endpointsRouter.use(requireAuth)

// GET /api/endpoints/:id
endpointsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const endpoint = await versions.getEndpointById(req.params.id)
    if (!endpoint) return notFound(res, 'Endpoint tidak ditemukan')
    res.json({ endpoint })
  })
)
