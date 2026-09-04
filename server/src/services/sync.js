import { getProvider } from './git-provider.js'
import { parseOpenApiText, validateOpenApi, extractApiMeta, extractEndpoints, checksum } from './parser.js'
import { withTransaction } from '../db.js'
import * as sources from '../repos/sources.js'
import * as versions from '../repos/versions.js'
import * as apis from '../repos/apis.js'

export async function loadOpenApiSnapshot(source) {
  const provider = getProvider(source.provider)
  const commitSha = source.commitSha || await provider.getLatestCommit(source.repository, source.branch)
  const { content } = await provider.getFile(source.repository, source.file_path, source.branch)
  const { doc, format } = parseOpenApiText(content)
  await validateOpenApi(doc)

  return {
    content,
    format,
    commitSha,
    meta: extractApiMeta(doc),
    endpoints: extractEndpoints(doc),
    checksum: checksum(content)
  }
}

export async function saveOpenApiSnapshot(client, source, snapshot) {
  const api = await apis.updateApiForClient(client, source.api_id, {
    base_url: snapshot.meta.baseUrl || null
  })
  const version = await versions.createVersion(client, {
    apiId: source.api_id,
    version: snapshot.meta.version,
    commitSha: snapshot.commitSha
  })
  const document = await versions.saveDocument(client, {
    versionId: version.id,
    sourceId: source.id,
    content: snapshot.content,
    format: snapshot.format,
    checksum: snapshot.checksum,
    commitSha: snapshot.commitSha
  })
  const endpointRows = await versions.createEndpoints(client, version.id, snapshot.endpoints)
  return { api, version, document, endpoints: endpointRows }
}

// Sinkronisasi satu API source dari repository Git.
// Dipakai oleh webhook, manual sync, dan initial sync (satu logic).
export async function syncApiSource(sourceId, { force = false } = {}) {
  const source = await sources.getSourceById(sourceId)
  if (!source) throw Object.assign(new Error('Source tidak ditemukan'), { status: 404 })
  if (!source.sync_enabled) throw Object.assign(new Error('Sync dinonaktifkan'), { status: 409 })

  let commitSha
  try {
    commitSha = await getProvider(source.provider).getLatestCommit(source.repository, source.branch)
  } catch (err) {
    await sources.updateSource(sourceId, {
      last_sync_status: 'FAILED',
      last_sync_error: err.message
    }).catch(() => {})
    throw err
  }

  // Idempotency: jika commit sama dan sudah pernah sukses, skip.
  if (!force && commitSha && commitSha === source.last_commit_sha && source.last_sync_status === 'SYNCED') {
    return { skipped: true, reason: 'no-change', commitSha }
  }

  // Tandai sedang sync
  await sources.updateSource(sourceId, { last_sync_status: 'SYNCING' })

  try {
    const snapshot = await loadOpenApiSnapshot({ ...source, commitSha })
    const result = await withTransaction(async (client) => {
      return saveOpenApiSnapshot(client, source, snapshot)
    })

    await sources.updateSource(sourceId, {
      last_synced_at: new Date(),
      last_commit_sha: snapshot.commitSha,
      last_sync_status: 'SYNCED',
      last_sync_error: null
    })

    return {
      skipped: false,
      commitSha: snapshot.commitSha,
      checksum: snapshot.checksum,
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
