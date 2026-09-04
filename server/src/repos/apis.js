import { query } from '../db.js'

export async function listApis() {
  return (
    await query(
      `SELECT a.id, a.group_id, a.name, a.slug, a.description, a.created_by,
              a.created_at, a.updated_at,
              g.name AS group_name,
              s.id AS source_id,
              s.provider, s.repository, s.branch, s.file_path,
              s.last_synced_at, s.last_commit_sha, s.last_sync_status, s.last_sync_error,
              (SELECT v.version FROM api_versions v
                WHERE v.api_id = a.id AND v.is_active = true
                ORDER BY v.created_at DESC LIMIT 1) AS active_version,
              (SELECT v.id FROM api_versions v
                WHERE v.api_id = a.id AND v.is_active = true
                ORDER BY v.created_at DESC LIMIT 1) AS active_version_id,
              (SELECT count(*) FROM api_versions v WHERE v.api_id = a.id) AS version_count,
              (SELECT count(*) FROM endpoints e
                JOIN api_versions v ON v.id = e.api_version_id
                WHERE v.api_id = a.id AND v.is_active = true) AS endpoint_count
       FROM apis a
       LEFT JOIN api_groups g ON g.id = a.group_id
       LEFT JOIN api_sources s ON s.api_id = a.id
       ORDER BY a.name`
    )
  ).rows
}

export async function getApiById(id) {
  return (
    await query(
      `SELECT a.*, g.name AS group_name, s.id AS source_id
       FROM apis a
       LEFT JOIN api_groups g ON g.id = a.group_id
       LEFT JOIN api_sources s ON s.api_id = a.id
       WHERE a.id = $1`,
      [id]
    )
  ).rows[0]
}

export async function getApiByIdForClient(client, id) {
  const res = await client.query('SELECT * FROM apis WHERE id = $1', [id])
  return res.rows[0]
}

export async function createApi(client, { groupId, name, slug, description, createdBy }) {
  const res = await client.query(
    `INSERT INTO apis (group_id, name, slug, description, created_by)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (group_id, slug) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       updated_at = now()
     RETURNING *`,
    [groupId, name, slug, description || null, createdBy]
  )
  return res.rows[0]
}

export async function updateApi(id, fields) {
  const keys = []
  const values = []
  let i = 1
  for (const [k, v] of Object.entries(fields)) {
    keys.push(`${k} = $${i++}`)
    values.push(v)
  }
  values.push(id)
  const res = await query(
    `UPDATE apis SET ${keys.join(', ')}, updated_at = now()
     WHERE id = $${i} RETURNING *`,
    values
  )
  return res.rows[0]
}

export async function deleteApi(id) {
  await query('DELETE FROM apis WHERE id = $1', [id])
}
