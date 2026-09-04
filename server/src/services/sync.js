import { getProvider } from './git-provider.js'
import { parseOpenApiText, validateOpenApi, extractApiMeta, extractEndpoints, checksum } from './parser.js'
import { withTransaction } from '../db.js'
import * as sources from '../repos/sources.js'
import * as versions from '../repos/versions.js'
import * as apis from '../repos/apis.js'

// Sinkronisasi satu API source dari repository Git.
// Dipakai oleh webhook, manual sync, dan initial sync (satu logic).
export async function syncApiSource(sourceId, { force = false } = {}) {
  const source = await sources.getSourceById(sourceId)
  if (!source) throw Object.assign(new Error('Source tidak ditemukan'), { status: 404 })
  if (!source.sync_enabled) throw Object.assign(new Error('Sync dinonaktifkan'), { status: 409 })

  const provider = getProvider(source.provider)
  const commitSha = await provider.getLatestCommit(source.repository, source.branch)

  // Idempotency: jika commit sama dan sudah pernah sukses, skip.
  if (!force && commitSha && commitSha === source.last_commit_sha && source.last_sync_status === 'SYNCED') {
    return { skipped: true, reason: 'no-change', commitSha }
  }

  // Tandai sedang sync
  await sources.updateSource(sourceId, { last_sync_status: 'SYNCING' })

  try {
    const { content } = await provider.getFile(source.repository, source.file_path, source.branch)
    const { doc, format } = parseOpenApiText(content)
    await validateOpenApi(doc)
    const meta = extractApiMeta(doc)
    const endpoints = extractEndpoints(doc)
    const contentChecksum = checksum(content)

    const result = await withTransaction(async (client) => {
      // Ambil API terkait (sudah ada karena source dibuat saat registrasi)
      const api = await apis.getApiByIdForClient(client, source.api_id)

      // Buat versi baru (append-only) & aktifkan
      const version = await versions.createVersion(client, {
        apiId: source.api_id,
        version: meta.version,
        commitSha
      })

      // Simpan snapshot dokumen asli (source of truth)
      const docRow = await versions.saveDocument(client, {
        versionId: version.id,
        sourceId: source.id,
        content,
        format,
        checksum: contentChecksum,
        commitSha
      })

      // Extract endpoints
      const endpointRows = await versions.createEndpoints(client, version.id, endpoints)

      return { api, version, document: docRow, endpoints: endpointRows }
    })

    await sources.updateSource(sourceId, {
      last_synced_at: new Date(),
      last_commit_sha: commitSha,
      last_sync_status: 'SYNCED',
      last_sync_error: null
    })

    return {
      skipped: false,
      commitSha,
      checksum: contentChecksum,
      version: result.version,
      endpointCount: result.endpoints.length
    }
  } catch (err) {
    // JANGAN rusak dokumentasi aktif — hanya catat kegagalan.
    await sources.updateSource(sourceId, {
      last_sync_status: 'FAILED',
      last_sync_error: err.message
    }).catch(() => {})
    throw err
  }
}
