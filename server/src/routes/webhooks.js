import crypto from 'node:crypto'
import { Router } from 'express'
import { config } from '../config.js'
import { withTransaction } from '../db.js'
import { asyncHandler } from '../middleware/error.js'
import * as sources from '../repos/sources.js'
import * as groups from '../repos/groups.js'
import * as apis from '../repos/apis.js'
import { getProvider } from '../services/git-provider.js'
import { loadOpenApiSnapshot, saveOpenApiSnapshot, syncApiSource } from '../services/sync.js'

// listSourcesByRepository dipakai di bawah
const listSourcesByRepository = sources.listSourcesByRepository

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const isOpenApiFile = (filePath) => /(^|\/)(openapi|swagger)\.(?:ya?ml|json)$/i.test(filePath)

async function buildUnregisteredSource({ repository, branch, filePath }) {
  const sourceInput = { provider: 'github', repository, branch, file_path: filePath }
  const snapshot = await loadOpenApiSnapshot(sourceInput)
  const name = snapshot.meta.name
  const slug = slugify(name)
  if (!slug) throw new Error(`Judul OpenAPI tidak valid untuk group: ${name}`)

  return withTransaction(async (client) => {
    const group = await groups.createGroupForClient(client, { name, slug })
    const api = await apis.createApi(client, {
      groupId: group.id,
      name,
      slug,
      description: snapshot.meta.description,
      baseUrl: snapshot.meta.baseUrl,
      createdBy: null
    })
    const source = await sources.createSource(client, { apiId: api.id, provider: 'github', repository, branch, filePath })
    const sync = await saveOpenApiSnapshot(client, source, snapshot)
    const syncedSource = await sources.updateSourceForClient(client, source.id, {
      last_synced_at: new Date(),
      last_commit_sha: snapshot.commitSha,
      last_sync_status: 'SYNCED',
      last_sync_error: null
    })
    return { api, source: syncedSource, sync }
  })
}

export const webhookRouter = Router()

// Verifikasi signature GitHub (HMAC-SHA256 dari payload mentah).
function verifyGithubSignature(req) {
  const secret = config.github.webhookSecret
  if (!secret) return false // webhook tanpa secret tidak diterima di prod

  const sig = req.headers['x-hub-signature-256']
  if (!sig) return false

  const computed = 'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computed))
  } catch {
    return false
  }
}

// POST /webhooks/github
webhookRouter.post(
  '/github',
  expressRawBody,
  asyncHandler(async (req, res) => {
    if (!verifyGithubSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const event = req.headers['x-github-event']
    const delivery = req.headers['x-github-delivery']
    const payload = req.body

    // Temukan repository yang terdaftar
    const repository = payload?.repository?.full_name
    if (!repository) return res.status(200).json({ ok: true, ignored: true, reason: 'no-repo' })

    const ref = payload?.ref || ''
    const branch = event === 'ping'
      ? payload?.repository?.default_branch || 'main'
      : ref.replace(/^refs\/heads\//, '')

    if (!['push', 'ping'].includes(event)) {
      return res.status(200).json({ ok: true, ignored: true, reason: `event=${event}` })
    }

    // Cek apakah file OpenAPI berubah (optimisasi: jangan sync kalau tidak berubah)
    const changedFiles = event === 'ping'
      ? await getProvider('github').listFiles(repository, branch).then((files) => files.filter(isOpenApiFile))
      : (payload?.commits || []).flatMap((c) => [
          ...(c.added || []),
          ...(c.modified || []),
          ...(c.removed || [])
        ])

    // Temukan source yang cocok dengan repo + branch
    const allSources = await listSourcesByRepository(repository, branch)
    const registeredPaths = new Set(allSources.map((source) => source.file_path))
    for (const source of allSources) {
      const fileChanged = changedFiles.some((f) => f === source.file_path)
      if (!fileChanged && changedFiles.length > 0) continue // openapi file tidak berubah

      // Fire-and-forget sync job (webhook langsung return 200).
      // Gunakan detach agar tidak memblokir response webhook.
      syncApiSource(source.id, { force: true }).catch((err) => {
        console.error(`[sync] gagal untuk source ${source.id}:`, err.message)
      })
    }

    // Auto-build OpenAPI baru berdasarkan info.title.
    const candidates = changedFiles.filter((filePath) =>
      (event === 'ping' ? isOpenApiFile(filePath) : /\.(?:ya?ml|json)$/i.test(filePath)) && !registeredPaths.has(filePath)
    )
    const autoBuilds = await Promise.allSettled(
      candidates.map((filePath) => buildUnregisteredSource({ repository, branch, filePath }))
    )
    const failures = autoBuilds
      .map((result, index) => result.status === 'rejected' && `${candidates[index]}: ${result.reason.message}`)
      .filter(Boolean)
    if (failures.length) return res.status(500).json({ ok: false, delivery, errors: failures })

    res.status(200).json({ ok: true, delivery, changedFiles, autoBuilt: candidates })
  })
)

// Middleware: tangkap raw body untuk verifikasi signature.
function expressRawBody(req, res, next) {
  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks)
    try {
      req.body = JSON.parse(req.rawBody.toString('utf8') || '{}')
    } catch {
      req.body = {}
    }
    next()
  })
}
