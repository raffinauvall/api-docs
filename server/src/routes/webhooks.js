import crypto from 'node:crypto'
import { Router } from 'express'
import { config } from '../config.js'
import { asyncHandler } from '../middleware/error.js'
import * as sources from '../repos/sources.js'
import { syncApiSource } from '../services/sync.js'

// listSourcesByRepository dipakai di bawah
const listSourcesByRepository = sources.listSourcesByRepository

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
    if (event !== 'push') {
      return res.status(200).json({ ok: true, ignored: true, reason: `event=${event}` })
    }

    const delivery = req.headers['x-github-delivery']
    const payload = req.body

    // Temukan repository yang terdaftar
    const repository = payload?.repository?.full_name
    if (!repository) return res.status(200).json({ ok: true, ignored: true, reason: 'no-repo' })

    const ref = payload?.ref || ''
    const branch = ref.replace(/^refs\/heads\//, '')

    // Cek apakah file OpenAPI berubah (optimisasi: jangan sync kalau tidak berubah)
    const changedFiles = (payload?.commits || []).flatMap((c) => [
      ...(c.added || []),
      ...(c.modified || []),
      ...(c.removed || [])
    ])

    // Temukan source yang cocok dengan repo + branch
    const allSources = await listSourcesByRepository(repository, branch)
    for (const source of allSources) {
      const fileChanged = changedFiles.some((f) => f === source.file_path)
      if (!fileChanged && changedFiles.length > 0) continue // openapi file tidak berubah

      // Fire-and-forget sync job (webhook langsung return 200).
      // Gunakan detach agar tidak memblokir response webhook.
      syncApiSource(source.id, { force: true }).catch((err) => {
        console.error(`[sync] gagal untuk source ${source.id}:`, err.message)
      })
    }

    res.status(200).json({ ok: true, delivery })
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
