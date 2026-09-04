import { Router } from 'express'
import { requireAuth } from '../auth/middleware.js'
import { asyncHandler, notFound, badRequest } from '../middleware/error.js'
import { withTransaction } from '../db.js'
import * as apis from '../repos/apis.js'
import * as versions from '../repos/versions.js'
import * as sources from '../repos/sources.js'
import * as groups from '../repos/groups.js'
import { getProvider } from '../services/git-provider.js'
import { loadOpenApiSnapshot, saveOpenApiSnapshot, syncApiSource } from '../services/sync.js'

export const apisRouter = Router()
apisRouter.use(requireAuth)

apisRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ apis: await apis.listApis() })
  })
)

apisRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const api = await apis.getApiById(req.params.id)
    if (!api) return notFound(res, 'API tidak ditemukan')
    res.json({ api })
  })
)

apisRouter.get(
  '/:id/versions',
  asyncHandler(async (req, res) => {
    const api = await apis.getApiById(req.params.id)
    if (!api) return notFound(res, 'API tidak ditemukan')
    res.json({ versions: await versions.listVersionsByApi(req.params.id) })
  })
)

apisRouter.get(
  '/:id/source',
  asyncHandler(async (req, res) => {
    const api = await apis.getApiById(req.params.id)
    if (!api) return notFound(res, 'API tidak ditemukan')
    const source = await sources.getSourceByApi(req.params.id)
    res.json({ source: source || null })
  })
)

apisRouter.get(
  '/:id/branches',
  asyncHandler(async (req, res) => {
    const source = await sources.getSourceByApi(req.params.id)
    if (!source) return notFound(res, 'Source tidak ditemukan')
    res.json({ branches: await getProvider(source.provider).listBranches(source.repository) })
  })
)

apisRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const api = await apis.getApiById(req.params.id)
    if (!api) return notFound(res, 'API tidak ditemukan')

    if (api.created_by && api.created_by !== req.session.user.id) {
      return res.status(403).json({ error: 'Bukan pemilik API' })
    }

    const fields = {}
    if (req.body?.name !== undefined) fields.name = String(req.body.name).trim()
    if (req.body?.description !== undefined) fields.description = req.body.description
    if (req.body?.group_id !== undefined) {
      const g = await groups.getGroupById(req.body.group_id)
      if (!g) return badRequest(res, 'Group tidak ditemukan')
      fields.group_id = req.body.group_id
    }
    if (Object.keys(fields).length === 0) return badRequest(res, 'Tidak ada field yang diubah')

    const updated = await apis.updateApi(req.params.id, fields)
    res.json({ api: updated })
  })
)

apisRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const api = await apis.getApiById(req.params.id)
    if (!api) return notFound(res, 'API tidak ditemukan')

    if (api.created_by && api.created_by !== req.session.user.id) {
      return res.status(403).json({ error: 'Bukan pemilik API' })
    }

    await apis.deleteApi(req.params.id)
    res.json({ ok: true })
  })
)

// POST /api/apis/register — register repository Git (bukan upload)
// Body JSON: { name, description, group_id, provider, repository, branch, file_path }
apisRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = (req.body?.name || '').trim()
    const groupId = (req.body?.group_id || '').trim()
    const provider = (req.body?.provider || 'github').toLowerCase()
    const repository = (req.body?.repository || '').trim()
    const branch = (req.body?.branch || 'main').trim()
    const filePath = (req.body?.file_path || '').trim()
    const description = req.body?.description || ''

    if (!name) return badRequest(res, 'name wajib diisi')
    if (!groupId) return badRequest(res, 'group_id wajib diisi')
    if (!repository || !repository.includes('/')) return badRequest(res, 'repository harus format owner/repo')
    if (!filePath) return badRequest(res, 'file_path wajib diisi')

    const group = await groups.getGroupById(groupId)
    if (!group) return badRequest(res, 'Group tidak ditemukan')

    // Validasi source duplicate
    const existing = await sources.findSourceByRepo({ provider, repository, branch, filePath })
    if (existing) {
      return res.status(409).json({ error: 'Repository + path ini sudah terdaftar', source: existing })
    }

    const slug = String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    let snapshot
    try {
      snapshot = await loadOpenApiSnapshot({ provider, repository, branch, file_path: filePath })
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message })
    }

    // Buat API + source + snapshot dalam transaksi (atomic).
    const result = await withTransaction(async (client) => {
      const api = await apis.createApi(client, {
        groupId,
        name,
        slug,
        description,
        baseUrl: snapshot.meta.baseUrl,
        createdBy: req.session.user.id
      })
      const source = await sources.createSource(client, {
        apiId: api.id,
        provider,
        repository,
        branch,
        filePath
      })
      const sync = await saveOpenApiSnapshot(client, source, snapshot)
      const syncedSource = await sources.updateSourceForClient(client, source.id, {
        last_synced_at: new Date(),
        last_commit_sha: snapshot.commitSha,
        last_sync_status: 'SYNCED',
        last_sync_error: null
      })
      return { api, source: syncedSource, sync }
    })

    res.status(201).json({
      api: result.api,
      source: result.source,
      sync: {
        skipped: false,
        commitSha: snapshot.commitSha,
        checksum: snapshot.checksum,
        version: result.sync.version,
        endpointCount: result.sync.endpoints.length
      }
    })
  })
)

// POST /api/apis/:id/sync — manual sync
apisRouter.post(
  '/:id/sync',
  asyncHandler(async (req, res) => {
    const api = await apis.getApiById(req.params.id)
    if (!api) return notFound(res, 'API tidak ditemukan')

    const source = await sources.getSourceByApi(req.params.id)
    if (!source) return notFound(res, 'Source tidak ditemukan')

    try {
      const result = await syncApiSource(source.id, { force: true })
      res.json({ ok: true, sync: result })
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message })
    }
  })
)

// PATCH /api/apis/:id/source — update konfigurasi source
apisRouter.patch(
  '/:id/source',
  asyncHandler(async (req, res) => {
    const api = await apis.getApiById(req.params.id)
    if (!api) return notFound(res, 'API tidak ditemukan')

    const source = await sources.getSourceByApi(req.params.id)
    if (!source) return notFound(res, 'Source tidak ditemukan')

    const fields = {}
    if (req.body?.repository !== undefined) fields.repository = String(req.body.repository).trim()
    if (req.body?.branch !== undefined) fields.branch = String(req.body.branch).trim()
    if (req.body?.file_path !== undefined) fields.file_path = String(req.body.file_path).trim()
    if (req.body?.sync_enabled !== undefined) fields.sync_enabled = !!req.body.sync_enabled
    if (Object.keys(fields).length === 0) return badRequest(res, 'Tidak ada field yang diubah')

    const updated = await sources.updateSource(source.id, fields)
    res.json({ source: updated })
  })
)
