import { query } from '../db.js'

export async function createVersion(client, { apiId, version, commitSha }) {
  // Deactivate semua versi aktif untuk API ini
  await client.query(
    'UPDATE api_versions SET is_active = false, updated_at = now() WHERE api_id = $1 AND is_active = true',
    [apiId]
  )
  const res = await client.query(
    `INSERT INTO api_versions (api_id, version, commit_sha, is_active)
     VALUES ($1, $2, $3, true) RETURNING *`,
    [apiId, version, commitSha || null]
  )
  return res.rows[0]
}

export async function saveDocument(client, { versionId, sourceId, content, format, checksum, commitSha }) {
  const res = await client.query(
    `INSERT INTO openapi_documents (api_version_id, api_source_id, content, format, checksum, commit_sha)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, api_version_id, api_source_id, format, checksum, commit_sha, created_at`,
    [versionId, sourceId || null, content, format, checksum, commitSha || null]
  )
  return res.rows[0]
}

export async function createEndpoints(client, versionId, endpoints) {
  const rows = []
  for (const ep of endpoints) {
    const res = await client.query(
      `INSERT INTO endpoints
        (api_version_id, path, method, operation_id, summary, description,
         deprecated, tags, parameters, request_body, responses, security)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        versionId,
        ep.path,
        ep.method,
        ep.operation_id,
        ep.summary,
        ep.description,
        ep.deprecated,
        JSON.stringify(ep.tags || []),
        JSON.stringify(ep.parameters || []),
        ep.request_body ? JSON.stringify(ep.request_body) : null,
        JSON.stringify(ep.responses || {}),
        JSON.stringify(ep.security || [])
      ]
    )
    rows.push(res.rows[0])
  }
  return rows
}

export async function listVersionsByApi(apiId) {
  return (
    await query(
      `SELECT v.id, v.api_id, v.version, v.commit_sha, v.is_active, v.created_at, v.updated_at,
              (SELECT count(*) FROM endpoints e WHERE e.api_version_id = v.id) AS endpoint_count,
              (SELECT d.id FROM openapi_documents d WHERE d.api_version_id = v.id LIMIT 1) AS document_id
       FROM api_versions v
       WHERE v.api_id = $1
       ORDER BY v.created_at DESC`,
      [apiId]
    )
  ).rows
}

export async function getVersionById(id) {
  return (
    await query(
      `SELECT v.*, a.name AS api_name, a.id AS api_id
       FROM api_versions v
       JOIN apis a ON a.id = v.api_id
       WHERE v.id = $1`,
      [id]
    )
  ).rows[0]
}

export async function getDocumentByVersion(versionId) {
  return (
    await query(
      'SELECT * FROM openapi_documents WHERE api_version_id = $1 ORDER BY created_at DESC LIMIT 1',
      [versionId]
    )
  ).rows[0]
}

export async function activateVersion(apiId, versionId) {
  await query(
    'UPDATE api_versions SET is_active = false, updated_at = now() WHERE api_id = $1 AND is_active = true',
    [apiId]
  )
  return (
    await query(
      'UPDATE api_versions SET is_active = true, updated_at = now() WHERE id = $1 RETURNING *',
      [versionId]
    )
  ).rows[0]
}

export async function listEndpointsByVersion(versionId) {
  return (
    await query(
      'SELECT * FROM endpoints WHERE api_version_id = $1 ORDER BY path, method',
      [versionId]
    )
  ).rows
}

export async function getEndpointById(id) {
  return (
    await query(
      `SELECT e.*, v.api_id, a.name AS api_name, a.base_url AS api_base_url
       FROM endpoints e
       JOIN api_versions v ON v.id = e.api_version_id
       JOIN apis a ON a.id = v.api_id
       WHERE e.id = $1`,
      [id]
    )
  ).rows[0]
}
