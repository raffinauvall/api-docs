import { Router } from 'express'
import { requireAuth } from '../auth/middleware.js'
import { asyncHandler, notFound, badRequest } from '../middleware/error.js'
import * as groups from '../repos/groups.js'

export const groupsRouter = Router()
groupsRouter.use(requireAuth)

groupsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ groups: await groups.listGroups() })
  })
)

groupsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = (req.body?.name || '').trim()
    if (!name) return badRequest(res, 'name wajib diisi')

    const slug = groups.toSlug(req.body?.slug || name)
    if (!slug) return badRequest(res, 'slug tidak valid')

    const group = await groups.createGroup({
      name,
      slug,
      description: req.body?.description,
      createdBy: req.session.user.id
    })
    res.status(201).json({ group })
  })
)

groupsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const group = await groups.getGroupById(req.params.id)
    if (!group) return notFound(res, 'Group tidak ditemukan')
    res.json({ group })
  })
)

groupsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const group = await groups.getGroupById(req.params.id)
    if (!group) return notFound(res, 'Group tidak ditemukan')

    if (group.created_by && group.created_by !== req.session.user.id) {
      return res.status(403).json({ error: 'Bukan pemilik group' })
    }

    const fields = {}
    if (req.body?.name !== undefined) fields.name = String(req.body.name).trim()
    if (req.body?.description !== undefined) fields.description = req.body.description
    if (req.body?.slug !== undefined) {
      fields.slug = groups.toSlug(req.body.slug)
      if (!fields.slug) return badRequest(res, 'slug tidak valid')
    }
    if (Object.keys(fields).length === 0) return badRequest(res, 'Tidak ada field yang diubah')

    const updated = await groups.updateGroup(req.params.id, fields)
    res.json({ group: updated })
  })
)

groupsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const group = await groups.getGroupById(req.params.id)
    if (!group) return notFound(res, 'Group tidak ditemukan')

    if (group.created_by && group.created_by !== req.session.user.id) {
      return res.status(403).json({ error: 'Bukan pemilik group' })
    }

    await groups.deleteGroup(req.params.id)
    res.json({ ok: true })
  })
)
